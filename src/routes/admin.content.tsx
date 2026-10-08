import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";

export const Route = createFileRoute("/admin/content")({
  component: AdminContent,
} as any);

// ponytail: newest-first scan over 40 profiles — server-side queue when this outgrows memory
function AdminContent() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("swivv_profiles")
      .select("user_id,data,updated_at")
      .order("updated_at", { ascending: false })
      .limit(40);
    if (error) setMsg(error.message);
    else setRows(data ?? []);
  }

  useEffect(() => {
    load();
    audit("admin.content.view");
  }, []);

  async function note(userId: string, body: string) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("swivv_internal_notes").insert({
      target_kind: "user",
      target_id: userId,
      author_id: user?.id,
      body,
    });
  }

  // ponytail: approval stamp lives in data._mod (no new table/column) — move to a review queue table when moderation needs states beyond approved/removed
  async function approve(userId: string) {
    const row = rows.find((r) => r.user_id === userId);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("swivv_profiles")
      .update({ data: { ...row?.data, _mod: { approved_at: new Date().toISOString(), by: user?.id } } })
      .eq("user_id", userId);
    if (error) {
      setMsg(error.message);
      return;
    }
    await note(userId, "Contenu approuvé (photos + bio).");
    audit("admin.content.approve", "user", userId);
    setMsg("Approuvé.");
    load();
  }

  async function removePhoto(userId: string, url: string) {
    const row = rows.find((r) => r.user_id === userId);
    const photos = ((row?.data?.photos ?? []) as string[]).filter((p) => p !== url);
    const { error } = await supabase
      .from("swivv_profiles")
      .update({ data: { ...row?.data, photos } })
      .eq("user_id", userId);
    if (error) {
      setMsg(error.message);
      return;
    }
    await note(userId, "Photo retirée par la modération.");
    audit("admin.content.photo_remove", "user", userId);
    setMsg("Photo retirée.");
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Contenu — photos & bios</h1>
      <p className="mt-1 text-sm text-[#777]">Les profils les plus récents d'abord. Retirer une photo l'efface du profil.</p>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <article key={r.user_id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <strong className="text-[#333]">{r.data?.name ?? "Sans nom"}{r.data?.age ? `, ${r.data.age}` : ""}</strong>
              {r.data?._mod?.approved_at && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Approuvé</span>}
              <span className="text-xs text-[#999]">{[r.data?.city, r.data?.country].filter(Boolean).join(" · ")}</span>
              <Link to="/admin/users/$userId" params={{ userId: r.user_id }} className="ml-auto text-xs text-[#e91e63] underline">Fiche complète</Link>
            </div>
            {r.data?.bio && <p className="mt-1 text-sm text-[#555]">« {r.data.bio} »</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {((r.data?.photos ?? []) as string[]).map((p: string) => (
                <span key={p} className="relative inline-block">
                  <img src={p} alt="" className="h-20 w-20 rounded-lg object-cover" loading="lazy" />
                  <button
                    type="button"
                    onClick={() => removePhoto(r.user_id, p)}
                    aria-label="Retirer cette photo"
                    title="Retirer cette photo"
                    className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              {((r.data?.photos ?? []) as string[]).length === 0 && <span className="text-xs text-[#999]">Aucune photo.</span>}
            </div>
            <div className="mt-2">
              <button type="button" onClick={() => approve(r.user_id)} className="rounded border border-border px-3 py-1 text-xs">Approuver</button>
            </div>
          </article>
        ))}
        {rows.length === 0 && <p className="text-sm text-[#777]">Aucun profil.</p>}
      </div>
    </div>
  );
}
