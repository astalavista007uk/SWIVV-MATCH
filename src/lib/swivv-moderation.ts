// ponytail: client-side static list (FR + EN + common FR-Arabic slang) — move to a server table with per-language packs if moderation ever needs updating without a deploy or real "all languages" coverage
const WORDS = [
  // French profanity + insults
  "merde", "putain", "pute", "salope", "salaud", "connard", "connasse", "con", "conne",
  "encule", "enculer", "niquer", "nique", "baiser", "bite", "couille", "cul", "chier",
  "chiant", "foutre", "bordel", "batard", "abruti", "cretin", "debile", "imbecile",
  "garce", "petasse",
  // French slurs
  "pd", "pede", "tantouse", "gouine", "travelo", "negre", "negro", "bougnoule", "youpin", "chinetoque",
  // FR-Arabic slang insults
  "zebi", "nik",
  // English
  "fuck", "fucking", "shit", "bitch", "slut", "whore", "asshole", "dick", "pussy", "cunt",
  "bastard", "motherfucker", "faggot", "nigger", "nigga", "retard",
  // Spanish (common)
  "puta", "mierda", "cabron", "joder", "cono", "pendejo",
];

const RES = WORDS.map((w) => new RegExp(`\\b${w}\\b`));

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Matched offensive terms (deduplicated), or [] when clean. */
export function findOffensive(text: string): string[] {
  const t = normalize(text);
  return WORDS.filter((w, i) => RES[i].test(t));
}

/** Report reasons shared by photo and voice-note dialogs. */
export const REPORT_REASONS = ["Nudité ou contenu sexuel", "Contenu choquant", "Spam ou arnaque", "Usurpation d'identité", "Autre"];

/** Report reasons for the profile-page dialog (last item opens a free-text field). */
export const PROFILE_REPORT_REASONS = ["Photo inappropriée", "Langage offensant", "Faux profil", "Me demande de l'argent", "Autre"];
