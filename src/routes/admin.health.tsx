import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";
import { STATUS_FR, evaluate, type Probe } from "@/lib/admin-health";

export const Route = createFileRoute("/admin/health")({
  component: AdminHealth,
} as any);

const TABS = ["Services", "Erreurs", "Base", "Stockage", "Tâches", "Notifications", "Intégrations", "Performance"] as const;

// ponytail: browser-measurable only (probes, navigation timing, app tables) — HTTP counts, storage usage,
// job runners and provider dashboards don't exist client-side and read "non surveillé", never green
function AdminHealth() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Services");
  const [probes, setProbes] = useState<Record<string, Probe & { label: string }>>({});
  const [errors, setErrors] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[] | null>(null);
  const [mail, setMail] = useState<{ sent: number; failed: number; queued: number } | null>(null);
  const [notifVol, setNotifVol] = useState<number | null>(null);
  const [nav, setNav] = useState<{ dcl: number; load: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function timed(label: string, fn: () => any): Promise<void> {
    const t0 = performance.now();
    try {
      const { error } = await fn();
      setProbes((p) => ({ ...p, [label]: { label, ok: !error, ms: Math.round(performance.now() - t0) } }));
    } catch {
      setProbes((p) => ({ ...p, [label]: { label, ok: false, ms: Math.round(performance.now() - t0) } }));
    }
  }

  useEffect(() => {
    (async () => {
      const q = supabase as any;
      await Promise.all([
        timed("Supabase", () => supabase.from("swivv_profiles").select("user_id", { count: "exact", head: true })),
        timed("Auth", () => supabase.auth.getUser().then((r) => ({ error: r.error }))),
        timed("Profils", () => supabase.from("swivv_profiles").select("user_id", { count: "exact", head: true })),
        timed("Messages", () => supabase.from("swivv_chats").select("msg_id", { count: "exact", head: true })),
        timed("Notifications", () => supabase.from("swivv_notifications").select("user_id", { count: "exact", head: true })),
        timed("E-mails (journal)", () => q.from("swivv_email_log").select("status", { count: "exact", head: true })),
        timed("Signalements", () => supabase.from("swivv_reports").select("id", { count: "exact", head: true })),
      ]);
      // realtime probe: 5s subscribe timeout
      const t0 = performance.now();
      try {
        await new Promise<void>((resolve, reject) => {
          const ch = supabase.channel("health-probe").subscribe((s: string) => {
            if (s === "SUBSCRIBED") {
              supabase.removeChannel(ch);
              resolve();
            }
          });
          setTimeout(() => reject(new Error("timeout")), 5000);
        });
        setProbes((p) => ({ ...p, Realtime: { label: "Realtime", ok: true, ms: Math.round(performance.now() - t0) } }));
      } catch {
        setProbes((p) => ({ ...p, Realtime: { label: "Realtime", ok: false, ms: Math.round(performance.now() - t0) } }));
      }
      const [err, bk, ml, nv] = await Promise.all([
        q.from("swivv_client_errors").select("message,source,url,created_at").order("created_at", { ascending: false }).limit(100).then((r: any) => (r.error ? [] : (r.data ?? []))),
        supabase.storage.listBuckets().then((r: any) => (r.error ? null : (r.data ?? []))),
        q.from("swivv_email_log").select("status").then((r: any) => (r.error ? null : (r.data ?? []))),
        q.from("swivv_notifications").select("user_id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 864e5).toISOString()).then((r: any) => (r.error ? null : r.count)),
      ]);
      setErrors(err);
      setBuckets(bk);
      if (ml) {
        const m = ml as { status: string }[];
        setMail({ sent: m.filter((x) => x.status === "sent").length, failed: m.filter((x) => x.status === "failed").length, queued: m.filter((x) => x.status === "queued").length });
      }
      setNotifVol(nv);
      const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (navEntries.length) {
        const n = navEntries[0];
        setNav({ dcl: Math.round(n.domContentLoadedEventEnd - n.startTime), load: Math.round(n.loadEventEnd - n.startTime) });
      }
      audit("admin.health.view");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badge = (s: string) => (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s === "healthy" ? "bg-green-100 text-green-800" : s === "degraded" ? "bg-amber-100 text-amber-800" : s === "unavailable" ? "bg-red-100 text-red-800" : "bg-[#f2f2f2] text-[#555]"}`}>
      {STATUS_FR[s as keyof typeof STATUS_FR]}
    </span>
  );
  const card = "rounded-xl bg-white p-4 text-sm shadow-sm";
  const err24 = errors.filter((e) => Date.now() - new Date(e.created_at).getTime() < 864e5).length;
  const latData = Object.values(probes).map((p) => ({ label: p.label, ms: p.ms ?? 0 }));

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Santé technique</h1>
      <p className="mt-1 text-xs text-[#999]">Mesuré depuis le navigateur (sondes, timing réel). L'instrumentation serveur (HTTP, usage stockage, jobs) n'existe pas et s'affiche comme telle.</p>
      <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Santé">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-[#14112b] text-white" : "bg-white text-[#555]"}`}>{t}</button>
        ))}
      </nav>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}

      {tab === "Services" && (
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <div className={card}><p className="font-medium text-[#333]">Application</p><div className="mt-1">{badge("healthy")}</div><p className="mt-1 text-xs text-[#999]">Cette page chargée = disponible.</p></div>
          {Object.values(probes).map((p) => {
            const s = evaluate(p);
            return (
              <div key={p.label} className={card}>
                <p className="font-medium text-[#333]">{p.label}</p>
                <div className="mt-1">{badge(s)}</div>
                <p className="mt-1 text-xs text-[#999]">{p.ms == null ? "—" : `${p.ms} ms`} · seuil dégradé &gt; 2000 ms</p>
              </div>
            );
          })}
        </div>
      )}

      {tab === "Erreurs" && (
        <div className={`${card} mt-3`}>
          <p className="font-medium text-[#333]">Erreurs client admin ({errors.length}, dont {err24} / 24 h)</p>
          <p className="text-xs text-[#999]">Journal swivv_client_errors (sans mots de passe, tokens ni contenus). Taux 4xx/5xx : non instrumenté côté serveur.</p>
          {errors.slice(0, 30).map((e: any, i: number) => (
            <p key={i} className="mt-1 text-xs text-[#555]">{e.message} <span className="text-[#999]">· {e.source ?? ""} {e.url ?? ""} · {new Date(e.created_at).toLocaleString("fr-FR")}</span></p>
          ))}
          {!errors.length && <p className="mt-1 text-xs text-[#999]">Aucune erreur enregistrée (table absente ou vide — migration 20261021000000).</p>}
        </div>
      )}

      {tab === "Base" && (
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          {["Profils", "Messages", "Notifications", "E-mails (journal)", "Signalements"].map((k) => {
            const p = probes[k];
            const s = p ? evaluate(p) : "unmonitored";
            return (
              <div key={k} className={card}>
                <p className="font-medium text-[#333]">{k}</p>
                <div className="mt-1">{badge(s as string)}</div>
                <p className="mt-1 text-xs text-[#999]">{p?.ms == null ? "—" : `${p.ms} ms`} · requêtes head (latence aller-retour)</p>
              </div>
            );
          })}
          <div className={card}><p className="font-medium text-[#333]">Opérations en échec</p><div className="mt-1">{badge("unmonitored")}</div><p className="mt-1 text-xs text-[#999]">Pas de compteur serveur — les échecs visibles remontent dans les messages d'erreur des pages.</p></div>
        </div>
      )}

      {tab === "Stockage" && (
        <div className={`${card} mt-3`}>
          <p className="font-medium text-[#333]">Buckets ({buckets == null ? "illisible pour ce rôle" : buckets.length})</p>
          {(buckets ?? []).map((b: any) => <p key={b.id} className="mt-1 text-xs text-[#555]">{b.id} {b.public ? "(public)" : "(privé)"}</p>)}
          <p className="mt-2 text-xs text-[#999]">Usage volumétrique et échecs d'upload : non mesurables côté client (dashboard Supabase). Photos dating hors buckets (data URLs). Voix : bucket public par conception.</p>
          <div className="mt-1">{badge("unmonitored")}</div>
        </div>
      )}

      {tab === "Tâches" && (
        <div className={`${card} mt-3`}>
          <p className="font-medium text-[#333]">Aucune tâche planifiée configurée (ni cron, ni worker).</p>
          <p className="mt-1 text-xs text-[#999]">Envois programmés, relances et files : traitement manuel. Triggers DB (audit sanctions/vérifications) actifs par conception. Rien à relancer, aucune idempotence à gérer.</p>
          <div className="mt-1">{badge("unmonitored")}</div>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <div className={card}><p className="text-3xl font-bold text-[#333]">{mail ? mail.sent : "…"}</p><p className="mt-1 text-[#777]">E-mails envoyés</p></div>
          <div className={card}><p className="text-3xl font-bold text-[#e60050]">{mail ? mail.failed : "…"}</p><p className="mt-1 text-[#777]">E-mails en échec</p></div>
          <div className={card}><p className="text-3xl font-bold text-[#333]">{mail ? mail.queued : "…"}</p><p className="mt-1 text-[#777]">En file</p></div>
          <div className={card}><p className="text-3xl font-bold text-[#333]">{notifVol ?? "…"}</p><p className="mt-1 text-[#777]">Notifications in-app / 24 h</p></div>
        </div>
      )}

      {tab === "Intégrations" && (
        <div className={`${card} mt-3`}>
          <p className="font-medium text-[#333]">Resend (e-mail) : configuration déploiement, non vérifiable ici.</p>
          <p className="mt-1 text-[#555]">IA : aucun fournisseur. Realtime : voir Services. {msg}</p>
          <p className="mt-1 text-xs text-[#999]">Clés jamais affichées ; ajout côté serveur/hébergeur.</p>
        </div>
      )}

      {tab === "Performance" && (
        <div className={`${card} mt-3`}>
          <p className="font-medium text-[#333]">Chargement réel de cette page : {nav ? `DOM ${nav.dcl} ms · complet ${nav.load} ms` : "—"}</p>
          <p className="text-xs text-[#999]">Navigation Timing (ton navigateur). Latences sondes ci-dessous :</p>
          <div className="mt-2 h-48">
            <ResponsiveContainer>
              <BarChart data={latData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-18} dy={8} height={48} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="ms" fill="#6747c7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
