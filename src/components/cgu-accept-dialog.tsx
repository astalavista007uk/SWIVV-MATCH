import { useState } from "react";
import { ARTICLES, LegalArticleBody } from "@/routes/legal.terms";
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
              <LegalArticleBody body={d} />
            </article>
          ))}
        </div>
        <p className="text-xs text-[#5c5c66]">{atBottom ? "Tu as tout lu — tu peux accepter." : "Fais défiler jusqu'en bas pour pouvoir accepter."}</p>
        <button type="button" disabled={!atBottom} onClick={() => { onAccept(); onOpenChange(false); }} className="rounded-md bg-[#e60050] px-6 py-3 font-medium text-white disabled:opacity-40">
          Accepter
        </button>
      </DialogContent>
    </Dialog>
  );
}
