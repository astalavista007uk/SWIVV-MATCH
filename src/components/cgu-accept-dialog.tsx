import { useState } from "react";
import { ARTICLES } from "@/routes/legal.terms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CguAcceptDialog({ open, onOpenChange, onAccept }: { open: boolean; onOpenChange: (v: boolean) => void; onAccept: () => void }) {
  const [atBottom, setAtBottom] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle>CGU détaillées</DialogTitle>
        </DialogHeader>
        {/* ponytail: scroll-gated accept stored in localStorage by callers, not server-stamped — add DB timestamp if legal proof needs it */}
        <div
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setAtBottom(true);
          }}
          className="max-h-[55vh] overflow-y-auto rounded-md border border-border p-4"
          tabIndex={0}
        >
          {ARTICLES.map(([t, d]) => (
            <article key={t} className="mb-4">
              <h2 className="font-medium text-[#333]">{t}</h2>
              {d.split("\n\n").map((b, i) =>
                b.split("\n").every((l) => l.startsWith("•")) ? (
                  <ul key={i} className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#555]">
                    {b.split("\n").map((l) => (
                      <li key={l}>{l.replace(/^•\s*/, "")}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i} className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#555]">{b}</p>
                ),
              )}
            </article>
          ))}
        </div>
        <p className="text-xs text-[#777]">{atBottom ? "Tu as tout lu — tu peux accepter." : "Fais défiler jusqu'en bas pour pouvoir accepter."}</p>
        <button type="button" disabled={!atBottom} onClick={() => { onAccept(); onOpenChange(false); }} className="rounded-md bg-[#e91e63] px-6 py-3 font-medium text-white disabled:opacity-40">
          Accepter
        </button>
      </DialogContent>
    </Dialog>
  );
}
