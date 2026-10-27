import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import { en } from "../src/lib/locales/en";
import { es } from "../src/lib/locales/es";
import { translate } from "../src/lib/i18n";

const SIGNUP_KEYS = [
  "Quelle est ta date de naissance ?",
  "Ta langue maternelle",
  "Tes centres d'intérêt",
  "Ignorer",
  "Créer mon compte",
  "Étape {n}/{total}",
  "Consens au traitement de tes données sensibles pour continuer.",
];

describe("signup i18n", () => {
  test("every signup key has en + es copy", () => {
    for (const k of SIGNUP_KEYS) {
      expect((en as Record<string, string>)[k]).toBeTruthy();
      expect((es as Record<string, string>)[k]).toBeTruthy();
    }
  });

  test("every signup question title/sub is translated in en + es", () => {
    const src = fs.readFileSync("src/routes/inscription.tsx", "utf8");
    const keys = new Set<string>();
    for (const m of src.matchAll(/\b(?:title|sub): "((?:[^"\\]|\\.)*)"/g)) keys.add(m[1]);
    expect(keys.size).toBeGreaterThan(40);
    const dictEn = en as Record<string, string>;
    const dictEs = es as Record<string, string>;
    expect([...keys].filter((k) => !dictEn[k])).toEqual([]);
    expect([...keys].filter((k) => !dictEs[k])).toEqual([]);
  });

  test("translate interpolates vars and falls back to French", () => {
    expect(translate("en", "Étape {n}/{total}", { n: 2, total: 6 })).toBe("Step 2/6");
    expect(translate("es", "Étape {n}/{total}", { n: 2, total: 6 })).toBe("Paso 2/6");
    expect(translate("en", "Texte jamais traduit")).toBe("Texte jamais traduit");
    expect(translate("fr", "Ta langue maternelle")).toBe("Ta langue maternelle");
  });
});
