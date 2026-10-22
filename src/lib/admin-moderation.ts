// Moderation helpers: deterministic content flags + AI integration stub.
// ponytail: rules only (URLs, phones, handles, spam words) — a model plugs in behind aiAvailable(), flags stay as the fallback
// ponytail: flags describe CONTENT patterns only — never appearance, ethnicity, religion, disability or any protected attribute

export type Flags = { url: boolean; phone: boolean; handle: boolean; spam: boolean };

const URL_RE = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|fr|net|org|io|me|link|xyz|top|site|online|store)\b)/i;
const PHONE_RE = /(\+?\d[\d .()-]{7,}\d)/;
const HANDLE_RE = /(@[a-z0-9_.]{2,}|snap(chat)?|insta(gram)?|tiktok|telegram|whatsapp|snap:|insta:)/i;
const SPAM_RE = /(crypto|investis?sement|gagne[rz] de l'argent|revenu passif|onlyfans|escort|tarif|paiement|virement|bitcoin|forex|paris sportifs)/i;
const HATE_RE = null; // ponytail: no wordlist shipped — hate-speech review stays fully human until a proper classifier is integrated

export function flagText(text: string | null | undefined): Flags {
  const t = text ?? "";
  return {
    url: URL_RE.test(t),
    phone: PHONE_RE.test(t),
    handle: HANDLE_RE.test(t),
    spam: SPAM_RE.test(t),
  };
}

export function flagReasons(f: Flags): string[] {
  const out: string[] = [];
  if (f.url) out.push("lien externe");
  if (f.phone) out.push("téléphone");
  if (f.handle) out.push("réseau social");
  if (f.spam) out.push("spam présumé");
  return out;
}

/** AI integration point: no provider is configured, so this always reports unavailable. */
export function aiAvailable(): boolean {
  return false;
}

export async function requestAiSummary(_ref: string): Promise<string> {
  throw new Error("IA non configurée — aucun fournisseur branché (voir swivv_mod_policies pour les règles actives).");
}
