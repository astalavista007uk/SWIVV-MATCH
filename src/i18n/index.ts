import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";

export const SUPPORTED_LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
] as const;

export const LANG_STORAGE_KEY = "petworld_lang";

if (!i18n.isInitialized) {
  // On the client, read the persisted choice synchronously so the very first
  // render uses the correct language (no flash of wrong text on refresh).
  // French is the default — English is only used when explicitly chosen.
  let initialLng = "fr";
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      if (stored && codes.includes(stored as (typeof codes)[number])) {
        initialLng = stored;
      }
    } catch {
      /* localStorage unavailable */
    }
  }

  i18n.use(initReactI18next).init({
    resources,
    lng: initialLng,
    fallbackLng: "fr",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
