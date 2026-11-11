import { Link, useNavigate } from "@tanstack/react-router";
import { Flame, Heart, Mail, Zap } from "lucide-react";
import { useUnreadCount, useRecusCount, useSwivvStore } from "@/lib/swivv-store";
import { useUnreadNotifs } from "@/lib/swivv-notifs";
import { requireSwivvAuth } from "@/lib/swivv-auth";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";

export function MessageHeartBadge() {
  const n = useUnreadCount();
  if (n === 0) return null;
  return (
    <span
      aria-label={`${n} message${n > 1 ? "s" : ""} non lu${n > 1 ? "s" : ""}`}
      className="absolute right-1 -top-1 flex h-4 w-4 items-center justify-center"
    >
      <Heart className="h-4 w-4" fill="#E60050" strokeWidth={0} aria-hidden="true" />
      <span className="absolute text-[8px] font-bold leading-none text-white">
        {n > 9 ? "9+" : n}
      </span>
    </span>
  );
}

export function NotifBadge() {
  const n = useUnreadNotifs();
  if (n === 0) return null;
  return (
    <span
      aria-label={`${n} notification${n > 1 ? "s" : ""} non lue${n > 1 ? "s" : ""}`}
      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center"
    >
      <Heart className="h-4 w-4" fill="#E60050" strokeWidth={0} aria-hidden="true" />
      <span className="absolute text-[8px] font-bold leading-none text-white">
        {n > 99 ? "99+" : n}
      </span>
    </span>
  );
}

// ponytail: same heart-badge pattern as messages, red for likes — merge into one parametrized badge if a third count appears
export function LikesRecusBadge() {  const n = useRecusCount();
  if (n === 0) return null;
  return (
    <span
      aria-label={`${n} like${n > 1 ? "s" : ""} reçu${n > 1 ? "s" : ""}`}
      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center"
    >
      <Heart className="h-4 w-4" fill="#E60050" strokeWidth={0} aria-hidden="true" />
      <span className="absolute text-[8px] font-bold leading-none text-white">
        {n > 9 ? "9+" : n}
      </span>
    </span>
  );
}

export function MyLikesBadge() {
  const { likes } = useSwivvStore();
  const n = likes.length;
  if (n === 0) return null;
  return (
    <span
      aria-label={`${n} like${n > 1 ? "s" : ""} donné${n > 1 ? "s" : ""}`}
      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center"
    >
      <Heart className="h-4 w-4" fill="#E60050" strokeWidth={0} aria-hidden="true" />
      <span className="absolute text-[8px] font-bold leading-none text-white">
        {n > 9 ? "9+" : n}
      </span>
    </span>
  );
}

// ponytail: one icon row rendered inside SwivvAuthButtons, so every page header gets it — don't re-add per-page copies
// ponytail: CSS-only hover popup mirroring MatchTooltip (no JS lib) — drop title= where used to avoid double popups; white text if black-on-grey ever fails contrast
function Tip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-black px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover/tip:block">
      {label}
    </span>
  );
}
export function SwivvTopIcons() {
  const { user } = useAuth();
  const t = useT();
  const nav = useNavigate();
  if (!user) return null;
  return (
    // ponytail: full-width second row under the account controls on mobile, inline on desktop — grid if a third row is ever needed
    <div className="flex w-full basis-full items-center gap-3 sm:order-2 sm:w-auto sm:basis-auto">
      <button
        type="button"
        onClick={() => requireSwivvAuth("message", () => nav({ to: "/messagerie" }))}
        aria-label="Messages"
        className="tap-44 group/tip relative whitespace-nowrap font-medium text-white hover:underline"
      >
        <Tip label="Mes Messages" />
        <span className="relative block">
          <Mail className="h-6 w-11" strokeWidth={1.5} />
          {/* ponytail: lucide overlay, custom love-letter SVG if brand wants its own mark */}
          <Heart className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          {/* ponytail: unread counted live from localStore, server badge if push ever lands */}
          <MessageHeartBadge />
        </span>
      </button>
      <Link
        to="/browse"
        search={{ q: "", type: "likes", location: "" }}
        aria-label={t("Profils likés")}
        className="tap-44 group/tip relative whitespace-nowrap font-medium text-white hover:underline"
      >
        <Tip label={t("Mes Likes")} />
        <span className="relative block">
          <Heart className="h-6 w-6" strokeWidth={1.5} />
          <MyLikesBadge />
        </span>
      </Link>
      {/* ponytail: bell lives left of the avatar in SwivvAuthButtons (all viewports) — don't re-add a copy here */}
      <Link
        to="/matches"
        className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-white hover:underline"
        // ponytail: router-driven active state like the category nav — shared ActiveLink if a third text link appears
        activeProps={{ className: "inline-flex items-center gap-1 whitespace-nowrap font-medium text-white underline decoration-[#e60050] decoration-2 underline-offset-4" }}
      >
        <Flame className="h-4 w-4" aria-hidden="true" />
        {t("Mes Matches")}
      </Link>
      <Link
        to="/swipe"
        className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-white hover:underline"
        activeProps={{ className: "inline-flex items-center gap-1 whitespace-nowrap font-medium text-white underline decoration-[#e60050] decoration-2 underline-offset-4" }}
      >
        <Zap className="h-4 w-4" aria-hidden="true" />
        SWIVV SWIPE
      </Link>
      <Link
        to="/browse"
        search={{ q: "", type: "recus", location: "" }}
        aria-label="Likes reçus"
        className="tap-44 group/tip relative whitespace-nowrap font-medium text-white hover:underline"
      >
        <Tip label="Likes Reçus" />
        <span className="relative block">
          <Heart className="h-6 w-6 fill-current" strokeWidth={1.5} />
          <LikesRecusBadge />
        </span>
      </Link>
    </div>
  );
}
