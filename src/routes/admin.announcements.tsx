import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";

export const Route = createFileRoute("/admin/announcements")({
  component: AdminAnnouncements,
} as any);

function AdminAnnouncements() {
  const [rows, setRows] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [country, setCountry] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("swivv_announcements").select("*").order("created_at", { ascending: false }).limit(50);
    setRows(data ?? []);
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
      created_by: user?.id,
    }).select("id").single();
    if (error || !data) {
      setMsg(error?.message ?? "Création impossible.");
      setBusy(false);
      return;
    }
    audit("admin.announcement.create", "announcement", (data as any).id, { audience });
    setTitle("");
    setBody("");
    setCountry("");
    load();
    setBusy(false);
  }

  // ponytail: one bulk insert fans out to all matching profiles (≤2000) — queue/chunk when the base outgrows a single request
  async function send(id: string) {
    setBusy(true);
    setMsg(null);
    const ann = rows.find((r) => r.id === id);
    if (!ann) return;
    let q = supabase.from("swivv_profiles").select("user_id,data").limit(2000);
    if (ann.audience === "verified") q = q.eq("data->>verified" as any, "true");
    if (ann.target_country) q = q.eq("data->>country" as any, ann.target_country);
    const { data: profs, error: e1 } = await q;
    if (e1) {
      setMsg(e1.message);
      setBusy(false);
      return;
    }
    const batch = ((profs ?? []) as any[]).map((p) => ({
      user_id: p.user_id,
      type: "announcement",
      title: ann.title,
      message: ann.body.slice(0, 300),
    }));
    if (batch.length > 0) {
      const { error: e2 } = await supabase.from("swivv_notifications").insert(batch);
      if (e2) {
        setMsg(e2.message);
        setBusy(false);
        return;
      }
    }
    await supabase.from("swivv_announcements").update({ sent_at: new Date().toISOString() }).eq("id", id);
    audit("admin.announcement.send", "announcement", id, { recipients: batch.length });
    setMsg(`Envoyé à ${batch.length} utilisateur(s) (in-app).`);
    load();
    setBusy(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Annonces</h1>
      <form onSubmit={create} className="mt-4 space-y-2 rounded-xl bg-white p-4 shadow-sm">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" maxLength={120} aria-label="Titre" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" rows={3} maxLength={2000} aria-label="Message" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        <div className="flex flex-wrap gap-2">
          <select value={audience} onChange={(e) => setAudience(e.target.value)} aria-label="Audience" className="rounded-md border border-border bg-white px-3 py-2 text-sm">
            <option value="all">Tous</option>
            <option value="verified">Vérifiés</option>
          </select>
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pays (optionnel)" aria-label="Pays cible" className="rounded-md border border-border px-3 py-2 text-sm" />
          <button type="submit" disabled={busy} className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Créer</button>
        </div>
      </form>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <article key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 text-sm shadow-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#333]">{r.title}</p>
              <p className="truncate text-xs text-[#999]">{r.audience}{r.target_country ? ` · ${r.target_country}` : ""}{r.sent_at ? ` · envoyée le ${new Date(r.sent_at).toLocaleString("fr-FR")}` : " · brouillon"}</p>
            </div>
            {!r.sent_at && (
              <button type="button" onClick={() => send(r.id)} disabled={busy} className="rounded-md bg-[#e91e63] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Envoyer</button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
