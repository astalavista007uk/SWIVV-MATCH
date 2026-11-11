import { describe, expect, test } from "bun:test";
import { answerSupport, fuzzyMatches, SUPPORT_STARTERS } from "../src/lib/support-kb";

describe("support assistant", () => {
  test("answers the same topic in FR, EN and ES", () => {
    expect(answerSupport("comment supprimer mon compte", "fr").to).toBe("/parametres");
    expect(answerSupport("how do I delete my account", "en").to).toBe("/parametres");
    expect(answerSupport("como borrar mi cuenta", "es").to).toBe("/parametres");
  });

  test("survives predictive-text typos", () => {
    expect(answerSupport("inscrption", "fr").to).toBe("/inscription");
    expect(answerSupport("mesage", "fr").to).toBe("/messagerie");
    expect(answerSupport("passwrd", "en").to).toBe("/contact-us");
  });

  test("keeps feature answers localized", () => {
    expect(answerSupport("video call", "en").to).toBe("/comment-ca-marche");
    expect(answerSupport("llamada video", "es").to).toBe("/comment-ca-marche");
    expect(answerSupport("facture", "fr").to).toBe("/facturation");
  });

  test("covers the legal pages separately", () => {
    expect(answerSupport("conditions d'utilisation", "fr").to).toBe("/terms-and-conditions");
    expect(answerSupport("cgv", "fr").to).toBe("/cgv");
    expect(answerSupport("terms of sale", "en").to).toBe("/cgv");
    expect(answerSupport("politique cookies", "fr").to).toBe("/cookies");
    expect(answerSupport("cookie policy", "en").to).toBe("/cookies");
    expect(answerSupport("condiciones de uso", "es").to).toBe("/terms-and-conditions");
  });

  test("covers privacy, export and deletion request", () => {
    expect(answerSupport("qui peut voir mon profil", "fr").to).toBe("/parametres");
    expect(answerSupport("exporter mes donnees", "fr").to).toBe("/privacy-centre");
    expect(answerSupport("supprimer mes donnees", "fr").to).toBe("/privacy-centre");
    expect(answerSupport("download my data", "en").to).toBe("/privacy-centre");
    expect(answerSupport("rgpd", "fr").to).toBe("/privacy-centre");
    expect(answerSupport("taille maximale des fichiers", "fr").to).toBe("/faq");
    expect(answerSupport("voice note size limit", "en").to).toBe("/faq");
    expect(answerSupport("comment de temps restent mes messages", "fr").to).toBe("/privacy-centre");
    expect(answerSupport("combien de temps sont conserves mes messages", "fr").to).toBe("/privacy-centre");
    expect(answerSupport("how long are messages kept", "en").to).toBe("/privacy-centre");
  });

  test("covers verification, photos, progress and contact", () => {
    expect(answerSupport("piece d'identite", "fr").to).toBe("/verification");
    expect(answerSupport("selfie", "fr").to).toBe("/verification");
    expect(answerSupport("changer photo principale", "fr").to).toBe("/mon-profil");
    expect(answerSupport("ma progression", "fr").to).toBe("/progress");
    expect(answerSupport("delai de reponse", "fr").to).toBe("/contact-us");
    expect(answerSupport("postal address", "en").to).toBe("/cgv");
  });

  test("still answers the core flows", () => {
    expect(answerSupport("comment supprimer mon compte", "fr").to).toBe("/parametres");
    expect(answerSupport("comment creer un compte", "fr").to).toBe("/inscription");
    expect(answerSupport("mot de passe oublie", "fr").to).toBe("/contact-us");
    expect(answerSupport("prix", "fr").matched).toBe(true);
    expect(answerSupport("unmatch", "en").to).toBe("/messagerie");
  });

  test("greets and thanks", () => {
    expect(answerSupport("bonjour", "fr").matched).toBe(true);
    expect(answerSupport("hello", "en").matched).toBe(true);
    expect(answerSupport("hola", "es").matched).toBe(true);
    expect(answerSupport("merci", "fr").matched).toBe(true);
  });

  test("falls back instead of guessing", () => {
    const a = answerSupport("xyzzy", "fr");
    expect(a.matched).toBe(false);
    expect(a.to).toBe("/contact-us");
    expect(answerSupport("", "en").matched).toBe(false);
  });

  test("filters FAQ text across languages and typos", () => {
    expect(fuzzyMatches("Comment créer mon profil ?", "creer profil")).toBe(true);
    expect(fuzzyMatches("Cómo borrar mi cuenta", "borrar cuenta")).toBe(true);
    expect(fuzzyMatches("How do I delete my account?", "delete account")).toBe(true);
    expect(fuzzyMatches("Comment créer mon profil ?", "photo")).toBe(false);
  });

  test("greets in every language", () => {
    for (const lang of ["fr", "en", "es"] as const) {
      expect(SUPPORT_STARTERS[lang].length).toBeGreaterThan(20);
    }
  });
});
