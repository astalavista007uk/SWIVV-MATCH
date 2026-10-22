// Shared moderation engine: deterministic screening (FR/EN) + duplicate + post-block detectors.
// ponytail: severe-pattern sets only (threats, sexual solicitation, scam-money, channel-push) —
// full profanity/hate classification needs a provider; quoted/consensual contexts route to review, never auto-block
// ponytail: refs + matched patterns in logs, never bodies — logEvaluation stores categories, not content

export type ScreenHit = { category: string; severity: "warning" | "critical"; match: string };

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s", "!": "i", "€": "e", "2": "z", "6": "g", "9": "g" };

export function normalizeEvasion(s: string): { norm: string; compact: string } {
  const norm = s
    .toLowerCase()
    .split("")
    .map((c) => LEET[c] ?? c)
    .join("")
    .replace(/[^a-zàâäéèêëîïôöùûüç\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { norm, compact: norm.replace(/\s+/g, "") };
}

type Pat = { re: RegExp; category: string; severity: "warning" | "critical"; label: string };
const PATTERNS: Pat[] = [
  { re: /\b(je vais te tuer|je te tue|tu vas mourir|tu es mort|gorge|couteau|arme|descends|tabasser|casser la gueule)\b/, category: "threat", severity: "critical", label: "menace (FR)" },
  { re: /\b(i will kill you|i ll kill you|you will die|you are dead|knife|gun|beat you up|i know where you live)\b/, category: "threat", severity: "critical", label: "menace (EN)" },
  { re: /\b(je sais ou tu habites|je sais où tu habites|je te surveille|je te suis partout)\b/, category: "threat", severity: "critical", label: "intimidation (FR)" },
  { re: /\b(envoie (moi )?une? photos? nues?|photo(s)? nue(s)?|montre (moi )?ton corps|explicite|sans culotte)\b/, category: "sexual-solicitation", severity: "warning", label: "sollicitation sexuelle (FR)" },
  { re: /\b(send (me )?nudes?|naked pic|show your body|no panties)\b/, category: "sexual-solicitation", severity: "warning", label: "sollicitation sexuelle (EN)" },
  { re: /\b(virement|western union|moneygram|carte cadeau|gift card|bitcoin|usdt|crypto wallet|iban|rib|code de vérification|pr[eê]t d.argent|envoie (moi )?de l.argent)\b/, category: "scam-money", severity: "critical", label: "argent (FR)" },
  { re: /\b(send money|wire transfer|gift card|bank details|verification code|loan|investment opportunity|double your crypto)\b/, category: "scam-money", severity: "critical", label: "argent (EN)" },
];

const CHANNEL_RE = /\b(whatsapp|telegram|snap(chat)?|insta(gram)?|tiktok|signal|\+?\d[\d .()-]{7,}\d)\b/;
const QUOTED_RE = /["«»]|(^|\s)(il|elle) (m?a|dit|écrit)/;

/** Screen a text: returns hits. Quoted/consensual-adjacent matches downgrade to warning with a note. */
export function screenText(text: string | null | undefined): ScreenHit[] {
  if (!text || text.trim().length < 2) return [];
  const { norm, compact } = normalizeEvasion(text);
  const quoted = QUOTED_RE.test(text);
  const out: ScreenHit[] = [];
  for (const p of PATTERNS) {
    if (p.re.test(norm) || p.re.test(compact)) {
      const consensualDowngrade = p.category === "sexual-solicitation" && /\b(mon|ma|mon mari|ma femme|couple|consent|d.accord)\b/.test(norm);
      out.push({
        category: p.category,
        severity: quoted || consensualDowngrade ? "warning" : p.severity,
        match: `${p.label}${quoted ? " (contexte cité ?)" : ""}${consensualDowngrade ? " (contexte possiblement consenti ?)" : ""}`,
      });
    }
  }
  // romance-scam combo: external channel + money in the same text (contextual, not word-blocking)
  if (CHANNEL_RE.test(norm) && /argent|money|crypto|virement|invest/i.test(norm))
    out.push({ category: "scam-combo", severity: "critical", match: "canal externe + argent (combo arnaque sentimentale)" });
  return out;
}

/** Identical normalized bios/taglines (len > 20) shared by 2+ accounts — investigation signal only. */
export function dupBios(rows: { user_id: string; bio: string }[]): { text: string; users: string[] }[] {
  const by = new Map<string, { text: string; users: Set<string> }>();
  for (const r of rows) {
    const t = r.bio.trim().toLowerCase().replace(/\s+/g, " ");
    if (t.length <= 20) continue;
    const e = by.get(t) ?? { text: r.bio.trim().slice(0, 120), users: new Set<string>() };
    e.users.add(r.user_id);
    by.set(t, e);
  }
  return [...by.values()].filter((e) => e.users.size >= 2).map((e) => ({ text: e.text, users: [...e.users] }));
}

/** Messages sent after being blocked: actual sender S → recipient R with block R→S older than the message. */
export function postBlockContact(
  messages: { senderId: string; peerId: string; created_at: string }[],
  blocks: { blocker: string; blocked: string; created_at: string }[],
): { sender: string; recipient: string; at: string }[] {
  const bm = new Map<string, number>();
  for (const b of blocks) {
    const t = new Date(b.created_at).getTime();
    if (!Number.isFinite(t)) continue;
    const k = `${b.blocker}|${b.blocked}`;
    const p = bm.get(k);
    if (p == null || t < p) bm.set(k, t);
  }
  return messages.flatMap((m) => {
    const mt = new Date(m.created_at).getTime();
    const bt = bm.get(`${m.peerId}|${m.senderId}`);
    return bt != null && Number.isFinite(mt) && mt > bt ? [{ sender: m.senderId, recipient: m.peerId, at: m.created_at }] : [];
  });
}
