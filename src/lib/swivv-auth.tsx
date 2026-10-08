import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Bell, LifeBuoy, LogIn, LogOut, Menu, Receipt, Settings } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { SwivvProfile } from "@/lib/swivv-data";
import { supabase } from "@/integrations/supabase/client";
import { mediaUrl } from "@/lib/swivv-store";
import { findOffensive } from "@/lib/swivv-moderation";
import { useAuth, forceSignOut } from "@/hooks/use-auth";
import { SwivvLogo } from "@/components/swivv-logo";
import { NotifBadge, SwivvTopIcons } from "@/components/swivv-top-icons";

export type SwivvUser = { name: string; email: string; nationalities: string[] };

// ponytail: single % definition (flow header + mon-profil) — 44 fields mirroring PRE_Q+POST_Q; 0 counts as filled
const REQUIRED_PROFILE_FIELDS: (keyof SwivvProfile)[] = ["name", "birthdate", "gender", "seeking", "city", "country", "lookingFor", "maritalStatus", "tagline", "bio", "heightCm", "weightKg", "hairColor", "eyeColor", "bodyStyle", "ethnicity", "selfAppearance", "bestFeature", "occupation", "education", "drink", "smoke", "drugs", "eatingHabits", "employmentStatus", "annualIncome", "livingSituation", "willingToRelocate", "hasPets", "wantsMorePets", "haveChildren", "wantMoreChildren", "brothersCount", "sistersCount", "birthRank", "parentsMaritalStatus", "nationality", "firstLanguage", "bornOrConverted", "religion", "religiousValues", "familyValues", "interests", "photos"];

export function profileCompleteness(p: SwivvProfile | null | undefined): number {
  if (!p) return 0;
  const filled = REQUIRED_PROFILE_FIELDS.filter((k) => {
    const v = p[k];
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "number") return Number.isFinite(v);
    return !!String(v ?? "").trim();
  }).length;
  return Math.round((filled / REQUIRED_PROFILE_FIELDS.length) * 100);
}

// ponytail: in-flight save registry so a landing page can await a leave-save instead of first-painting stale data — drop if saves ever go through a queue
let pendingSave: Promise<unknown> | null = null;
export function trackSave(p: Promise<unknown>): Promise<unknown> {
  pendingSave = p;
  p.catch(() => {}).finally(() => {
    if (pendingSave === p) pendingSave = null;
  });
  return p;
}
export function awaitPendingSave(): Promise<unknown> {
  return pendingSave ?? Promise.resolve();
}

export type AuthReason = "like" | "message" | "account" | "favorite" | "report" | "block" | "unblock";
export type AuthTab = "signup" | "signin";

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// --- session (Supabase Auth: same account on every device) ---
function toSwivvUser(u: SupabaseUser): SwivvUser {
  const meta = (u.user_metadata ?? {}) as { name?: string; nationalities?: string[] };
  const fallback = u.email?.split("@")[0] ?? "";
  // ponytail: an autofilled e-mail must never surface as a first name — single choke point, repair stored value via saveName
  const raw = (meta.name ?? "").trim();
  return {
    name: raw && !raw.includes("@") ? raw : fallback,
    email: u.email ?? "",
    nationalities: meta.nationalities ?? [],
  };
}

export function useSwivvUser(): SwivvUser | null {
  const { user } = useAuth();
  // ponytail: stable identity (was a fresh object per render — [user] effects refetched + resynced every render, messagerie looped 270 req/s into tab OOM) — compare fields if metadata ever mutates live
  return useMemo(() => (user ? toSwivvUser(user) : null), [user]);
}

export async function getSwivvUser(): Promise<SwivvUser | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ? toSwivvUser(data.session.user) : null;
}

export const SIGNUP_CONFIRM_MSG = "Vérifie tes e-mails pour confirmer ton compte, puis connecte-toi.";

export async function signUpSwivv(
  name: string,
  email: string,
  password: string,
  nationalities: string[] = [],
): Promise<string | null> {
  const clean = nationalities.map((n) => n.trim()).filter(Boolean).slice(0, 2);
  // ponytail: never persist an autofilled e-mail as the name — the form blocks it, this covers every future caller; empty re-asks, garbage never sticks
  const safeName = name.trim().includes("@") ? "" : name.trim();
  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password,
    options: { data: { name: safeName, nationalities: clean } },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already registered"))
      return "Un compte existe déjà avec cet e-mail. Connecte-toi.";
    // ponytail: Supabase's shared SMTP caps confirmation e-mails/hour — custom SMTP (Resend) lifts it once the domain is verified
    if (error.message.toLowerCase().includes("rate limit") || ((error as { code?: string }).code ?? "").includes("rate_limit"))
      return "Trop d'inscriptions à la suite — réessaie dans une heure.";
    return "Inscription impossible. Réessaie.";
  }
  if (!data.session) return SIGNUP_CONFIRM_MSG;
  return null;
}

// ponytail: photo-agnostic own-row fetch for the mon-profil landing preview — completion gating stays in getMyProfile so the signup-flow/edit split never sees partials
export async function getMyRawProfile(): Promise<SwivvProfile | null> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return null;
  try {
    const res = await (supabase as any)
      .from("swivv_profiles")
      .select("data")
      .eq("user_id", uid)
      .maybeSingle();
    const p = res.data?.data as SwivvProfile | null;
    return p && p.name ? p : null;
  } catch {
    return null;
  }
}
/** Null when logged out, else whether the account e-mail is confirmed. */
export async function isEmailConfirmed(): Promise<boolean | null> {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  return !!(u.email_confirmed_at ?? (u as { confirmed_at?: string }).confirmed_at);
}

/** Returns an error message when credentials mismatch, otherwise signs in. */
export async function signInSwivv(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
  if (!error) return null;
  // ponytail: auto-resend the confirmation link here so a lost e-mail never bricks login — drop if resend rate limits ever bite
  if (error.message.toLowerCase().includes("not confirmed")) {
    await supabase.auth.resend({ type: "signup", email: email.toLowerCase() }).catch(() => null);
    return "E-mail non confirmé — nouveau lien envoyé, clique dessus puis reconnecte-toi.";
  }
  return "E-mail ou mot de passe incorrect. Réessaie.";
}

// --- own dating profile (created via /inscription, stored per auth user) ---
export async function saveMyProfile(p: SwivvProfile): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return "Connecte-toi pour enregistrer ton profil.";
  // ponytail: dead local session (e.g. rotated stack secrets) self-heals via re-login — narrowed to 401s so offline retries keep their message
  const userRes = await Promise.race([
    supabase.auth.getUser(),
    new Promise<null>((r) => setTimeout(() => r(null), 5000)),
  ]).catch(() => null);
  const userErr = userRes && "error" in userRes ? userRes.error : null;
  const stale =
    !!userErr &&
    ((userErr as { status?: number }).status === 401 ||
      /invalid|expired/i.test(userErr.message ?? ""));
  if (stale) {
    await forceSignOut();
    return null;
  }
  // ponytail: surfaced (not thrown) so signup shows it — throw if callers ever centralize errors
  // ponytail: profile text (name/tagline/bio/bestFeature — every free-text identity field; the rest are fixed selects) is member-visible everywhere — block slurs at the single save choke point (all inscription + mon-profil paths surface this string); the static FR/EN/ES wordlist can't cover all languages — server-side scoring (e.g. Perspective API) if moderation ever needs real coverage; report/support flows never pass through here so quoting abuse to moderators stays allowed; voice audio is unscannable client-side (server transcription if that ever matters)
  const bad = findOffensive([p.name, p.tagline, p.bio, p.bestFeature].filter(Boolean).join("\n"));
  if (bad.length) {
    return `Ton profil contient une expression inappropriée (${bad.map((w) => `« ${w} »`).join(", ")}). Reformule-la pour continuer.`;
  }
  // ponytail: merge-overwrite — empties blank out server data only on a genuine edit (a present name proves the form was prefilled, so "" means intentionally un-answered); a nameless/failed prefill keeps the old guard so a step-save can never wipe a whole profile again — explicit per-field tombstones if clearing ever needs auditing
  const { data: prev } = await (supabase as any)
    .from("swivv_profiles")
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  const prevData = (prev?.data ?? {}) as Record<string, unknown>;
  const incoming = p as unknown as Record<string, unknown>;
  // ponytail: presence/computed keys are never client-set (leave-save would reset them every visit) — prev wins
  const { online: _on, isNew: _nw, compatibility: _cp, ...writable } = incoming;
  void _on;
  void _nw;
  void _cp;
  const allowClear = !!String(incoming.name ?? "").trim();
  const clean = Object.fromEntries(
    Object.entries(writable).filter(([k, v]) => (allowClear || v !== "") && v !== null && v !== undefined && (k !== "verified" || v === true)),
  );
  // ponytail: stale signup stashes saved full-ISO joinedAt/lastActive (rendered raw as "2026-10-03T…") — coerce at the single write choke point; drop if stashes are ever versioned
  const iso = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}T/.test(s);
  const { error } = await (supabase as any)
    .from("swivv_profiles")
    .upsert({
      user_id: uid,
      data: {
        ...prevData,
        ...clean,
        ...(iso(incoming.lastActive) ? { lastActive: "En ligne" } : {}),
        ...(typeof prevData.joinedAt === "string" && prevData.joinedAt
          ? { joinedAt: prevData.joinedAt }
          : iso(incoming.joinedAt)
            ? { joinedAt: (incoming.joinedAt as string).slice(0, 10) }
            : {}),
      },
      updated_at: new Date().toISOString(),
    });
  if (error) return "Enregistrement impossible. Réessaie.";
  // ponytail: same-tab broadcast (storage events don't fire in the writing tab) so the header avatar updates without refresh — no store until a second consumer appears
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<string | null>("swivv-avatar", { detail: mediaUrl(p.photo ?? p.photos?.[0]) ?? null }));
  }
  return null;
}

export async function getMyProfile(): Promise<SwivvProfile | null> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return null;
  let res: { data: { data?: SwivvProfile } | null; error: { status?: number; message?: string } | null };
  try {
    res = await (supabase as any)
      .from("swivv_profiles")
      .select("data")
      .eq("user_id", uid)
      .maybeSingle();
  } catch {
    // ponytail: one cold-boot retry (sleeping radio/proxy fails the first fetch with no retry trigger) — null after that, callers keep cached state
    await new Promise((r) => setTimeout(r, 2000));
    try {
      res = await (supabase as any)
        .from("swivv_profiles")
        .select("data")
        .eq("user_id", uid)
        .maybeSingle();
    } catch {
      // ponytail: offline/failed fetch is not "no profile" and never logs out — callers keep cached state
      return null;
    }
  }
  // ponytail: same dead-session self-heal as saveMyProfile — a 401 here otherwise masquerades as "no profile" (initial avatar, empty discovery)
  const err = res.error;
  if (err && (err.status === 401 || /invalid|expired|jwt/i.test(err.message ?? ""))) {
    await forceSignOut();
    return null;
  }
  if (err) return null;
  const p = res.data?.data as SwivvProfile | null;
  return p && p.name && Array.isArray(p.photos) && p.photos.length > 0 ? p : null;
}

// ponytail: one shared discovery feed (browse + matches) — paged server query if members ever outgrow a single select
export function usePublicProfiles(): SwivvProfile[] {
  const { user } = useAuth();
  const [extra, setExtra] = useState<SwivvProfile[]>([]);
  useEffect(() => {
    if (!user) {
      setExtra([]);
      return;
    }
    let live = true;
    (supabase as any)
      .from("swivv_profiles")
      .select("user_id,data,updated_at")
      .then(({ data }: { data: { user_id: string; data: SwivvProfile; updated_at?: string }[] | null }) => {
        if (!live) return;
        setExtra(
          (data ?? [])
            .filter((r) => r.user_id !== user.id && r.data?.name && Array.isArray(r.data.photos) && r.data.photos.length > 0)
            // ponytail: joinedAt backfilled from the row — pre-signup-form rows lack it and crashed every recent-sort; drop once caches turn over
            .map((r) => ({ ...r.data, id: `u:${r.user_id}`, joinedAt: r.data.joinedAt ?? (r.updated_at ?? "").slice(0, 10) })),
        );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [user]);
  return extra;
}

export async function signOutSwivv() {
  await forceSignOut();
}

// --- modal + pending action ---
type ModalState = { open: boolean; reason: AuthReason; tab: AuthTab };
let modal: ModalState = { open: false, reason: "account", tab: "signup" };
let pending: (() => void) | null = null;

function setModal(next: ModalState) {
  modal = next;
  notify();
}

export function openAuthModal(reason: AuthReason, tab: AuthTab = "signin") {
  setModal({ open: true, reason, tab });
}

export function closeAuthModal() {
  pending = null;
  setModal({ ...modal, open: false });
}

function getModal(): ModalState {
  return modal;
}

export function useAuthModal(): ModalState {
  useSyncExternalStore(subscribe, getModal, () => modal);
  return getModal();
}

/** Runs `run` immediately when signed in, otherwise opens the popup and
 *  runs it right after a successful sign-in / sign-up. */
export async function requireSwivvAuth(reason: AuthReason, run: () => void) {
  if (await getSwivvUser()) {
    run();
    return;
  }
  pending = run;
  setModal({ open: true, reason, tab: "signin" });
}

const REASON_COPY: Record<AuthReason, string> = {
  like: "Crée un compte ou connecte-toi pour liker ce membre.",
  message: "Crée un compte ou connecte-toi pour envoyer un message.",
  account: "Crée ton compte gratuit ou connecte-toi pour continuer.",
  favorite: "Crée un compte ou connecte-toi pour ajouter ce membre à tes favoris.",
  report: "Crée un compte ou connecte-toi pour signaler ce membre.",
  block: "Crée un compte ou connecte-toi pour bloquer ce membre.",
  unblock: "Crée un compte ou connecte-toi pour débloquer ce membre.",
};

export function AuthModal() {
  const state = useAuthModal();
  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  // Reset the form (and requested tab) every time the popup opens.
  useEffect(() => {
    if (state.open) {
      setTab(state.tab);
      setEmail("");
      setPassword("");
      setBusy(false);
      setError(null);
    }
  }, [state.open, state.tab]);

  if (!state.open) return null;

  function finish() {
    const run = pending;
    pending = null;
    setModal({ ...modal, open: false });
    setError(null);
    setEmail("");
    setPassword("");
    setBusy(false);
    run?.();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!/.+@.+\..+/.test(cleanEmail)) {
      setError("Entre un e-mail valide.");
      return;
    }
    if (!password) {
      setError("Entre ton mot de passe.");
      return;
    }
    setBusy(true);
    const err = await signInSwivv(cleanEmail, password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    // ponytail: sessions persist by default — opt out marks this browser ephemeral, root boot signs out on fresh starts
    try {
      if (remember) localStorage.removeItem("swivv-ephemeral");
      else localStorage.setItem("swivv-ephemeral", "1");
    } catch {}
    finish();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connexion requise"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <SwivvLogo />
        <h2 className="mt-2 text-xl font-medium text-[#333]">Connexion requise</h2>
        <p className="mt-1 text-sm text-[#777]">{REASON_COPY[state.reason]}</p>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-md bg-[#f2f2f2] p-1 text-sm" role="tablist">
          {(["signup", "signin"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              type="button"
              onClick={() => {
                setTab(t);
                setError(null);
              }}
              className={`rounded px-3 py-1.5 font-medium ${
                tab === t ? "bg-white text-[#e91e63] shadow-sm" : "text-[#777]"
              }`}
            >
              {t === "signup" ? "Créer un compte" : "Se connecter"}
            </button>
          ))}
        </div>

        {tab === "signin" ? (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="swivv-email" className="mb-1 block text-sm font-medium text-[#333]">
                Ton e-mail
              </label>
              <input
                id="swivv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="camille@exemple.fr"
                autoComplete="email"
                className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
              />
            </div>
            <div>
              <label htmlFor="swivv-password" className="mb-1 block text-sm font-medium text-[#333]">
                Ton mot de passe
              </label>
              <input
                id="swivv-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#555]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 shrink-0 accent-[#e91e63]"
              />
              Rester connecté
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              {busy ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm leading-relaxed text-[#555]">
              Créez votre compte Swivv et commencez une nouvelle histoire. Avec Swivv, moins de swipe, plus de vraies rencontres.
            </p>
            <Link
              to="/inscription"
              onClick={closeAuthModal}
              className="block w-full rounded-md bg-[#e91e63] px-4 py-3 text-center font-medium text-white"
            >
              Créer mon profil
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={closeAuthModal}
          className="mt-3 w-full text-center text-sm text-[#777] hover:text-[#333]"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}

/** Header buttons: sign-in state aware (Sign up / Sign in vs Hello + hamburger menu). */
export function SwivvAuthButtons() {
  const user = useSwivvUser();
  const nav = useNavigate();
  // ponytail: avatar URL cached locally for instant paint, refreshed in background — keyed per browser, cleared on logout
  const [photo, setPhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem("swivv-avatar");
    } catch {
      return null;
    }
  });

  // ponytail: keyed by e-mail (stable + survives metadata edits — [user] would refetch on display-name change)
  const userEmail = user?.email;
  // ponytail: a failed/empty refetch must never clobber a loaded photo — null only wins on first resolution (logout / genuinely photoless)
  const photoLoaded = useRef(false);
  useEffect(() => {
    if (!user) {
      photoLoaded.current = false;
      setPhoto(null);
      try {
        localStorage.removeItem("swivv-avatar");
      } catch {}
      return;
    }
    let live = true;
    getMyProfile().then((p) => {
      if (!live) return;
      // ponytail: photo falls back to photos[0] + LAN rewrite — older profiles saved photo empty, and raw localhost URLs die off-localhost
      const url = mediaUrl(p?.photo ?? p?.photos?.[0]) ?? null;
      if (url || !photoLoaded.current) {
        photoLoaded.current = true;
        setPhoto(url);
        try {
          if (url) localStorage.setItem("swivv-avatar", url);
          else localStorage.removeItem("swivv-avatar");
        } catch {}
      }
    });
    return () => {
      live = false;
    };
  }, [userEmail]);

  // ponytail: live avatar after a photo save — broadcast carries the URL, so no refetch; a store if a second live consumer appears
  useEffect(() => {
    const onAvatar = (e: Event) => {
      const url = (e as CustomEvent<string | null>).detail ?? null;
      photoLoaded.current = true;
      setPhoto(url);
      try {
        if (url) localStorage.setItem("swivv-avatar", url);
        else localStorage.removeItem("swivv-avatar");
      } catch {}
    };
    window.addEventListener("swivv-avatar", onAvatar);
    return () => window.removeEventListener("swivv-avatar", onAvatar);
  }, []);

  if (user) {
    const itemCls = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[#333] hover:bg-[#f2f2f2]";
    const itemIcon = "h-4 w-4 shrink-0 text-[#e91e63]";
    return (
      <>
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-0 sm:order-3 sm:gap-2 -mt-2 sm:mt-0">
        {/* ponytail: bell sits left of the avatar on all viewports — was mobile-only until desktop asked for the same spot; extract a shared HeaderBell if a third placement appears */}
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative p-0.5 text-black"
        >
          <Bell className="h-6 w-6" strokeWidth={1.5} />
          <NotifBadge />
        </Link>
        {photo ? (
          <Link to="/mon-profil" aria-label="Mon profil">
            <img
              src={photo}
              alt=""
              // ponytail: one same-URL retry — phones flake decoding big dataURLs under pressure; null (initial) only if it fails twice
              onError={(e) => {
                const el = e.currentTarget;
                if (el.dataset.retried) {
                  setPhoto(null);
                  return;
                }
                el.dataset.retried = "1";
                el.src = photo;
              }}
              className="h-9 w-9 rounded-full object-cover"
            />
          </Link>
        ) : (
          <Link
            to="/mon-profil"
            aria-label="Mon profil"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e91e63] text-sm font-medium text-white"
          >
            {user.name.charAt(0).toUpperCase()}
          </Link>
        )}
          <Link
            to="/mon-profil"
          className="rounded-md border border-black px-4 py-2 text-sm font-medium text-black hover:underline"
          >
            Mon profil
          </Link>
        {/* ponytail: native details dropdown, no menu lib — custom popover if a11y audit demands it */}
        <details className="relative group">
          <summary
            aria-label="Menu du compte"
            className="cursor-pointer list-none rounded-md border border-black px-3 py-2 text-black [&::-webkit-details-marker]:hidden"
          >
            <Menu className="h-5 w-5" />
          </summary>
          {/* Click anywhere to dismiss: invisible layer under the panel, only rendered while open */}
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={(e) => (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open")}
            className="fixed inset-0 z-40 hidden cursor-default bg-transparent group-open:block"
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-white p-1.5 shadow-lg">
            <Link to="/parametres" className={itemCls}><Settings className={itemIcon} />Réglages du profil</Link>
            <Link to="/facturation" className={itemCls}><Receipt className={itemIcon} />Facturation</Link>
            <Link to="/notifications" className={itemCls}><Bell className={itemIcon} />Notifications</Link>
            <Link to="/help" className={itemCls}><LifeBuoy className={itemIcon} />Centre d&apos;aide</Link>
            <button
              type="button"
              onClick={async () => {
                await signOutSwivv();
                nav({ to: "/" });
              }}
              className={`${itemCls} font-medium text-[#e91e63]`}
            >
              <LogOut className={itemIcon} />
              Déconnexion
            </button>
          </div>
        </details>
      </div>
      <SwivvTopIcons />
      <AuthModal />
      </>
    );
  }

  return (
    <>
    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        onClick={() => openAuthModal("account", "signin")}
        className="hidden rounded-md border border-[#e91e63] px-4 py-2 text-sm font-medium text-[#e91e63] hover:underline sm:block"
      >
        S&apos;inscrire | Se connecter
      </button>
      <button
        type="button"
        onClick={() => openAuthModal("account", "signin")}
        aria-label="Se connecter"
        className="rounded-md border border-[#e91e63] p-2 text-[#e91e63] sm:hidden"
      >
        <LogIn className="h-5 w-5" />
      </button>
      <Link
        to="/inscription"
        className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white"
      >
        Créer mon profil
      </Link>
    </div>
    <AuthModal />
    </>
  );
}
