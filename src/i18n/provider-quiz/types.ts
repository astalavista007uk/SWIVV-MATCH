export interface QuizQuestion {
  id: string;
  species: "dog" | "cat";
  q: string;
  options: string[];
  correct: number;
  explain: string;
}
