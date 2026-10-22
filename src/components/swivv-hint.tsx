import type { ReactNode } from "react";

// ponytail: THE hover-bubble skin (black bg, white text, match-percentage look) — charts import HINT_SKIN too, so every popup shares one definition
export const HINT_SKIN = "rounded-lg bg-black text-[11px] font-normal leading-snug text-white shadow-lg";

// ponytail: THE hover-hint style — every icon tooltip uses this, no one-off titles or custom popovers
export function SwivvHint({ text, children, align = "center", narrow = false, above = false }: { text: ReactNode; children: ReactNode; align?: "center" | "left"; narrow?: boolean; above?: boolean }) {
  return (
    <span className="group/hint relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute z-10 hidden p-2.5 group-hover/hint:block ${HINT_SKIN} ${
          above ? "bottom-full mb-1" : "top-full mt-1"
        } ${
          narrow ? "w-auto whitespace-nowrap px-2.5 py-1.5" : "w-48"
        } ${
          align === "center" ? "left-1/2 -translate-x-1/2 text-center" : "left-0 text-left"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
