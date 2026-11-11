import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export type RequestEventDetail = { id: string; name?: string; photo?: string; message?: string };

/** Annonce une demande de connexion reçue, sur n'importe quelle page — la validation se fait dans Messages. */
export function SwivvRequestPopup() {
  const nav = useNavigate();
  const [req, setReq] = useState<RequestEventDetail | null>(null);

  useEffect(() => {
    const onRequest = (e: Event) => {
      const d = (e as CustomEvent<RequestEventDetail>).detail;
      if (!d?.id) return;
      setReq(d);
    };
    window.addEventListener("swivv:request", onRequest);
    return () => window.removeEventListener("swivv:request", onRequest);
  }, []);

  return (
    <Dialog open={!!req} onOpenChange={(o) => !o && setReq(null)}>
      <DialogContent
        className="max-w-sm z-[120]"
        // ponytail: the profile page's request modal is a higher z-index plain div — without this, clicking it counts as an outside click and dismisses this popup
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c5c66]">Nouvelle demande de connexion</p>
        <div className="mt-2 flex items-center gap-3">
          <img
            src={req?.photo || "/swivv-s.png"}
            alt={req?.name ? `Photo de ${req.name}` : ""}
            className="h-12 w-12 rounded-full object-cover"
          />
          <DialogTitle className="text-left text-lg font-medium text-[#333]">{req?.name || "Membre SWIVV"}</DialogTitle>
        </div>
        <DialogDescription className="whitespace-pre-wrap rounded-lg bg-[#f7f7f7] p-3 text-sm text-[#333]">
          {req?.message}
        </DialogDescription>
        <button
          type="button"
          onClick={() => {
            setReq(null);
            nav({ to: "/messagerie" });
          }}
          className="w-full rounded-lg bg-[#e60050] px-4 py-2.5 text-sm font-medium text-white"
        >
          Voir la demande
        </button>
        <button
          type="button"
          onClick={() => setReq(null)}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-[#555]"
        >
          Plus tard
        </button>
      </DialogContent>
    </Dialog>
  );
}

export type RequestAnswerDetail = {
  id: string;
  peerId?: string;
  accepted: boolean;
  text: boolean;
  voice: boolean;
  files: boolean;
};

/** Annonce à l'expéditeur la réponse (acceptée/refusée) et les fonctionnalités autorisées. */
export function SwivvRequestAnswerPopup() {
  const nav = useNavigate();
  const [answer, setAnswer] = useState<(RequestAnswerDetail & { name?: string; photo?: string }) | null>(null);

  useEffect(() => {
    const onAnswer = (e: Event) => {
      const d = (e as CustomEvent<RequestAnswerDetail>).detail;
      if (!d?.id) return;
      setAnswer(d);
      if (!d.peerId) return;
      void supabase
        .from("swivv_profiles")
        .select("data")
        .eq("user_id", d.peerId)
        .maybeSingle()
        .then(({ data }) => {
          const p = data?.data as { name?: string; photos?: string[] } | undefined;
          setAnswer((cur) => (cur?.id === d.id ? { ...cur, name: p?.name || "Membre SWIVV", photo: p?.photos?.[0] || "" } : cur));
        });
    };
    window.addEventListener("swivv:request-answer", onAnswer);
    return () => window.removeEventListener("swivv:request-answer", onAnswer);
  }, []);

  const allowed = answer
    ? [answer.text && "Texte", answer.voice && "Vocaux", answer.files && "Pièces jointes"].filter(Boolean).join(", ")
    : "";

  return (
    <Dialog open={!!answer} onOpenChange={(o) => !o && setAnswer(null)}>
      <DialogContent
        className="max-w-sm z-[120]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="text-lg font-medium text-[#333]">
          {answer?.accepted ? "Demande acceptée" : "Demande refusée"}
        </DialogTitle>
        <div className="flex items-center gap-3">
          <img
            src={answer?.photo || "/swivv-s.png"}
            alt={answer?.name ? `Photo de ${answer.name}` : ""}
            className="h-12 w-12 rounded-full object-cover"
          />
          <DialogDescription className="text-sm text-[#555]">
            {answer?.accepted
              ? `${answer.name || "Ce membre"} a accepté ta demande de connexion.`
              : `${answer?.name || "Ce membre"} a refusé ta demande de connexion. Tu pourras réessayer dans 7 jours.`}
          </DialogDescription>
        </div>
        {answer?.accepted && (
          <p className="rounded-lg bg-[#f7f7f7] p-3 text-sm text-[#333]">
            {allowed ? `Autorisé : ${allowed}.` : "Aucune fonctionnalité n'est autorisée pour l'instant."}
          </p>
        )}
        {answer?.accepted ? (
          <button
            type="button"
            onClick={() => {
              setAnswer(null);
              nav({ to: "/messagerie" });
            }}
            className="w-full rounded-lg bg-[#e60050] px-4 py-2.5 text-sm font-medium text-white"
          >
            Ouvrir la conversation
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setAnswer(null)}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-[#555]"
        >
          {answer?.accepted ? "Plus tard" : "Fermer"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
