import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  BadgeCheck,
  Flag,
  Images,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AuthModal, openAuthModal } from "@/lib/swivv-auth";
import { useAdminRole, type StaffRole } from "@/lib/admin";
import { SwivvLogo } from "@/components/swivv-logo";

export const Route = createFileRoute("/admin")({
  component: AdminShell,
});

// ponytail: shell-only hPanel look (dark bar + pale sidebar) — page bodies keep their white cards until each is restyled
const NAV: { to: string; label: string; min: number; end?: boolean; icon: LucideIcon }[] = [
  { to: "/admin", label: "Dashboard", min: 10, end: true, icon: LayoutDashboard },
  { to: "/admin/users", label: "Utilisateurs", min: 10, icon: Users },
  { to: "/admin/reports", label: "Signalements", min: 50, icon: Flag },
  { to: "/admin/moderation", label: "Modération", min: 50, icon: ShieldCheck },
  { to: "/admin/content", label: "Contenu", min: 50, icon: Images },
  { to: "/admin/verification", label: "Vérification", min: 50, icon: BadgeCheck },
  { to: "/admin/support", label: "Support", min: 30, icon: LifeBuoy },
  { to: "/admin/analytics", label: "Analytics", min: 10, icon: BarChart3 },
  { to: "/admin/announcements", label: "Annonces", min: 80, icon: Megaphone },
  { to: "/admin/audit", label: "Audit", min: 30, icon: ScrollText },
  { to: "/admin/settings", label: "Réglages", min: 100, icon: Settings },
];

const ROLE_LABEL: Record<StaffRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  moderator: "Modérateur",
  support: "Support",
  analyst: "Analyste",
};

function AdminShell() {
  const { role, loading, level } = useAdminRole();
  const nav = useNavigate();

  if (loading) return null;
  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#14112b] px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
          <SwivvLogo />
          <h1 className="mt-3 text-xl font-medium text-[#333]">SWIVV Admin</h1>
          <p className="mt-1 text-sm text-[#777]">
            Accès réservé à l'équipe SWIVV. Connecte-toi avec un compte staff.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("account", "signin")}
            className="mt-4 w-full rounded-md bg-[#6747c7] px-4 py-3 font-medium text-white"
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => nav({ to: "/" })}
            className="mt-2 w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium text-[#555]"
          >
            Retour au site
          </button>
        </div>
        <AuthModal />
      </div>
    );
  }

  const links = NAV.filter((l) => level >= l.min);
  return (
    <div className="min-h-screen bg-[#14112b]">
      <header className="flex items-center gap-2 px-4 py-3">
        <Link to="/" aria-label="SWIVV home"><SwivvLogo dark /></Link>
        <span className="rounded bg-[#6747c7] px-1.5 py-0.5 text-[11px] font-bold text-white">ADMIN</span>
        <span className="ml-auto hidden text-xs text-white/60 sm:block">{ROLE_LABEL[role]}</span>
        <Link to="/" className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10">
          Retour au site
        </Link>
      </header>
      <div className="flex flex-col gap-3 px-3 pb-3 lg:flex-row">
        <aside className="rounded-2xl bg-[#eceaf3] p-2 lg:w-60 lg:shrink-0">
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={l.end ? { exact: true } : undefined}
                className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm text-[#333] hover:bg-white/70 [&[data-status=active]]:bg-white [&[data-status=active]]:font-medium [&[data-status=active]]:shadow-sm"
              >
                <l.icon size={18} className="shrink-0 text-[#555}" aria-hidden />
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 rounded-2xl bg-[#f4f3fa] px-4 py-6">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
