import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";
import { SUPPRESS_DAYS, applySuppression, campaignState } from "@/lib/admin-announce";

export const Route = createFileRoute("/admin/announcements")({
  component: AdminAnnouncements,
} as any);

const TABS = ["Annonces in-app", "E-mail", "Push"] as const;

// ponytail: in-app only (notifications fan-out) — no push provider, no ad placements, e-mail stays transactional;
// sending stays manual (no worker): scheduled = intent + due flag, never auto-send (no AI-triggered sends either)
function AdminAnnouncements() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Annonces in-app");
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, { sent: number; read: number }>>({});
  const [mailStats, setMailStats] = useState<{ sent: number; failed: number } | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [country, setCountry] = useState("");
  const [scheduled, setScheduled] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; recipients: number; skipped: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [an, ml] = await Promise.all([
      supabase.from("swivv_announcements").select("*").order("created_at", { ascending: false }).limit(50),
      (supabase as any).from("swivv_email_log").select("status").then((r: any) => (r.error ? null : (r.data ?? []))),
    ]);
    if (an.error) setMsg(an.error.message);
    else setRows((an.data ?? []) as any[]);
    if (ml) {
      const m = ml as { status: string }[];
      setMailStats({ sent: m.filter((x) => x.status === "sent").length, failed: m.filter((x) => x.status === "failed").length });
    }
  }

  useEffect(() => {
    load();
    audit("admin.announcements.view");
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("swivv_announcements").insert({
      title: title.trim(),
      body: body.trim(),
      audience,
      target_country: country.trim() || null,
      scheduled_at: scheduled ? new Date(scheduled).toISOString() : null,
      created_by: user?.id,
    } as any).select("id").single();
    if (error || !data) {
      setMsg(error?.message ?? "Création impossible.");
      setBusy(false);
      return;
    }
    audit("admin.announcement.create", "announcement", (data as any).id, { audience });
    setTitle("");
    setBody("");
    setCountry("");
    setScheduled("");
    load();
    setBusy(false);
  }

  async function preview(r: any) {
    if (previewId === r.id) {
      setPreviewId(null);
      return;
    }
    setPreviewId(r.id);
    if (stats[r.id] !== undefined || !r.sent_at) return;
    const { data } = await (supabase as any).from("swivv_notifications").select("read").eq("type", "announcement").eq("title", r.title).gte("created_at", r.sent_at).limit(5000);
    const list = (data ?? []) as { read: boolean }[];
    setStats((s) => ({ ...s, [r.id]: { sent: list.length, read: list.filter((x) => x.read).length } }));
  }

  async function testSend(r: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("swivv_notifications").insert({
      user_id: user.id,
      type: "announcement",
      title: `[TEST] ${r.title}`,
      message: r.body.slice(0, 300),
    });
    if (error) setMsg(error.message);
    else {
      audit("admin.announcement.test", "announcement", r.id);
      setMsg("Envoi test : vérifie tes notifications.");
    }
  }

  // ponytail: two-step send (count → explicit confirm) with 7-day suppression — one bulk insert, skips recent recipients; queue/chunk past 2000
  async function prepareSend(r: any) {
    setBusy(true);
    setMsg(null);
    let q = supabase.from("swivv_profiles").select("user_id,data").limit(2000);
    if (r.audience === "verified") q = q.eq("data->>verified" as any, "true");
    if (r.target_country) q = q.eq("data->>country" as any, r.target_country);
    const { data: profs, error: e1 } = await q;
    if (e1) {
      setMsg(e1.message);
      setBusy(false);
      return;
    }
    const ids = ((profs ?? []) as any[]).map((p) => p.user_id as string);
    const { data: recent } = await (supabase as any).from("swivv_notifications").select("user_id").eq("type", "announcement")
      .gte("created_at", new Date(Date.now() - SUPPRESS_DAYS * 864e5).toISOString()).limit(5000);
    const { send, skipped } = applySuppression(ids, ((recent ?? []) as any[]).map((x) => x.user_id as string));
    setBusy(false);
    setConfirm({ id: r.id, recipients: send.length, skipped: skipped.length });
  }

  async function confirmSend() {
    if (!confirm) return;
    const r = rows.find((x) => x.id === confirm.id);
    if (!r) return;
    setBusy(true);
    let q = supabase.from("swivv_profiles").select("user_id,data").limit(2000);
    if (r.audience === "verified") q = q.eq("data->>verified" as any, "true");
    if (r.target_country) q = q.eq("data->>country" as any, r.target_country);
    const { data: profs } = await q;
    const ids = ((profs ?? []) as any[]).map((p) => p.user_id as string);
    const { data: recent } = await (supabase as any).from("swivv_notifications").select("user_id").eq("type", "announcement")
      .gte("created_at", new Date(Date.now() - SUPPRESS_DAYS * 864e5).toISOString()).limit(5000);
    const { send } = applySuppression(ids, ((recent ?? []) as any[]).map((x) => x.user_id as string));
    if (send.length) {
      const { error } = await supabase.from("swivv_notifications").insert(send.map((id) => ({
        user_id: id, type: "announcement", title: r.title, message: r.body.slice(0, 300),
      })));
      if (error) {
        setMsg(error.message);
        setBusy(false);
        return;
      }
    }
    await supabase.from("swivv_announcements").update({ sent_at: new Date().toISOString() }).eq("id", r.id);
    audit("admin.announcement.send", "announcement", r.id, { recipients: send.length });
    setMsg(`Envoyé à ${send.length} utilisateur(s), ${confirm.skipped} écarté(s) (7 j).`);
    setConfirm(null);
    load();
    setBusy(false);
  }

  async function cancel(r: any) {
    if (!window.confirm("Annuler cette campagne planifiée ?")) return;
    const { error } = await supabase.from("swivv_announcements").update({ cancelled_at: new Date().toISOString() } as any).eq("id", r.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.announcement.cancel", "announcement", r.id);
    setMsg("Campagne annulée.");
    load();
  }

  const stateFr: Record<string, string> = { draft: "Brouillon", scheduled: "Planifiée", sending_due: "À envoyer", sent: "Envoyée", cancelled: "Annulée" };

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Annonces</h1>
      <nav className="mt-3 flex gap-1" aria-label="Canaux">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-[#14112b] text-white" : "bg-white text-[#555]"}`}>{t}</button>
        ))}
      </nav>

      {tab === "Annonces in-app" && (
        <>
          <form onSubmit={create} className="mt-4 space-y-2 rounded-xl bg-white p-4 shadow-sm">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" maxLength={120} aria-label="Titre" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" rows={3} maxLength={2000} aria-label="Message" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
            <div className="flex flex-wrap gap-2">
              <select value={audience} onChange={(e) => setAudience(e.target.value)} aria-label="Audience (attributs non sensibles uniquement)" className="rounded-md border border-border bg-white px-3 py-2 text-sm">
                <option value="all">Tous</option>
                <option value="verified">Vérifiés</option>
              </select>
              <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pays (optionnel)" aria-label="Pays cible" className="rounded-md border border-border px-3 py-2 text-sm" />
              <input value={scheduled} onChange={(e) => setScheduled(e.target.value)} type="datetime-local" aria-label="Envoi planifié (Europe/Paris, manuel)" className="rounded-md border border-border px-3 py-2 text-sm" />
              <button type="submit" disabled={busy} className="rounded-md bg-[#e60050] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Créer (brouillon)</button>
            </div>
            <p className="text-xs text-[#999]">Planification = intention + fanion « à envoyer » (aucun worker : l'envoi reste manuel, fuseau Europe/Paris). Audiences : attributs non sensibles uniquement.</p>
          </form>
          {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
          {confirm && (
            <div role="alert" className="mt-2 rounded-lg bg-amber-50 p-3 text-sm">
              <p>Envoyer à <strong>{confirm.recipients}</strong> utilisateur(s) ? {confirm.skipped} écarté(s) (annonce {"<"} 7 j). Aucun envoi auto, aucun par l'IA.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={confirmSend} disabled={busy} className="rounded-md bg-[#e60050] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Oui, envoyer</button>
                <button type="button" onClick={() => setConfirm(null)} className="rounded-md border border-border bg-white px-4 py-2 text-sm">Annuler</button>
              </div>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {rows.map((r) => {
              const st = campaignState(r);
              const s = stats[r.id];
              return (
                <article key={r.id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
                  <button type="button" onClick={() => preview(r)} aria-expanded={previewId === r.id} className="flex w-full flex-wrap items-center gap-2 text-left">
                    <span className="font-medium text-[#333]">{r.title}</span>
                    <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{stateFr[st]}</span>
                    <span className="text-xs text-[#999]">{r.audience}{r.target_country ? ` · ${r.target_country}` : ""}{r.scheduled_at ? ` · planifiée le ${new Date(r.scheduled_at).toLocaleString("fr-FR")}` : ""}{r.sent_at ? ` · envoyée le ${new Date(r.sent_at).toLocaleString("fr-FR")}` : ""}</span>
                  </button>
                  {previewId === r.id && (
                    <div className="mt-2 border-t border-border pt-2">
                      <p className="text-[#555]">{r.body}</p>
                      {r.sent_at && s && <p className="mt-1 text-xs text-[#777]">Notifications : {s.sent} · lues : {s.read} (pas de tracking d'ouverture/clic — non instrumenté).</p>}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <button type="button" onClick={() => testSend(r)} className="rounded border border-border px-2 py-1">Envoi test (moi)</button>
                        {(st === "draft" || st === "sending_due") && <button type="button" onClick={() => prepareSend(r)} disabled={busy} className="rounded border border-border px-2 py-1 disabled:opacity-50">Envoyer…</button>}
                        {(st === "draft" || st === "scheduled") && <button type="button" onClick={() => cancel(r)} className="rounded border border-border px-2 py-1">Annuler</button>}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            {rows.length === 0 && <p className="text-sm text-[#777]">Aucune campagne.</p>}
          </div>
        </>
      )}

      {tab === "E-mail" && (
        <div className="mt-4 rounded-xl bg-white p-4 text-sm shadow-sm">
          <p className="text-[#333]">Campagnes e-mail <strong>non branchées</strong> : Resend ne sert que le transactionnel serveur. Aucune statistique d'ouverture/clic (pas de webhooks).</p>
          <p className="mt-2 text-[#777]">Journal réel : {mailStats ? `${mailStats.sent} envoyé(s), ${mailStats.failed} en échec.` : "journal illisible pour ce rôle."}</p>
        </div>
      )}

      {tab === "Push" && (
        <div className="mt-4 rounded-xl bg-white p-4 text-sm shadow-sm">
          <p className="text-[#333]">Aucun fournisseur push configuré — pas d'envois push possibles. Les annonces in-app ci-dessus sont le seul canal de masse.</p>
        </div>
      )}
    </div>
  );
}
