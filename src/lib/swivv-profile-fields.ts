import type { SwivvProfile } from "@/lib/swivv-data";

// ponytail: single % definition (flow header + mon-profil + progress page) — 44 fields mirroring PRE_Q+POST_Q; 0 counts as filled
export const REQUIRED_PROFILE_FIELDS: (keyof SwivvProfile)[] = [
  "name",
  "gender",
  "seeking",
  "city",
  "country",
  "lookingFor",
  "maritalStatus",
  "tagline",
  "bio",
  "heightCm",
  "weightKg",
  "hairColor",
  "eyeColor",
  "bodyStyle",
  "ethnicity",
  "selfAppearance",
  "bestFeature",
  "occupation",
  "education",
  "drink",
  "smoke",
  "drugs",
  "eatingHabits",
  "employmentStatus",
  "annualIncome",
  "livingSituation",
  "willingToRelocate",
  "hasPets",
  "wantsMorePets",
  "haveChildren",
  "wantMoreChildren",
  "brothersCount",
  "sistersCount",
  "birthRank",
  "parentsMaritalStatus",
  "nationality",
  "firstLanguage",
  "bornOrConverted",
  "religion",
  "religiousValues",
  "familyValues",
  "interests",
  "photos",
];

export const PROFILE_FIELD_LABELS: Record<string, string> = {
  name: "Nom",
  birthdate: "Date de naissance",
  gender: "Genre",
  seeking: "Recherche",
  city: "Ville",
  country: "Pays",
  lookingFor: "Type de relation recherché",
  maritalStatus: "Situation matrimoniale",
  tagline: "Titre du profil",
  bio: "Présentation",
  heightCm: "Taille",
  weightKg: "Poids",
  hairColor: "Couleur de cheveux",
  eyeColor: "Couleur des yeux",
  bodyStyle: "Silhouette",
  ethnicity: "Origine",
  selfAppearance: "Style",
  bestFeature: "Atout",
  occupation: "Profession",
  education: "Études",
  drink: "Alcool",
  smoke: "Tabac",
  drugs: "Drogues",
  eatingHabits: "Alimentation",
  employmentStatus: "Emploi",
  annualIncome: "Revenus",
  livingSituation: "Logement",
  willingToRelocate: "Mobilité",
  hasPets: "Animaux",
  wantsMorePets: "Autres animaux souhaités",
  haveChildren: "Enfants",
  wantMoreChildren: "Autres enfants souhaités",
  brothersCount: "Frères",
  sistersCount: "Sœurs",
  birthRank: "Rang dans la fratrie",
  parentsMaritalStatus: "Situation des parents",
  nationality: "Nationalité",
  firstLanguage: "Langue maternelle",
  bornOrConverted: "Parcours religieux",
  religion: "Religion",
  religiousValues: "Valeurs religieuses",
  familyValues: "Valeurs familiales",
  interests: "Centres d'intérêt",
  photos: "Photos",
};

function isFilled(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  return !!String(v ?? "").trim();
}

export function profileCompleteness(p: SwivvProfile | null | undefined): number {
  if (!p) return 0;
  const filled = REQUIRED_PROFILE_FIELDS.filter((k) => isFilled(p[k])).length;
  return Math.round((filled / REQUIRED_PROFILE_FIELDS.length) * 100);
}

/** First required field still empty — the single next action shown on the progress page. */
export function nextProfileStep(
  p: SwivvProfile | null | undefined,
): { field: keyof SwivvProfile; label: string; to: string } | null {
  const missing = REQUIRED_PROFILE_FIELDS.find((k) => !isFilled(p?.[k]));
  if (!missing) return null;
  return {
    field: missing,
    label: PROFILE_FIELD_LABELS[String(missing)] ?? String(missing),
    // ponytail: existing missing-only pass deep link — a plain /inscription visit restores the saved flow position instead of the gap
    to: missing === "photos" ? "/mon-profil" : "/inscription?revoir=manquantes",
  };
}
