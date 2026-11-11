import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Bell, ChartColumn, LifeBuoy, LogIn, LogOut, Menu, Receipt, Settings, Sparkles } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { SwivvProfile } from "@/lib/swivv-data";
import { TERMS_VERSION } from "@/lib/swivv-age";
import { supabase } from "@/integrations/supabase/client";
import { mediaUrl } from "@/lib/swivv-store";
import { findOffensive } from "@/lib/swivv-moderation";
import { useAuth, forceSignOut } from "@/hooks/use-auth";
import { SwivvLogo } from "@/components/swivv-logo";
import { NotifBadge, SwivvTopIcons } from "@/components/swivv-top-icons";
import { useT } from "@/lib/i18n";

export type SwivvUser = { name: string; email: string; nationalities: string[] };

// ponytail: completion lives in a React-free module so the Progress page logic + tests don't pull the auth UI — re-exported here for the many existing imports
export { REQUIRED_PROFILE_FIELDS, profileCompleteness } from "@/lib/swivv-profile-fields";


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
    // ponytail: Supabase's shared SMTP caps confirmation e-mails/hour — the IONOS mailbox SMTP lifts that cap
    if (error.message.toLowerCase().includes("rate limit") || ((error as { code?: string }).code ?? "").includes("rate_limit"))
      return "Trop d'inscriptions à la suite — réessaie dans une heure.";
    return "Inscription impossible. Réessaie.";
  }
  if (!data.session) return SIGNUP_CONFIRM_MSG;
  return null;
}

// ponytail: photo-agnostic own-row fetch for the mon-profil landing preview — completion gating stays in getMyProfile so the signup-flow/edit split never sees partials
// ponytail: undefined = read failed (offline), never "no row" — a caller that treats this as rowless pushes a stale signup stash over a complete server profile on reconnect
export async function getMyRawProfile(): Promise<SwivvProfile | null | undefined> {
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
    return undefined;
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

// ponytail: list cards only need ~320px — full dataURL photos in the feed pushed even a 4-row query past PostgREST's 8s statement timeout.
function thumbDataUrl(url: string, maxDim = 320, q = 0.7): Promise<string | null> {
  if (typeof document === "undefined" || !url.startsWith("data:image")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", q));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const AVATAR_BUCKET = "avatars";
// ponytail: session cache of dataURL→storage URL — the signup flow saves the same photos on several steps; per-tab only, content-addressed path makes a re-upload harmless if it misses
const uploadedAvatars = new Map<string, string>();
// ponytail: photos live in the public avatars bucket — base64 inside `data` detoasted the whole 2.9MB JSONB on every read and timed out feeds; private bucket + signed URLs if profile photos must stop being publicly fetchable
async function uploadAvatar(src: string, uid: string): Promise<string | null> {
  if (!src.startsWith("data:image")) return src;
  const hit = uploadedAvatars.get(src);
  if (hit) return hit;
  try {
    const mime = src.slice(5, src.indexOf(";")) || "image/jpeg";
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const blob = await (await fetch(src)).blob();
    // ponytail: content-addressed path dedupes re-saves; random suffix if SubtleCrypto is unavailable (http LAN)
    let hash = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
      hash = Array.from(new Uint8Array(digest)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {}
    const path = `${uid}/${hash}.${ext}`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, { contentType: mime, upsert: true, cacheControl: "31536000" });
    if (error) return null;
    const url = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
    uploadedAvatars.set(src, url);
    return url;
  } catch {
    return null;
  }
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
  // ponytail: no read, no write — an unreadable prev row (offline mid-save) once let a stale stash upsert over a complete profile and wipe its photos; every caller inherits this, no per-call audit needed
  let prevData: Record<string, unknown> = {};
  try {
    const { data: prev, error: prevErr } = await (supabase as any)
      .from("swivv_profiles")
      .select("data")
      .eq("user_id", uid)
      .maybeSingle();
    if (prevErr) return "Lecture impossible — profil non enregistré. Réessaie quand internet revient.";
    prevData = (prev?.data ?? {}) as Record<string, unknown>;
  } catch {
    return "Lecture impossible — profil non enregistré. Réessaie quand internet revient.";
  }
  const incoming = p as unknown as Record<string, unknown>;
  // ponytail: presence/computed keys are never client-set (leave-save would reset them every visit) — prev wins
  const { online: _on, isNew: _nw, compatibility: _cp, ...writable } = incoming;
  void _on;
  void _nw;
  void _cp;
  // ponytail: exact DOB is never displayed (age is) — keep it out of the row every member can read; one choke point covers signup/edit/draft restores
  delete prevData.birthdate;
  const allowClear = !!String(incoming.name ?? "").trim();
  // ponytail: an empty album never overwrites a full one in a merge (gallery UI already requires ≥1 photo to save, so [] here means a stale/failed prefill, not an edit) — admin moderation clears photos via direct SQL, not this path
  const prevHasPhotos = Array.isArray(prevData.photos) && (prevData.photos as unknown[]).length > 0;
  const clean = Object.fromEntries(
    // ponytail: NaN (age from an empty birthdate step) serialized to JSON null and wiped a known age — non-finite numbers never write
    Object.entries(writable).filter(([k, v]) => (allowClear || v !== "") && v !== null && v !== undefined && !(typeof v === "number" && !Number.isFinite(v)) && (k !== "verified" || v === true) && (k !== "idVerified" || v === true) && !(k === "photos" && Array.isArray(v) && v.length === 0 && prevHasPhotos)),
  );
  delete clean.birthdate;
  // ponytail: the birthdate goes to the staff-only age-assurance table, never into the public profile row; the DB trigger derives age and rejects under-18/future dates. Ignored until that migration is applied (no table), and the client-side check above still gates creation.
  if (typeof incoming.birthdate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(incoming.birthdate)) {
    await (supabase as any)
      .from("swivv_age_assurance")
      .upsert({ user_id: uid, birthdate: incoming.birthdate, terms_version: TERMS_VERSION }, { onConflict: "user_id" })
      .then(() => {}, () => {});
  }
  // ponytail: no profile is created without an age — signup asks the birthdate after the match-age step, this is the backstop for any path that ever skips it; existing rows keep saving
  const ageOk = clean.age != null && clean.age !== "" && Number.isFinite(Number(clean.age));
  if (!Object.keys(prevData).length && !ageOk) return "Ta date de naissance est obligatoire.";
  // ponytail: stale signup stashes saved full-ISO joinedAt/lastActive (rendered raw as "2026-10-03T…") — coerce at the single write choke point; drop if stashes are ever versioned
  const iso = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}T/.test(s);
  // ponytail: upload dataURL photos at the single write choke point — a failed upload keeps the dataURL (no data loss). The thumb is the 320px list copy; a reordered URL primary keeps the previous thumb until a new upload replaces it.
  const rawPhotos = Array.isArray(incoming.photos) ? incoming.photos.filter((x): x is string => typeof x === "string" && !!x) : [];
  const photoSrc = typeof incoming.photo === "string" && incoming.photo ? incoming.photo : (rawPhotos[0] ?? "");
  let uploadedPhotos: string[] = [];
  let uploadedPhoto = "";
  if (rawPhotos.some((s) => s.startsWith("data:image")) || photoSrc.startsWith("data:image")) {
    if (rawPhotos.length) {
      uploadedPhotos = await Promise.all(rawPhotos.slice(0, 5).map(async (s) => (await uploadAvatar(s, uid)) ?? s));
    }
    if (photoSrc) uploadedPhoto = (await uploadAvatar(photoSrc, uid)) ?? photoSrc;
  }
  const thumbSrc = photoSrc.startsWith("data:image") ? await thumbDataUrl(photoSrc) : null;
  const thumb = thumbSrc ? ((await uploadAvatar(thumbSrc, uid)) ?? thumbSrc) : null;
  const { error } = await (supabase as any)
    .from("swivv_profiles")
    .upsert({
      user_id: uid,
      data: {
        ...prevData,
        ...clean,
        ...(uploadedPhotos.length ? { photos: uploadedPhotos } : {}),
        ...(uploadedPhoto ? { photo: uploadedPhoto } : {}),
        ...(thumb ? { thumb } : {}),
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
    window.dispatchEvent(new CustomEvent<string | null>("swivv-avatar", { detail: mediaUrl(uploadedPhoto || p.photo || p.photos?.[0]) ?? null }));
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

// ponytail: one row, one round trip for seeking+city (each cold query can cost 10s+ on the free tier — two singles doubled the blank grid); falls back to the full fetch if the projection ever fails; full getMyProfile still owns the profile itself
export async function getMyBasics(): Promise<{ seeking: "woman" | "man" | null; city: string; country: string }> {
  const none = { seeking: null as "woman" | "man" | null, city: "", country: "" };
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return none;
  try {
    const res = await (supabase as any)
      .from("swivv_profiles")
      .select("data->>seeking,data->>gender,data->>city,data->>country,criteria:data->matchCriteria")
      .eq("user_id", uid)
      .maybeSingle();
    if (!res.error && res.data) {
      const sk = res.data.seeking as string | undefined;
      // ponytail: the saved "Je recherche" criteria is the newest explicit choice (editable in Mes Matches) — profile.seeking can go stale after signup; when both exist, criteria wins
      const crit = (res.data.criteria as { form?: { gender?: string } } | null)?.form?.gender;
      const fromCriteria: "man" | "woman" | null = crit === "Homme" ? "man" : crit === "Femme" ? "woman" : null;
      const seeking: "man" | "woman" | null = fromCriteria ?? (sk === "woman" || sk === "man" ? sk
        : res.data.gender === "woman" ? "man" : res.data.gender === "man" ? "woman" : null);
      const out: { seeking: "man" | "woman" | null; city: string; country: string } = { seeking, city: String(res.data.city ?? ""), country: String(res.data.country ?? "") };
      if (seeking) {
        try {
          localStorage.setItem("swivv-seeking", seeking);
          localStorage.setItem(`swivv-seeking:${uid}`, seeking);
        } catch {}
      }
      return out;
    }
  } catch {}
  const p = await getMyProfile();
  return {
    seeking: p?.seeking ?? (p?.gender === "woman" ? "man" : p?.gender === "man" ? "woman" : null),
    city: p?.city ?? "",
    country: p?.country ?? "",
  };
}

// ponytail: page-windowed feed (60/page, newest first) — filters/search apply to the loaded window; server-side search if the pool ever needs full filtering
const FEED_PAGE = 60;
// ponytail: lean feed — scalar json fields + the 320px `thumb` only. Member photos are ~0.3-2.5MB dataURLs, so shipping one full photo per row timed out even with 4 members; the full array is fetched per-profile when a profile opens. Add a field here when a card starts reading one.
const FEED_FIELDS = [
  "user_id",
  "updated_at",
  "name:data->name",
  "age:data->age",
  "gender:data->gender",
  "city:data->city",
  "country:data->country",
  "lookingFor:data->lookingFor",
  "maritalStatus:data->maritalStatus",
  "religion:data->religion",
  "nationality:data->nationality",
  "occupation:data->occupation",
  "heightCm:data->heightCm",
  "weightKg:data->weightKg",
  "education:data->education",
  "annualIncome:data->annualIncome",
  "livingSituation:data->livingSituation",
  "willingToRelocate:data->willingToRelocate",
  "haveChildren:data->haveChildren",
  "wantMoreChildren:data->wantMoreChildren",
  "firstLanguage:data->firstLanguage",
  "religiousValues:data->religiousValues",
  "hairColor:data->hairColor",
  "eyeColor:data->eyeColor",
  "bodyStyle:data->bodyStyle",
  "ethnicity:data->ethnicity",
  "selfAppearance:data->selfAppearance",
  "drink:data->drink",
  "smoke:data->smoke",
  "drugs:data->drugs",
  "eatingHabits:data->eatingHabits",
  "employmentStatus:data->employmentStatus",
  "wantsMorePets:data->wantsMorePets",
  "hasPets:data->hasPets",
  "familyValues:data->familyValues",
  "bornOrConverted:data->bornOrConverted",
  "tagline:data->tagline",
  "bio:data->bio",
  "online:data->online",
  "verified:data->verified",
  "idVerified:data->idVerified",
  "isNew:data->isNew",
  "compatibility:data->compatibility",
  "distanceKm:data->distanceKm",
  "joinedAt:data->joinedAt",
  "lastActive:data->lastActive",
  "interests:data->interests",
  "languages:data->languages",
  "otherLanguages:data->otherLanguages",
  "thumb:data->thumb",
  // ponytail: hidden members are filtered below in the browser - RLS is the real gate (20261029000000), this stops the obvious leak until it lands
  "profileHidden:data->profileHidden",
].join(",");
// withPhotos: only the "Photos récentes" grid needs every photo (it shows one card per photo) — the other six categories and the matches list stay lean
export function usePublicProfiles(withPhotos = false): { profiles: SwivvProfile[]; hasMore: boolean; loaded: boolean; loadMore: () => void } {
  const { user } = useAuth();
  const [extra, setExtra] = useState<SwivvProfile[]>([]);
  const [limit, setLimit] = useState(FEED_PAGE);
  const [hasMore, setHasMore] = useState(false);
  // ponytail: first-window settle flag so grids paint once in final order instead of seeds-first then reshuffling — stays true on loadMore (append, not first paint)
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!user) {
      setExtra([]);
      setHasMore(false);
      setLoaded(true);
      return;
    }
    let live = true;
    // ponytail: one retry on a PostgREST 500 (statement timeout on huge photos) — it used to blank every member because data=null was treated as an empty feed; keep painted rows on the second failure
    const fetchRows = async (retry: boolean): Promise<void> => {
      const { data, error } = await (supabase as any)
        .from("swivv_profiles")
        .select(withPhotos ? "user_id,data,updated_at" : FEED_FIELDS)
        .order("updated_at", { ascending: false })
        .range(0, limit - 1);
      if (!live) return;
      if (error) {
        if (retry) {
          await new Promise((r) => setTimeout(r, 800));
          if (live) return fetchRows(false);
        }
        setLoaded(true);
        return;
      }
      const rows = (data ?? []) as any[];
      setExtra(
        rows
          .filter((r) => {
            if (r.user_id === user.id) return false;
            const d = withPhotos ? r.data : r;
            if (d?.profileHidden === true) return false;
            return !!d?.name && !!photoOf(d);
          })
          // ponytail: joinedAt backfilled from the row — pre-signup-form rows lack it and crashed every recent-sort; drop once caches turn over
          .map<SwivvProfile>((r) => {
            if (withPhotos) return { ...r.data, id: `u:${r.user_id}`, joinedAt: r.data?.joinedAt ?? (r.updated_at ?? "").slice(0, 10) };
            const photo = photoOf(r);
            // ponytail: interests/languages defaulted — an absent array json field came back null and crashed score()/filter joins
            return {
              ...r,
              photo,
              photos: photo ? [photo] : [],
              interests: Array.isArray(r.interests) ? r.interests : [],
              languages: Array.isArray(r.languages) ? r.languages : [],
              id: `u:${r.user_id}`,
              joinedAt: r.joinedAt ?? (r.updated_at ?? "").slice(0, 10),
            };
          }),
      );
      setHasMore(rows.length >= limit);
      setLoaded(true);
    };
    fetchRows(true).catch(() => { if (live) setLoaded(true); });
    return () => {
      live = false;
    };
  }, [user, limit, withPhotos]);
  return { profiles: extra, hasMore, loaded, loadMore: () => setLimit((l) => l + FEED_PAGE) };
}

// primary photo from either the lean projection (photo/firstPhoto) or the full data blob
function photoOf(d: { photo?: string | null; firstPhoto?: string | null; photos?: string[]; thumb?: string | null } | null | undefined): string | null {
  return d?.photo ?? d?.firstPhoto ?? (Array.isArray(d?.photos) ? d.photos[0] : null) ?? d?.thumb ?? null;
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

const REASON_COPY = {
  like: "Crée un compte ou connecte-toi pour liker ce membre.",
  message: "Crée un compte ou connecte-toi pour envoyer un message.",
  account: "Crée ton compte gratuit ou connecte-toi pour continuer.",
  favorite: "Crée un compte ou connecte-toi pour ajouter ce membre à tes favoris.",
  report: "Crée un compte ou connecte-toi pour signaler ce membre.",
  block: "Crée un compte ou connecte-toi pour bloquer ce membre.",
  unblock: "Crée un compte ou connecte-toi pour débloquer ce membre.",
} as const;

export function AuthModal() {
  const t = useT();
  const state = useAuthModal();
  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  // Reset the form (and requested tab) every time the popup opens.
  useEffect(() => {
    if (state.open) {
      setTab(state.tab);
      setEmail("");
      setPassword("");
      setBusy(false);
      setError(null);
      setNotice(null);
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
      setError(t("Entre un e-mail valide."));
      return;
    }
    if (!password) {
      setError(t("Entre ton mot de passe."));
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

  async function forgot() {
    const cleanEmail = email.trim();
    setNotice(null);
    if (!/.+@.+\..+/.test(cleanEmail)) {
      setError(t("Entre un e-mail valide."));
      return;
    }
    setError(null);
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset`,
    });
    setBusy(false);
    if (resetError) {
      setError(t("Impossible d'envoyer l'e-mail pour le moment."));
      return;
    }
    setNotice(t("Si un compte existe pour cet e-mail, un lien de réinitialisation vient d'être envoyé."));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("Connexion requise")}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-[#333] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <SwivvLogo />
        <h2 className="mt-2 text-xl font-medium text-[#333]">{t("Connexion requise")}</h2>
        <p className="mt-1 text-sm text-[#5c5c66]">{t(REASON_COPY[state.reason])}</p>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-md bg-[#f2f2f2] p-1 text-sm" role="tablist">
          {(["signup", "signin"] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              type="button"
              onClick={() => {
                setTab(k);
                setError(null);
              }}
              className={`rounded px-3 py-1.5 font-medium ${
                tab === k ? "bg-white text-[#e60050] shadow-sm" : "text-[#5c5c66]"
              }`}
            >
              {k === "signup" ? t("Créer un compte") : t("Se connecter")}
            </button>
          ))}
        </div>

        {tab === "signin" ? (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="swivv-email" className="mb-1 block text-sm font-medium text-[#333]">
                {t("Ton e-mail")}
              </label>
              <input
                id="swivv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="camille@exemple.fr"
                autoComplete="email"
                className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#6b6b73] focus:outline-none focus:ring-2 focus:ring-[#e60050]"
              />
            </div>
            <div>
              <label htmlFor="swivv-password" className="mb-1 block text-sm font-medium text-[#333]">
                {t("Ton mot de passe")}
              </label>
              <input
                id="swivv-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#6b6b73] focus:outline-none focus:ring-2 focus:ring-[#e60050]"
              />
            </div>
            {notice && <p className="text-sm text-[#2f7d32]">{notice}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#555]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 shrink-0 accent-[#e60050]"
              />
              {t("Rester connecté")}
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              {busy ? t("Connexion…") : t("Se connecter")}
            </button>
            <button
              type="button"
              onClick={forgot}
              disabled={busy}
              className="w-full text-center text-sm text-[#5c5c66] underline disabled:opacity-60"
            >
              {t("Mot de passe oublié ?")}
            </button>
          </form>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm leading-relaxed text-[#555]">
              {t("Crée ton compte Swivv et commence une nouvelle histoire. Avec Swivv, moins de swipe, plus de vraies rencontres.")}
            </p>
            <Link
              to="/inscription"
              onClick={closeAuthModal}
              className="block w-full rounded-md bg-[#e60050] px-4 py-3 text-center font-medium text-white"
            >
              {t("Créer mon profil")}
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={closeAuthModal}
          className="mt-3 w-full text-center text-sm text-[#5c5c66] hover:text-[#333]"
        >
          {t("Plus tard")}
        </button>
      </div>
    </div>
  );
}

/** Header buttons: sign-in state aware (Sign up / Sign in vs Hello + hamburger menu). */
export function SwivvAuthButtons() {
  const t = useT();
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
    const itemIcon = "h-4 w-4 shrink-0 text-[#e60050]";
    return (
      <>
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-0 sm:order-3 sm:gap-2 -mt-2 sm:mt-0">
        {/* ponytail: bell sits left of the avatar on all viewports — was mobile-only until desktop asked for the same spot; extract a shared HeaderBell if a third placement appears */}
        <Link
          to="/notifications"
          aria-label={t("Notifications")}
          className="tap-44 relative text-white"
        >
          <span className="relative block">
            <Bell className="h-6 w-6" strokeWidth={1.5} />
            <NotifBadge />
          </span>
        </Link>
        {photo ? (
          <Link to="/mon-profil" aria-label={t("Mon profil")} className="tap-44">
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
            aria-label={t("Mon profil")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e60050] text-sm font-medium text-white"
          >
            {user.name.charAt(0).toUpperCase()}
          </Link>
        )}
          <Link
            to="/mon-profil"
          className="rounded-md border border-white px-4 py-2 text-sm font-medium text-white hover:underline"
          >
            {t("Mon profil")}
          </Link>
        {/* ponytail: native details dropdown, no menu lib — custom popover if a11y audit demands it */}
        <details className="relative group">
          <summary
            aria-label={t("Menu du compte")}
            className="tap-44 cursor-pointer list-none rounded-md border border-white px-3 py-2 [&::-webkit-details-marker]:hidden"
          >
            <Menu className="h-5 w-5" />
          </summary>
          {/* Click anywhere to dismiss: invisible layer under the panel, only rendered while open */}
          <button
            type="button"
            aria-label={t("Fermer le menu")}
            onClick={(e) => (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open")}
            className="fixed inset-0 z-40 hidden cursor-default bg-transparent group-open:block"
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-white p-1.5 shadow-lg">
            <Link to="/parametres" className={itemCls}><Settings className={itemIcon} />{t("Réglages du profil")}</Link>
            <Link to="/statistiques" search={{ tab: "overview" }} className={itemCls}><ChartColumn className={itemIcon} />{t("Mes statistiques")}</Link>
            <Link to="/progress" search={{ tab: "progress" }} className={itemCls}><Sparkles className={itemIcon} />SWIVV PROGRESS</Link>
            <Link to="/facturation" className={itemCls}><Receipt className={itemIcon} />{t("Relevés d'accès")}</Link>
            <Link to="/notifications" className={itemCls}><Bell className={itemIcon} />{t("Notifications")}</Link>
            <Link to="/help" className={itemCls}><LifeBuoy className={itemIcon} />{t("Centre d'aide")}</Link>
            <button
              type="button"
              onClick={async () => {
                await signOutSwivv();
                nav({ to: "/" });
              }}
              className={`${itemCls} font-medium text-[#e60050]`}
            >
              <LogOut className={itemIcon} />
              {t("Déconnexion")}
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
        className="hidden rounded-md border border-[#e60050] px-4 py-2 text-sm font-medium text-[#e60050] hover:underline sm:block"
      >
        {t("S'inscrire | Se connecter")}
      </button>
      <button
        type="button"
        onClick={() => openAuthModal("account", "signin")}
        aria-label={t("Se connecter")}
        className="rounded-md border border-[#e60050] p-2 text-[#e60050] sm:hidden"
      >
        <LogIn className="h-5 w-5" />
      </button>
      <Link
        to="/inscription"
        className="rounded-md bg-[#e60050] px-4 py-2 text-sm font-medium text-white"
      >
        {t("Créer mon profil")}
      </Link>
    </div>
    <AuthModal />
    </>
  );
}
