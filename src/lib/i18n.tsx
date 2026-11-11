import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie, getRequest } from "@tanstack/react-start/server";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { LANG_COOKIE, langFromCountry, type Lang } from "./swivv-lang";

export { LANGS, LANG_COOKIE, langFromCountry, type Lang } from "./swivv-lang";
export type Vars = Record<string, string | number>;

export const LANG_LABEL: Record<Lang, string> = { fr: "FR", en: "EN", es: "ES" };
export const DATE_LOCALE: Record<Lang, string> = { fr: "fr-FR", en: "en-GB", es: "es-ES" };
export const OG_LOCALE: Record<Lang, string> = { fr: "fr_FR", en: "en_US", es: "es_ES" };

const DICTS: Record<Exclude<Lang, "fr">, Record<string, string>> = { en, es };

function pickLang(raw: string | undefined | null): Lang | undefined {
  return raw === "en" || raw === "es" || raw === "fr" ? raw : undefined;
}

/**
 * ponytail: sentence-keyed dictionary — the French text IS the key, so no key naming,
 * no fr.ts, and a missing translation falls back to French instead of showing a raw key.
 * Ceiling: editing French copy silently drops its translation; upgrade to key-based
 * namespaces if the copy ever churns weekly.
 */
export const readLang = createIsomorphicFn()
  .server((): Lang => {
    const chosen = pickLang(getCookie(LANG_COOKIE));
    if (chosen) return chosen;
    const headers = getRequest().headers;
    return langFromCountry(
      headers.get("cf-ipcountry") ?? headers.get("x-country"),
      headers.get("x-country-region"),
    );
  })
  .client((): Lang => {
    const hit = document.cookie.match(/(?:^|;\s*)swivv_lang=([^;]*)/);
    return pickLang(hit?.[1]) ?? pickLang(document.documentElement.lang) ?? "fr";
  });

export function translate(lang: Lang, fr: string, vars?: Vars): string {
  const raw = lang === "fr" ? fr : (DICTS[lang][fr] ?? fr);
  if (!vars) return raw;
  // ponytail: plain {var} replacement, no ICU — add plural keys when a count needs one
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function setLang(next: Lang) {
  document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  location.reload();
}

const LangContext = createContext<Lang>("fr");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const lang = useLang();
  // ponytail: accepts any string so module-level copy arrays can be translated at render without casts;
  // coverage is verified by the route crawl, not the compiler
  return useMemo(() => (fr: string, vars?: Vars) => translate(lang, fr, vars), [lang]);
}

export function useDateLocale() {
  return DATE_LOCALE[useLang()];
}
