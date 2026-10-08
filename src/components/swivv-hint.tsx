import type { ReactNode } from "react";

// ponytail: THE hover-hint style (dark bubble, white text, match-percentage look) — every icon tooltip uses this, no one-off titles or custom popovers
export function SwivvHint({ text, children, align = "center", narrow = false }: { text: ReactNode; children: ReactNode; align?: "center" | "left"; narrow?: boolean }) {
  return (
    <span className="group/hint relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute top-full z-10 mt-1 hidden rounded-lg bg-black p-2.5 text-[11px] font-normal leading-snug text-white shadow-lg group-hover/hint:block ${
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
