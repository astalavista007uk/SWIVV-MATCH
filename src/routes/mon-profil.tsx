import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SwivvAuthButtons, awaitPendingSave, getMyProfile, getMyRawProfile, openAuthModal, profileCompleteness, saveMyProfile, useSwivvUser } from "@/lib/swivv-auth";
import { shrinkDataUrl } from "@/routes/inscription";
import { useAuth } from "@/hooks/use-auth";
import type { SwivvProfile } from "@/lib/swivv-data";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvProfileView } from "@/components/swivv-profile-view";

export const Route = createFileRoute("/mon-profil")({
  head: () => ({ meta: [{ title: "Mon profil — SWIVV" }] }),
  component: MyProfilePage,
});

function MyProfilePage() {
  const user = useSwivvUser();
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<SwivvProfile | null | undefined>(undefined);

  // ponytail: selfie-condemned photos purge on profile visit (fingerprint match only) — manual album edits stay in Mon profil/inscription
  // ponytail: one-time slim of legacy full-size dataURLs on visit (same photos, ~10x lighter — future uploads shrink at eachImageUrl); drop once rows turn over
  const slimmed = useRef(false);
  useEffect(() => {
    if (!authUser || !profile || slimmed.current) return;
    let condemned: { len: number; head: string }[] = [];
    try {
      condemned = JSON.parse(localStorage.getItem("swivv-photo-purge") ?? "[]") as { len: number; head: string }[];
    } catch {}
    if (condemned.length) {
      try {
        localStorage.removeItem("swivv-photo-purge");
      } catch {}
    }
    const isCondemned = (s: string) => condemned.some((c) => c.len === s.length && s.startsWith(c.head));
    const kept = profile.photos.filter((s) => !isCondemned(s));
    const heavy = kept.some((s) => s.startsWith("data:image") && s.length > 500_000);
    if (kept.length === profile.photos.length && !heavy) return;
    // ponytail: optimistic — album updates on first paint, server follows; reload-from-server if saves ever need confirming
    const apply = (photos: string[]) => {
      const next = { ...profile, photos };
      setProfile(next);
      saveMyProfile(next).catch(() => {});
    };
    if (!heavy) {
      apply(kept);
      return;
    }
    let live = true;
    slimmed.current = true;
    Promise.all(kept.map((s) => shrinkDataUrl(s))).then((slim) => {
      if (live) apply(slim);
    });
    return () => {
      live = false;
    };
  }, [authUser, profile]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      // ponytail: just-signed-up (no session yet) preview from the signup stash — cleared on first login push, so a stale stash never outlives its owner
      let pending: SwivvProfile | null = null;
      try {
        pending = JSON.parse(localStorage.getItem("swivv-pending-profile") ?? "null") as SwivvProfile | null;
      } catch {}
      setProfile(pending && pending.name ? pending : null);
      return;
    }
    let live = true;
    // ponytail: a leave-save from the flow may still be in flight — awaiting it beats first-painting stale %
    awaitPendingSave().then(() => {
      if (!live) return;
      getMyProfile().then((p) => {
        if (!live) return;
        if (p) {
          setProfile(p);
          return;
        }
        // First login after e-mail confirmation: push the signup stash, then show it.
        let pending: SwivvProfile | null = null;
        try {
          pending = JSON.parse(localStorage.getItem("swivv-pending-profile") ?? "null") as SwivvProfile | null;
        } catch {}
        if (!pending || !pending.name) {
          // ponytail: stash consumed but row partial (no photo yet) — preview the raw row so the landing is the user's own profile, not a dead end
          getMyRawProfile().then((r) => {
            if (!live) return;
            setProfile(r);
          });
          return;
        }
        // ponytail: server row wins over the signup stash (a lingering stash once rewound newer answers) — stash only seeds a rowless account
        getMyRawProfile().then((r) => {
          if (!live) return;
          if (r) {
            try {
              localStorage.removeItem("swivv-pending-profile");
              localStorage.removeItem("swivv-signup-draft");
            } catch {}
            getMyProfile().then((p2) => {
              if (!live) return;
              setProfile(p2 ?? r);
            });
            return;
          }
          // ponytail: stash survives a failed push and stays visible — deleting it on error vaporized the profile and asked forever
          saveMyProfile(pending).then((saveErr) => {
            if (!live) return;
            if (saveErr) {
              setProfile(pending);
              toast.error(saveErr);
              return;
            }
            try {
              localStorage.removeItem("swivv-pending-profile");
              localStorage.removeItem("swivv-signup-draft");
            } catch {}
            getMyProfile().then((p2) => {
              if (!live) return;
              setProfile(p2 ?? pending);
            });
          });
        });
      });
    });
    return () => {
      live = false;
    };
  }, [authLoading, authUser]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <Link to="/browse" search={{ q: "", type: "", location: "" }} className="text-sm text-[#555]">
          ← Profils
          </Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {profile === undefined ? (
          <p className="py-16 text-center text-[#777]">Chargement…</p>
        ) : !profile ? (
          // ponytail: no dead-end card — profile-less signups go straight to the form that creates the row; a transient null lands on a prefilled edit form, never a wall
          !user ? (
          <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
            <SwivvLogo />
            <h1 className="mt-2 text-xl font-medium text-[#333]">Crée ton profil SWIVV</h1>
            <p className="mt-1 text-sm text-[#777]">
              Crée ton profil complet pour le voir ici.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("account", "signin")}
              className="mt-4 w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white"
            >
              Se connecter / S&apos;inscrire
            </button>
          </div>
          ) : (
            <Navigate to="/inscription" />
          )
        ) : (
          <>
            {/* ponytail: one shared row (banner left, links right) instead of two stacked blocks — split when mobile wrapping ever hurts */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
            {(() => {
              const pct = profileCompleteness(profile);
              // ponytail: same strip restyled, no confetti component — celebratory animation if delight ever gets measured
              if (pct >= 100) {
                return (
                  <p className="min-w-52 flex-1 rounded-2xl bg-emerald-500/10 p-4 text-center text-sm font-medium text-emerald-900">
                    Bravo ! Votre profil SWIVV est 100 % complet 🎉
                  </p>
                );
              }
              return (
              <div className="flex min-w-52 flex-1 flex-wrap items-center gap-3 rounded-2xl bg-[#e91e63]/5 p-4">
                <div className="min-w-52 flex-1">
                  <p className="text-sm font-medium text-[#333]">
                    Ton profil est à {pct} % — ajoute ta photo et tes détails pour recevoir plus de messages.
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e91e63]/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-[#e91e63]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <Link
                  to="/inscription"
                  className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white"
                >
                  Compléter mon profil
                </Link>
              </div>
              );
            })()}
            <div className="flex gap-2">
              <Link
                to="/verification"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-[#555]"
              >
                Vérifier avec un selfie
              </Link>
              <Link
                to="/parametres"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-[#555]"
              >
                Paramètres
              </Link>
              <Link
                to="/inscription"
                className="rounded-md border border-[#e91e63] px-4 py-2 text-sm font-medium text-[#e91e63]"
              >
                Modifier mon profil
                </Link>
            </div>
            </div>
            <SwivvProfileView
              profile={profile}
              badge={
                <p className="mt-2 inline-block rounded-full bg-[#e91e63]/10 px-3 py-1 text-sm font-medium text-[#e91e63]">
                  Mon profil · {profile.lookingFor}
                </p>
              }
              onSavePhotos={async (photos) => {
                const next: SwivvProfile = { ...profile, photos, photo: photos[0] };
                const saveErr = await saveMyProfile(next);
                if (!saveErr) {
                  setProfile(next);
                  toast.success("Photos mises à jour.");
                }
                return saveErr;
              }}
            />
          </>
        )}
      </main>
      <SwivvFooter />
    </div>
  );
}

