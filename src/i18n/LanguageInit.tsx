import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANG_STORAGE_KEY, SUPPORTED_LANGUAGES } from "@/i18n";

/**
 * Applies the persisted language choice after mount.
 * French is the default — English is only applied when the user chose it.
 * Runs only on the client, so it never causes SSR hydration mismatches.
 */
export function LanguageInit() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    let target: string | null = null;
    try {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (stored && codes.includes(stored as (typeof codes)[number])) target = stored;
    } catch {
      /* localStorage unavailable */
    }
    if (target && target !== i18n.language) {
      void i18n.changeLanguage(target);
    }
    document.documentElement.lang = i18n.resolvedLanguage ?? "fr";
    document.documentElement.dir = "ltr";
  }, [i18n]);

  useEffect(() => {
    const onChange = (lng: string) => {
      try { window.localStorage.setItem(LANG_STORAGE_KEY, lng); } catch { /* noop */ }
      document.documentElement.lang = lng;
      document.documentElement.dir = "ltr";
    };
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, [i18n]);

  return null;
}
