import { FAQ_UI } from "./types";
import type { FaqCategory } from "./types";
import en from "./en";
import fr from "./fr";

export { FAQ_UI } from "./types";
export type { FaqCategory, FaqQa } from "./types";

export const FAQ_BY_LANG: Record<string, FaqCategory[]> = { en, fr };
