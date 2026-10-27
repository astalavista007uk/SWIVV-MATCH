import { LANGS, LANG_LABEL, setLang, useLang, useT } from "@/lib/i18n";

// ponytail: one switch, rendered in the footer (bottom-left) and in Paramètres — no third copy
export function SwivvLangSwitch({ className = "" }: { className?: string }) {
  const t = useT();
  const lang = useLang();
  return (
    <div className={`flex items-center gap-1 text-xs ${className}`} aria-label={t("Langue")}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-current={lang === l ? "true" : undefined}
          onClick={() => lang !== l && setLang(l)}
          className={`rounded px-2 py-1 font-medium ${
            lang === l ? "bg-[#e60050] text-white" : "text-[#555] hover:text-[#e60050]"
          }`}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
