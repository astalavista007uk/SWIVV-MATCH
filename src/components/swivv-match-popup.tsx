import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export type MatchEventDetail = { id: string; name?: string; photo?: string };

/** Annonce le match mutuel (like réciproque) — l'envoi d'un message reste soumis à une demande de connexion. */
export function SwivvMatchPopup() {
  const nav = useNavigate();
  const [match, setMatch] = useState<MatchEventDetail | null>(null);

  useEffect(() => {
    const onMatch = (e: Event) => {
      const d = (e as CustomEvent<MatchEventDetail>).detail;
      if (!d?.id) return;
      setMatch(d);
      if (d.name) return;
      const uid = d.id.replace(/^u:/, "");
      void supabase
        .from("swivv_profiles")
        .select("data")
        .eq("user_id", uid)
        .maybeSingle()
        .then(({ data }) => {
          const p = data?.data as { name?: string; photos?: string[] } | undefined;
          setMatch((cur) => (cur?.id === d.id ? { ...cur, name: p?.name || "Membre SWIVV", photo: p?.photos?.[0] || "" } : cur));
        });
    };
    window.addEventListener("swivv:match", onMatch);
    return () => window.removeEventListener("swivv:match", onMatch);
  }, []);

  return (
    <Dialog open={!!match} onOpenChange={(o) => !o && setMatch(null)}>
      <DialogContent className="max-w-sm border-0 bg-[#17171a] p-8 text-center text-white">
        <DialogTitle className="text-3xl font-black italic text-white">C&apos;est un match !</DialogTitle>
        <DialogDescription className="text-sm text-white/80">
          Toi et {match?.name || "ce membre"} vous êtes likés mutuellement. Envoyez une demande de connexion pour discuter.
        </DialogDescription>
        {match?.photo && (
          <img src={match.photo} alt={match.name ? `Photo de ${match.name}` : ""} className="mx-auto my-2 h-24 w-24 rounded-full border-4 border-white object-cover" />
        )}
        <button
          type="button"
          onClick={() => {
            if (!match) return;
            const id = match.id;
            setMatch(null);
            nav({ to: "/member/$id", params: { id } });
          }}
          className="w-full rounded-full bg-gradient-to-r from-[#ff5722] to-[#e60050] px-6 py-3 font-bold uppercase tracking-wide text-white hover:brightness-110"
        >
          Voir le profil
        </button>
        <button
          type="button"
          onClick={() => setMatch(null)}
          className="w-full rounded-full border border-white/60 px-6 py-3 font-bold uppercase tracking-wide text-white hover:bg-white/10"
        >
          Plus tard
        </button>
      </DialogContent>
    </Dialog>
  );
}
