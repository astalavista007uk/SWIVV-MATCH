import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { audit } from "@/lib/admin";

const STATUSES = ["open", "assigned", "waiting_user", "waiting_internal", "resolved", "closed"];

export const Route = createFileRoute("/admin/support")({
  component: AdminSupport,
} as any);

function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState("open");
  const [active, setActive] = useState<any>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function loadTickets() {
    let q = supabase.from("swivv_support_tickets").select("*").order("updated_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) setMsg(error.message);
    else setTickets(data ?? []);
  }

  async function open(t: any) {
    setActive(t);
    const { data } = await supabase.from("swivv_support_messages").select("*").eq("ticket_id", t.id).order("created_at");
    setThread(data ?? []);
    audit("admin.ticket.view", "ticket", t.id);
  }

  useEffect(() => {
    loadTickets();
    audit("admin.tickets.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function update(id: string, patch: Database["public"]["Tables"]["swivv_support_tickets"]["Update"], log: string) {
    const { error } = await supabase.from("swivv_support_tickets").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit(log, "ticket", id, patch as Record<string, unknown>);
    if (active?.id === id) setActive({ ...active, ...patch });
    loadTickets();
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !active) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("swivv_support_messages").insert({
      ticket_id: active.id,
      author_id: user?.id,
      is_staff: true,
      body: reply.trim(),
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    // ponytail: in-app copy for the user (e-mail dispatch when a provider is wired)
    await supabase.from("swivv_notifications").insert({
      user_id: active.user_id,
      type: "support",
      title: "Réponse du support",
      message: reply.trim().slice(0, 200),
      link: "/parametres",
    });
    setReply("");
    audit("admin.ticket.reply", "ticket", active.id);
    open({ ...active });
  }

  return (
    <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-4">
      <div>
        <h1 className="text-2xl font-medium text-[#333]">Support</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre statut" className="mt-4 rounded-md border border-border bg-white px-3 py-2 text-sm">
          {["all", ...STATUSES].map((s) => <option key={s} value={s}>{s === "all" ? "Tous" : s}</option>)}
        </select>
        {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
        <div className="mt-2 space-y-2">
          {tickets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => open(t)}
              className={`block w-full rounded-xl bg-white p-3 text-left shadow-sm ${active?.id === t.id ? "ring-2 ring-[#e91e63]" : ""}`}
            >
              <span className="block truncate text-sm font-medium text-[#333]">{t.subject}</span>
              <span className="mt-0.5 block text-xs text-[#999]">{t.category} · {t.status} · {t.priority}</span>
            </button>
          ))}
          {tickets.length === 0 && <p className="text-sm text-[#777]">Aucun ticket.</p>}
        </div>
      </div>
      <div className="mt-6 lg:mt-0">
        {!active ? (
          <p className="text-sm text-[#777]">Sélectionne un ticket.</p>
        ) : (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium text-[#333]">{active.subject}</h2>
              <select value={active.status} onChange={(e) => update(active.id, { status: e.target.value }, "admin.ticket.status")} aria-label="Statut" className="ml-auto rounded border border-border px-2 py-1 text-xs">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="mt-3 max-h-96 space-y-2 overflow-y-auto" aria-live="polite">
              {thread.map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.is_staff ? "ml-auto bg-[#e91e63] text-white" : "bg-[#f2f2f2] text-[#333]"}`}>
                  {m.body}
                </div>
              ))}
              {thread.length === 0 && <p className="text-sm text-[#999]">Aucun message.</p>}
            </div>
            <form onSubmit={send} className="mt-3 flex gap-2">
              <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Répondre…" maxLength={2000} aria-label="Réponse" className="flex-1 rounded-md border border-border px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white">Envoyer</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
