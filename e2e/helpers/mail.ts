import { createRequire } from "node:module";
import { MAIL_PASS, MAIL_USER } from "./env";

// ponytail: imapflow's ESM build imports libmime's ESM build, which resolves a
// nested iconv-lite path that does not exist under Bun. The CJS build is stable.
const require = createRequire(import.meta.url);
const { ImapFlow } = require("imapflow") as typeof import("imapflow");

function decodeQuotedPrintable(input: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "=" && /^[0-9a-f]{2}$/i.test(input.slice(i + 1, i + 3))) {
      bytes.push(parseInt(input.slice(i + 1, i + 3), 16));
      i += 2;
    } else if (input[i] === "=" && /^\r?\n$/.test(input.slice(i + 1, i + 3))) {
      i += input[i + 1] === "\r" ? 2 : 1;
    } else {
      const code = input.charCodeAt(i);
      bytes.push(code > 255 ? 0x20 : code);
    }
  }
  return Buffer.from(bytes).toString("utf8");
}

export type Mail = {
  uid: number;
  subject: string;
  text: string;
  html: string;
};

function client(user = MAIL_USER) {
  return new ImapFlow({
    host: "imap.ionos.fr",
    port: 993,
    secure: true,
    auth: { user, pass: MAIL_PASS },
    logger: false,
  });
}

async function connected<T>(fn: (c: ImapFlow) => Promise<T>, user?: string): Promise<T> {
  const c = client(user);
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.logout().catch(() => {});
  }
}

export async function maxUid(user?: string): Promise<number> {
  return connected(async (c) => {
    const lock = await c.getMailboxLock("INBOX");
    try {
      const uids = await c.search({ all: true }, { uid: true });
      return uids.length ? Math.max(...uids) : 0;
    } finally {
      lock.release();
    }
  });
}

export async function waitForMail({
  subjectIncludes,
  bodyIncludes,
  minUid,
  user,
  timeoutMs = 90_000,
}: {
  subjectIncludes?: string;
  bodyIncludes?: string;
  minUid?: number;
  user?: string;
  timeoutMs?: number;
}): Promise<Mail> {
  return connected(async (c) => {
    const lock = await c.getMailboxLock("INBOX");
    try {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const uids = await c.search({ all: true }, { uid: true });
        const fresh = uids.filter((uid) => minUid == null || uid > minUid).reverse();
        for (const uid of fresh) {
          const head = await c.fetchOne(uid, { envelope: true });
          if (!head) continue;
          if (subjectIncludes && !head.envelope.subject.includes(subjectIncludes)) continue;
          const full = await c.fetchOne(uid, { source: true });
          if (!full?.source) continue;
          const raw = full.source.toString("utf8");
          const text = decodeQuotedPrintable(raw);
          if (bodyIncludes && !text.includes(bodyIncludes)) continue;
          return {
            uid,
            subject: head.envelope.subject,
            text,
            html: raw,
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      throw new Error(`No email matching "${subjectIncludes ?? bodyIncludes}" after ${timeoutMs}ms`);
    } finally {
      lock.release();
    }
  }, user);
}

export async function deleteMail(uids: number[], user?: string) {
  if (!uids.length) return;
  await connected(async (c) => {
    const lock = await c.getMailboxLock("INBOX");
    try {
      await c.messageDelete(uids.join(","), { uid: true });
    } finally {
      lock.release();
    }
  }, user);
}
