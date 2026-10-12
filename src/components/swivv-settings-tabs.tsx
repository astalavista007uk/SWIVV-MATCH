import { Link } from "@tanstack/react-router";
import { Bell, ChartColumn, CircleHelp, CreditCard, User } from "lucide-react";

// ponytail: 5 fixed tabs, generate from array if a 6th page joins
const TABS = [
  { label: "Profil", to: "/parametres", Icon: User },
  { label: "Mes statistiques", to: "/statistiques", Icon: ChartColumn },
  { label: "Facturation", to: "/facturation", Icon: CreditCard },
  { label: "Notifications", to: "/notifications", Icon: Bell },
  { label: "Aide", to: "/help", Icon: CircleHelp },
] as const;

/** Horizontal icon tabs linking the hamburger menu pages to each other. */
export function SwivvSettingsTabs() {
  return (
    <nav aria-label="Réglages" className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map(({ label, to, Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-[#555] hover:text-[#e91e63] [&[data-status=active]]:border-[#e91e63] [&[data-status=active]]:bg-[#e91e63] [&[data-status=active]]:text-white"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
