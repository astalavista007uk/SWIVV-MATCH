import type { QuizQuestion } from "./types";
import en from "./en";
import fr from "./fr";

export type { QuizQuestion } from "./types";

/** Minimum fraction of correct answers required to pass (8 of 10). */
export const QUIZ_PASS_RATIO = 0.8;

export const QUIZ_BY_LANG: Record<string, QuizQuestion[]> = { en, fr };

export function getQuiz(lang: string): QuizQuestion[] {
  return QUIZ_BY_LANG[lang?.split("-")[0] ?? "en"] ?? en;
}
