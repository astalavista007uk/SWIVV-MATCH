import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SwivvSettingsTabs } from "@/components/swivv-settings-tabs";
import { deleteNotif, listNotifs, markNotifsRead, type SwivvNotif } from "@/lib/swivv-notifs";
import { loadServerPrefs, saveServerPrefs } from "@/lib/swivv-notify";
import { validLink } from "@/lib/swivv-notify.logic";
import { getSettings, type SwivvSettings } from "@/lib/swivv-store";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — SWIVV" }] }),
  component: NotificationsPage,
});

const PAGE = 20;
const FILTERS = [
  { id: "all", label: "Toutes" },
  { id: "unread", label: "Non lues" },
  { id: "message", label: "Messages" },
  { id: "likes", label: "Likes et matchs" },
  { id: "profile", label: "Activité du profil" },
  { id: "account", label: "Compte et sécurité" },
] as const;
const LIKE_SET = new Set(["like", "match"]);
const PROFILE_SET = new Set(["view", "reaction"]);
const ACCOUNT_SET = new Set(["account", "security"]);

function matchFilter(n: SwivvNotif, f: string): boolean {
  if (f === "all") return true;
  if (f === "unread") return !n.read;
  if (f === "message") return n.type === "message";
  if (f === "likes") return LIKE_SET.has(n.type);
  if (f === "profile") return PROFILE_SET.has(n.type);
  return ACCOUNT_SET.has(n.type) || n.type === "info";
}

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
  const [settings, setS] = useState<SwivvSettings>(getSettings);
  const [marketing, setMarketing] = useState(false);
  const [digest, setDigest] = useState("daily");
  const [notifs, setNotifs] = useState<SwivvNotif[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [shown, setShown] = useState(PAGE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    loadServerPrefs().then((p) => {
      if (!live) return;
      setS(p.settings);
      setMarketing(p.marketing);
      setDigest(p.digest);
    });
    listNotifs(100, 0).then((rows) => {
      if (live) setNotifs(rows);
    });
    // ponytail: live list (INSERT + read-state changes elsewhere) — opening the page no longer marks anything read
    let ch: { unsubscribe: () => void } | null = null;
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !live) return;
      const uid = data.user.id;
      const reload = () => void listNotifs(100, 0).then((rows) => live && setNotifs(rows));
      ch = supabase.channel(`swivv-centre:${uid}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "swivv_notifications", filter: `user_id=eq.${uid}` }, reload)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "swivv_notifications", filter: `user_id=eq.${uid}` }, reload)
        .subscribe() as unknown as { unsubscribe: () => void };
    });
    return () => {
      live = false;
      ch?.unsubscribe();
    };
  }, []);

  async function persist(s: SwivvSettings, m: boolean, d: string) {
    setSaving(true);
    await saveServerPrefs(s, m, d);
    setSaving(false);
  }
  function flip(k: keyof SwivvSettings, v: boolean) {
    const s = { ...settings, [k]: v };
    setS(s);
    void persist(s, marketing, digest);
  }

  async function markOne(id: string) {
    await markNotifsRead([id]);
    setNotifs((ns) => (ns ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
  async function markAll() {
    const ids = (notifs ?? []).filter((n) => !n.read).map((n) => n.id);
    await markNotifsRead(ids);
    setNotifs((ns) => (ns ?? []).map((n) => ({ ...n, read: true })));
  }
  async function dismiss(id: string) {
    await deleteNotif(id);
    setNotifs((ns) => (ns ?? []).filter((n) => n.id !== id));
  }

  const sections: { title: string; items: { k: keyof SwivvSettings; label: string; desc: string }[] }[] = [
    {
      title: "Notifications e-mail",
      items: [
        { k: "emailMessages", label: "Nouveaux messages", desc: "Recevez un e-mail lorsque vous recevez un nouveau message." },
        { k: "emailLiked", label: "On vous a liké", desc: "Recevez un e-mail lorsqu'un membre aime votre profil." },
        { k: "emailMatches", label: "Nouveaux matchs", desc: "Recevez un e-mail lorsqu'un nouveau match est créé." },
        { k: "emailInteractions", label: "Interactions sur votre profil", desc: "Recevez un résumé de l'activité sur votre profil et de vos conversations." },
      ],
    },
    {
      title: "Notifications en temps réel",
      items: [
        { k: "rtMessages", label: "Nouveaux messages", desc: "Recevez une alerte dès qu'un nouveau message arrive." },
        { k: "rtLiked", label: "On vous a liké", desc: "Soyez averti lorsqu'un membre aime votre profil." },
        { k: "rtViewed", label: "Quelqu'un a consulté votre profil", desc: "Soyez averti lorsqu'un membre consulte votre profil." },
        { k: "rtReactions", label: "Réactions à vos photos", desc: "Soyez averti lorsqu'un membre réagit à l'une de vos photos." },
      ],
    },
  ];

  const visible = (notifs ?? []).filter((n) => matchFilter(n, filter));
  const unreadCount = (notifs ?? []).filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-medium text-[#333]">Notifications{unreadCount > 0 && <span className="ml-2 text-base text-[#e91e63]">{unreadCount}</span>}</h1>
          {unreadCount > 0 && (
            <button type="button" onClick={markAll} className="shrink-0 text-sm font-medium text-[#e91e63] hover:underline">
              Tout marquer comme lu
            </button>
          )}
        </div>
        <SwivvSettingsTabs />
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filtres">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => { setFilter(f.id); setShown(PAGE); }}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${filter === f.id ? "border-[#e91e63] bg-[#e91e63] text-white" : "border-border bg-white text-[#555] hover:text-[#e91e63]"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2" aria-live="polite">
          {notifs === null ? (
            <p className="text-sm text-[#777]">Chargement…</p>
          ) : visible.length === 0 ? (
            <p className="text-sm text-[#777]">Vous êtes à jour ! Aucune nouvelle notification pour le moment.</p>
          ) : (
            visible.slice(0, shown).map((n) => (
              <article key={n.id} className={`rounded-lg p-3 shadow-sm ${n.read ? "bg-white" : "bg-[#e91e63]/5 ring-1 ring-[#e91e63]/30"}`}>
                <p className="text-[15px] font-medium text-[#333]">{n.title}</p>
                {n.message && <p className="mt-0.5 text-sm text-[#555]">{n.message}</p>}
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#999]">
                  <span>{new Date(n.created_at).toLocaleString("fr-FR")}</span>
                  {n.link && validLink(n.link) && <a href={n.link} className="font-medium text-[#e91e63] hover:underline">Voir</a>}
                  {!n.read && <button type="button" onClick={() => markOne(n.id)} className="font-medium text-[#555] hover:underline">Marquer comme lu</button>}
                  <button type="button" onClick={() => dismiss(n.id)} aria-label="Supprimer cette notification" className="font-medium text-[#999] hover:underline">Supprimer</button>
                </p>
              </article>
            ))
          )}
        </div>
        {visible.length > shown && (
          <button type="button" onClick={() => setShown((s) => s + PAGE)} className="mt-3 text-sm font-medium text-[#e91e63] hover:underline">
            Afficher plus
          </button>
        )}
        <div className="mt-4 space-y-2">
          <Toggle
            label="Badge de messages non lus"
            desc="Afficher un badge sur l'icône Messages lorsque vous recevez des messages non lus."
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
        <section className="mt-6">
          <h2 className="mb-2 text-xl font-bold text-[#333]">Résumé d&apos;activité</h2>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-white p-3 shadow-sm">
              <span>
                <span className="block text-[15px] font-medium text-[#333]">Fréquence du résumé</span>
                <span className="block text-sm text-[#777]">Un e-mail récapitulatif, seulement en cas d&apos;activité réelle.</span>
              </span>
              <select value={digest} onChange={(e) => { setDigest(e.target.value); void persist(settings, marketing, e.target.value); }} className="shrink-0 rounded-md border border-border bg-white px-3 py-2 text-sm" aria-label="Fréquence du résumé">
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="off">Désactivé</option>
              </select>
            </label>
          </div>
        </section>
        <section className="mt-6">
          <h2 className="mb-2 text-xl font-bold text-[#333]">Offres et nouveautés SWIVV</h2>
          <div className="space-y-2">
            <Toggle
              label="E-mails marketing"
              desc="Recevez occasionnellement nos nouveautés, conseils et offres SWIVV MATCH. Désinscription possible à tout moment ici."
              checked={marketing}
              onChange={(v) => { setMarketing(v); void persist(settings, v, digest); }}
            />
          </div>
        </section>
        {saving && <p className="mt-3 text-xs text-[#999]">Enregistrement…</p>}
      </main>
      <SwivvFooter />
    </div>
  );
}
