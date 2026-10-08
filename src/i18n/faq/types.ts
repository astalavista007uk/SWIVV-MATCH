/* Shared types and UI chrome strings for the FAQ page.
   Q&A content lives in the per-language files alongside this one. */

export type FaqQa = { id: string; q: string; keywords: string; a: string };
export type FaqCategory = { id: string; title: string; questions: FaqQa[] };

export type FaqUi = {
  heroTitle: string;
  heroSub: string;
  heroSubLink: string;
  searchPh: (n: number) => string;
  noResults: (q: string) => string;
  clearSearch: string;
  stillHaveQ: string;
  stillHaveDesc: string;
  contactSupport: string;
};

export const FAQ_UI: Record<string, FaqUi> = {
  en: {
    heroTitle: "Frequently Asked Questions",
    heroSub: "Everything you need to know about booking, selling, payments, and more. Can't find an answer?",
    heroSubLink: "Contact us",
    searchPh: (n) => `Search ${n} questions…`,
    noResults: (q) => `No questions match "${q}".`,
    clearSearch: "Clear search",
    stillHaveQ: "Still have a question?",
    stillHaveDesc: "Our team is happy to help with anything not covered here.",
    contactSupport: "Contact Support",
  },
  fr: {
    heroTitle: "Questions fréquentes",
    heroSub: "Tout ce qu'il faut savoir sur les réservations, les ventes, les paiements et plus encore. Vous ne trouvez pas de réponse ?",
    heroSubLink: "Contactez-nous",
    searchPh: (n) => `Rechercher parmi ${n} questions…`,
    noResults: (q) => `Aucune question ne correspond à « ${q} ».`,
    clearSearch: "Effacer la recherche",
    stillHaveQ: "Vous avez encore une question ?",
    stillHaveDesc: "Notre équipe se fera un plaisir de vous aider pour tout ce qui n'est pas couvert ici.",
    contactSupport: "Contacter le support",
  },
};
