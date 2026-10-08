import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SwivvSettingsTabs } from "@/components/swivv-settings-tabs";
import { listNotifs, markNotifsRead, type SwivvNotif } from "@/lib/swivv-notifs";
import { getSettings, setSetting, type SwivvSettings } from "@/lib/swivv-store";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — SWIVV" }] }),
  component: NotificationsPage,
});

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-white p-3 shadow-sm">
      <span>
        <span className="block text-[15px] font-medium text-[#333]">{label}</span>
        <span className="block text-sm text-[#777]">{desc}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-[#e91e63]"
      />
    </label>
  );
}

function NotificationsPage() {
  const [settings, setS] = useState(getSettings);
  const [notifs, setNotifs] = useState<SwivvNotif[] | null>(null);

  // ponytail: opening the inbox marks everything read (badge clears on next navigation) — per-item read states if "unread" ever needs to survive a visit
  useEffect(() => {
    let live = true;
    listNotifs().then((rows) => {
      if (!live) return;
      setNotifs(rows);
      const unread = rows.filter((r) => !r.read).map((r) => r.id);
      if (unread.length > 0) void markNotifsRead(unread);
    });
    return () => {
      live = false;
    };
  }, []);

  function flip(k: keyof SwivvSettings, v: boolean) {
    setSetting(k, v);
    setS(getSettings());
  }

  const sections: { title: string; items: { k: keyof SwivvSettings; label: string; desc: string }[] }[] = [
    {
      title: "Notifications e-mail",
      items: [
        { k: "emailMessages", label: "Nouveaux messages", desc: "Un e-mail quand tu reçois un message." },
        { k: "emailLiked", label: "On t'a liké", desc: "Un e-mail quand quelqu'un te like." },
        { k: "emailMatches", label: "Nouveaux matchs", desc: "Un e-mail pour chaque nouveau match." },
        { k: "emailInteractions", label: "Interactions sur ton profil", desc: "Vues, lectures de messages, messages non lus et plus." },
        { k: "emailOffers", label: "Offres et promos SWIVV", desc: "Bons plans et nouveautés, de temps en temps." },
      ],
    },
    {
      title: "Notifications en temps réel",
      items: [
        { k: "rtMessages", label: "Nouveaux messages", desc: "Alerte dès qu'un message arrive." },
        { k: "rtLiked", label: "On t'a liké", desc: "Alerte dès que quelqu'un te like." },
        { k: "rtViewed", label: "Quelqu'un a vu ton profil", desc: "Alerte à chaque visite de ton profil." },
        { k: "rtFavourite", label: "Ajouté en favori", desc: "Quand quelqu'un t'ajoute à ses favoris." },
        { k: "rtPotential", label: "Matchs potentiels", desc: "Des profils compatibles à découvrir." },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-medium text-[#333]">Notifications</h1>
        <SwivvSettingsTabs />
        <div className="mt-4 space-y-2" aria-live="polite">
          {notifs === null ? (
            <p className="text-sm text-[#777]">Chargement…</p>
          ) : notifs.length === 0 ? (
            <p className="text-sm text-[#777]">Rien pour l'instant — les annonces et réponses du support apparaîtront ici.</p>
          ) : (
            notifs.map((n) => (
              <article key={n.id} className={`rounded-lg p-3 shadow-sm ${n.read ? "bg-white" : "bg-[#e91e63]/5 ring-1 ring-[#e91e63]/30"}`}>
                <p className="text-[15px] font-medium text-[#333]">{n.title}</p>
                {n.message && <p className="mt-0.5 text-sm text-[#555]">{n.message}</p>}
                <p className="mt-1 flex items-center gap-2 text-xs text-[#999]">
                  <span>{new Date(n.created_at).toLocaleString("fr-FR")}</span>
                  {n.link && <a href={n.link} className="font-medium text-[#e91e63] hover:underline">Voir</a>}
                </p>
              </article>
            ))
          )}
        </div>
        {/* ponytail: prefs are local-only, sync to notification_prefs when email/push senders read them */}
        <div className="mt-4 space-y-2">
          <Toggle
            label="Badge messages non lus"
            desc="Le petit cœur sur l'enveloppe Messages quand un message arrive."
            checked={settings.msgBadge}
            onChange={(v) => flip("msgBadge", v)}
          />
        </div>
        {sections.map((s) => (
          <section key={s.title} className="mt-6">
            <h2 className="mb-2 text-xl font-bold text-[#333]">{s.title}</h2>
            <div className="space-y-2">
              {s.items.map((it) => (
                <Toggle
                  key={it.k}
                  label={it.label}
                  desc={it.desc}
                  checked={settings[it.k]}
                  onChange={(v) => flip(it.k, v)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
      <SwivvFooter />
    </div>
  );
}
