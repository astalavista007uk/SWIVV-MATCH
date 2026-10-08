import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, X, Zap } from "lucide-react";
import { SWIVV_PROFILES } from "@/lib/swivv-data";
import { getBlocked, getLikes, toggleLike } from "@/lib/swivv-store";
import { useAuth } from "@/hooks/use-auth";
import { SwivvAuthButtons, openAuthModal, requireSwivvAuth } from "@/lib/swivv-auth";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/swipe")({
  head: () => ({ meta: [{ title: "SWIVV SWIPE — SWIVV" }] }),
  component: SwipePage,
});

function SwipePage() {
  const { user, loading } = useAuth();
  // ponytail: sessionStorage (per-tab, dies with the tab) — move to profile row in DB if skip-history ever needs to survive devices
  const [passed, setPassed] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem("swivv-passed");
      return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set<string>();
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem("swivv-passed", JSON.stringify([...passed]));
    } catch {
      /* private mode — deck just restarts */
    }
  }, [passed]);
  const [, setTick] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [dx, setDx] = useState(0);
  const [live, setLive] = useState(false);
  const startX = useRef<number | null>(null);
  // ponytail: ref not state — click fires after pointerup reset dx to 0, so state can't suppress the Link navigation; a drag library if gestures ever get complex
  const dragged = useRef(false);

  const sought = (() => {
    try {
      const c = localStorage.getItem("swivv-seeking");
      return c === "woman" || c === "man" ? c : null;
    } catch {
      return null;
    }
  })();

  const deck = useMemo(() => {
    const blocked = new Set(getBlocked());
    return SWIVV_PROFILES.filter((p) => !blocked.has(p.id) && (!sought || p.gender === sought) && !passed.has(p.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sought, passed]);
  const next = deck[1];
  const p = deck[0];

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    dragged.current = false;
    setLive(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startX.current == null) return;
    setDx(e.clientX - startX.current);
  }

  function onPointerEnd() {
    if (startX.current == null) return;
    const done = dx;
    startX.current = null;
    dragged.current = Math.abs(done) > 10;
    setLive(false);
    setDx(0);
    // ponytail: 100px commit threshold, no spring lib — framer-motion if swipe feel ever needs polish
    if (done < -100) pass();
    else if (done > 100) like();
  }

  function show(text: string) {
    setFlash(text);
    setTimeout(() => setFlash(null), 1600);
  }

  function pass() {
    if (!p) return;
    setPassed((s) => new Set(s).add(p.id));
  }

  function fav() {
    if (!p) return;
    requireSwivvAuth("like", () => {
      toggleLike(p.id);
      setTick((t) => t + 1);
    });
  }

  function like() {
    if (!p) return;
    requireSwivvAuth("like", () => {
      // ponytail: like recorded + match auto-check via toggleLike — real push/email to the other user when accounts message each other
      const r = toggleLike(p.id);
      show(r.matched ? `C'est un match avec ${p.name} !` : `${p.name} a été notifié de ton like.`);
      setPassed((s) => new Set(s).add(p.id));
    });
  }

  // ponytail: blank while the session restores — the connect screen flashing on every refresh is worse than a beat of nothing
  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
        <main className="mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-sm text-[#777]">Connecte-toi pour swiper les profils.</p>
          <button type="button" onClick={() => openAuthModal("account", "signin")} className="mt-4 rounded-md bg-[#007782] px-6 py-3 font-medium text-white">
            Se connecter / S&apos;inscrire
          </button>
        </main>
        <SwivvFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-md px-4 py-6">
        <h1 className="flex items-center justify-center gap-2 text-center text-2xl font-medium text-[#333]">
          <Zap className="h-6 w-6 text-[#e91e63]" aria-hidden="true" />
          SWIVV SWIPE
        </h1>
        {!p ? (
          <div className="mt-6 text-center">
            <img src="/swivv-s.png" alt="SWIVV" className="mx-auto h-16 w-16 object-contain" />
            <p className="mt-2 text-sm text-[#777]">Plus de profils pour l'instant. Reviens plus tard !</p>
            <Link to="/browse" search={{ q: "", type: "", location: "" }} className="mt-3 inline-block font-medium text-[#007782] hover:underline">
              Parcourir les profils
            </Link>
          </div>
        ) : (
          <div className="relative mt-4">
            {/* ponytail: no prev/next arrows — the deck filters on pass/like so there is no history to step through; drag + X/♥ buttons are the controls on all screens */}
            <div
              className="relative overflow-hidden rounded-2xl bg-white shadow-md"
            >
              {next && (
                <div className="absolute inset-x-0 top-0" aria-hidden="true">
                  <img src={next.photo} alt="" className="h-[62svh] w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-white">
                    <span className="block text-xl font-bold">{next.name}, {next.age}</span>
                    <span className="block text-sm opacity-90">{next.tagline}</span>
                    <span className="block text-sm opacity-90">{next.city}</span>
                  </span>
                </div>
              )}
              <div
                className="relative bg-white"
                style={{
                  transform: `translateX(${dx}px) rotate(${dx / 18}deg)`,
                  transition: live ? "none" : "transform 0.2s ease-out",
                }}
              >
                {/* ponytail: drag handlers live on the photo Link, not the card — container-level pointer capture retargets mouse clicks away from the X/♥ buttons (mobile tolerates it, desktop doesn't) */}
                <Link
                  to="/member/$id"
                  params={{ id: p.id }}
                  className="relative block [touch-action:pan-y]"
                  // ponytail: <a> tags are natively draggable on desktop — the ghost link-drag eats the pointer stream (touch has none, hence mobile worked); kill it, no dnd lib needed
                  onDragStart={(e) => e.preventDefault()}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerEnd}
                  onPointerCancel={onPointerEnd}
                  onClick={(e) => { if (dragged.current) { e.preventDefault(); dragged.current = false; } }}
                >
                  <img src={p.photo} alt={`Photo de ${p.name}`} className="h-[62svh] w-full object-cover" draggable={false} />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-white">
                    <span className="block text-xl font-bold">{p.name}, {p.age}</span>
                    <span className="block text-sm opacity-90">{p.tagline}</span>
                    <span className="block text-sm opacity-90">{p.city}</span>
                  </span>
                  {dx < -40 && (
                    <span
                      className="absolute left-1/2 top-1/3 -translate-x-1/2 rounded-full border border-border bg-white p-4 shadow-sm"
                      style={{ opacity: Math.min(1, -dx / 80) }}
                    >
                      <X className="h-7 w-7 text-red-600" />
                    </span>
                  )}
                  {dx > 40 && (
                    <span
                      className="absolute left-1/2 top-1/3 -translate-x-1/2 rounded-full bg-[#e91e63] p-4 shadow-sm"
                      style={{ opacity: Math.min(1, dx / 80) }}
                    >
                      <Heart className="h-7 w-7 fill-white text-white" />
                    </span>
                  )}
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 p-4">
                <button
                  type="button"
                  onClick={pass}
                  aria-label={`Passer ${p.name}`}
                  className="rounded-full border border-border bg-white p-4 shadow-sm hover:bg-[#f2f2f2]"
                >
                  <X className="h-7 w-7 text-red-600" />
                </button>
                <button
                  type="button"
                  onClick={fav}
                  aria-label={getLikes().includes(p.id) ? `Retirer le like de ${p.name}` : `Liker ${p.name}`}
                  aria-pressed={getLikes().includes(p.id)}
                  className="rounded-full border border-border bg-white p-4 shadow-sm hover:bg-[#f2f2f2]"
                >
                  <Heart className={`h-7 w-7 ${getLikes().includes(p.id) ? "fill-[#e91e63] text-[#e91e63]" : "text-black"}`} />
                </button>
                <button
                  type="button"
                  onClick={like}
                  aria-label={`Liker ${p.name}`}
                  className="rounded-full bg-[#e91e63] p-4 shadow-sm hover:brightness-110"
                >
                  <Heart className="h-7 w-7 fill-white text-white" />
                </button>
              </div>
            </div>
            {flash && (
              <p role="status" className="absolute inset-x-4 top-4 rounded-xl bg-black/75 p-3 text-center text-sm font-medium text-white">
                {flash}
              </p>
            )}
          </div>
        )}
        <p className="mt-3 text-center text-xs text-[#999]">Glisse vers la gauche pour passer, vers la droite pour liker — ou utilise les boutons.</p>
      </main>
      <SwivvFooter />
    </div>
  );
}
