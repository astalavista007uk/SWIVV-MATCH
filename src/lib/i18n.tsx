import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { en } from "./locales/en";
import { es } from "./locales/es";

export const LANGS = ["fr", "en", "es"] as const;
export type Lang = (typeof LANGS)[number];
export type Vars = Record<string, string | number>;

export const LANG_COOKIE = "swivv_lang";
export const LANG_LABEL: Record<Lang, string> = { fr: "FR", en: "EN", es: "ES" };
export const DATE_LOCALE: Record<Lang, string> = { fr: "fr-FR", en: "en-GB", es: "es-ES" };

const DICTS: Record<Exclude<Lang, "fr">, Record<string, string>> = { en, es };

function asLang(raw: string | undefined | null): Lang {
  return raw === "en" || raw === "es" ? raw : "fr";
}

/**
 * ponytail: sentence-keyed dictionary — the French text IS the key, so no key naming,
 * no fr.ts, and a missing translation falls back to French instead of showing a raw key.
 * Ceiling: editing French copy silently drops its translation; upgrade to key-based
 * namespaces if the copy ever churns weekly.
 */
export const readLang = createIsomorphicFn()
  .server((): Lang => asLang(getCookie(LANG_COOKIE)))
  .client((): Lang => {
    const hit = document.cookie.match(/(?:^|;\s*)swivv_lang=([^;]*)/);
    return asLang(hit?.[1]);
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
