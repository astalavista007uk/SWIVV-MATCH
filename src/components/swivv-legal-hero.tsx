import type { ComponentType } from "react";

// shared section card: soft diagonal fade + hairline border; one class so the four legal pages stay identical
export const LEGAL_CARD =
  "rounded-3xl border border-white/70 bg-gradient-to-br from-white via-[#f3f3f3] to-[#e8e8e8] p-6 ring-1 ring-black/[0.04] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_14px_30px_-16px_rgba(0,0,0,0.18)] transition-shadow duration-300 hover:shadow-[0_1px_1px_rgba(0,0,0,0.03),0_20px_40px_-18px_rgba(0,0,0,0.22)]";

// black pill used for cross-links at the bottom of the legal pages (same as the GDPR delete button)
export const LEGAL_PILL =
  "inline-flex items-center gap-1.5 rounded-full bg-[#111] px-4 py-2 text-sm font-medium text-white hover:bg-black";

// ponytail: one CSS-only hero (no images/deps) reused by the four legal pages — per-page identity comes from the icon; swap in art if brand illustrations ship
export function LegalHero({ title, subtitle, icon: Icon, tall = false }: { title: string; subtitle?: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; tall?: boolean }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#130710] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-32 h-[26rem] w-[34rem] rotate-[18deg] rounded-[42%] bg-[linear-gradient(135deg,#e60050_0%,#8c0040_55%,transparent_78%)] opacity-70 blur-2xl" />
        <div className="absolute -bottom-24 left-1/4 h-56 w-[30rem] -rotate-6 rounded-full bg-[#e60050]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(125deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_16px)]" />
        <Icon className="absolute -right-8 bottom-[-3rem] h-60 w-60 text-white/[0.06] sm:h-72 sm:w-72" strokeWidth={0.9} />
      </div>
      <div className={`relative mx-auto max-w-5xl px-4 ${tall ? "py-12 sm:py-14" : "py-8 sm:py-10"}`}>
        <h1 className="max-w-3xl text-[clamp(2.1rem,5.2vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
          {title}
        </h1>
        {subtitle && <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">{subtitle}</p>}
      </div>
      <div className="h-1.5 w-full bg-[linear-gradient(90deg,#e60050,#ff4f8b_45%,#5c0026)]" />
    </section>
  );
}
