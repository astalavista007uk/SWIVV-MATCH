import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";
import { BLOG_POSTS } from "@/lib/blog-data";

export const Route = createFileRoute("/admin/content")({
  component: AdminContent,
} as any);

const TABS = ["Photos", "Bios", "Blog", "Pages", "Restreint"] as const;

// ponytail: no Storage bucket holds dating photos (data URLs / remote URLs inside swivv_profiles.data; buckets are legacy marketplace + public swivv-voice) — photo review reads the profile rows, never a bucket
// ponytail: no CMS backend — blog + legal pages are code. The Blog/Pages tabs inventory real code content; drafts/scheduling/revisions don't exist and aren't faked.
// ponytail: never edit a member's words here (no silent edits) — approve/reject/remove-photo only; originals stay intact for appeals
function AdminContent() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Photos");
  const [rows, setRows] = useState<any[]>([]);
  const [reports, setReports] = useState<Record<string, any[]>>({});
  const [decisions, setDecisions] = useState<any[]>([]);
  const [sanctions, setSanctions] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const q = supabase as any;
    const [p, rp, dec, st] = await Promise.all([
      supabase.from("swivv_profiles").select("user_id,data,updated_at").order("updated_at", { ascending: false }).limit(100),
      supabase.from("swivv_reports").select("reported_user_id,category,status,created_at").order("created_at", { ascending: false }).limit(500),
      q.from("swivv_mod_decisions").select("*").order("created_at", { ascending: false }).limit(100).then((r: any) => (r.error ? [] : (r.data ?? []))),
      q.from("swivv_user_status").select("user_id,status,until").in("status", ["suspended", "banned"]).then((r: any) => (r.error ? [] : (r.data ?? []))),
    ]);
    if (p.error) {
      setMsg(p.error.message);
      return;
    }
    setRows((p.data ?? []) as any[]);
    const by: Record<string, any[]> = {};
    for (const r of ((rp.data ?? []) as any[])) if (r.reported_user_id) (by[r.reported_user_id] ??= []).push(r);
    setReports(by);
    setDecisions(dec);
    setSanctions(st);
    const map: Record<string, string> = {};
    for (const r of ((p.data ?? []) as any[])) map[r.user_id] = (r.data as any)?.name ?? r.user_id.slice(0, 8);
    setNames(map);
  }

  useEffect(() => {
    load();
    audit("admin.content.view");
  }, []);

  const nm = (id: string) => names[id] ?? `${id.slice(0, 8)}…`;
  const fmt = (v: any) => (v ? new Date(v).toLocaleDateString("fr-FR") : "—");

  async function note(userId: string, body: string) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("swivv_internal_notes").insert({ target_kind: "user", target_id: userId, author_id: user?.id, body });
  }

  // ponytail: approval stamp is moderation metadata (data._mod), never touches the member's words — move to a review table if states beyond approved/removed are needed
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

  async function rejectBio(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("swivv_mod_decisions").insert({
      target_kind: "text", target_ref: `${userId}:bio`, decision: "reject",
      reason: "Bio à corriger — voir fiche membre (texte d'origine conservé, jamais modifié ici).", reviewer: user?.id,
    });
    if (error) {
      setMsg(error.message.includes("does not exist") || error.message.includes("schema cache") ? "Table des décisions absente — applique la migration 20261013000000_swivv_moderation.sql." : error.message);
      return;
    }
    await note(userId, "Bio rejetée : correction demandée via la fiche membre (original conservé).");
    audit("admin.content.bio_reject", "user", userId);
    setMsg("Bio rejetée (original conservé) + tracé.");
    load();
  }

  async function removePhoto(userId: string, url: string) {
    if (!window.confirm("Retirer cette photo de l'affichage ? (l'asset n'est pas détruit, appel possible)")) return;
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
    await note(userId, "Photo retirée par la modération (asset conservé pour appel).");
    audit("admin.content.photo_remove", "user", userId);
    setMsg("Photo retirée (asset conservé).");
    load();
  }

  const withPhotos = useMemo(() => rows.filter((r) => ((r.data?.photos ?? []) as string[]).length > 0), [rows]);
  const withBio = useMemo(() => rows.filter((r) => ((r.data?.bio ?? "") as string).trim() || ((r.data?.tagline ?? "") as string).trim()), [rows]);
  const repBadge = (userId: string) => {
    const list = reports[userId] ?? [];
    if (!list.length) return null;
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">{list.length} signalement(s)</span>;
  };

  const PAGES = [
    ["/cgv", "CGV"], ["/terms-and-conditions", "Conditions d'utilisation"], ["/legal/privacy", "Confidentialité (mentions)"],
    ["/privacy-centre", "Centre de confidentialité"], ["/cookies", "Cookies"], ["/help", "Aide"],
    ["/faq", "FAQ"], ["/contact-us", "Contact / signaler un abus"], ["/comment-ca-marche", "Comment ça marche"], ["/guide-photos", "Guide photos"],
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Contenu</h1>
      <p className="mt-1 text-xs text-[#6b6b73]">Photos/bios des 100 profils les plus récents · blog et pages statiques gérés en code (pas de CMS) · originaux toujours conservés pour appel.</p>
      <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Contenus">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-[#14112b] text-white" : "bg-white text-[#555]"}`}>{t}</button>
        ))}
      </nav>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}

      {tab === "Photos" && (
        <div className="mt-4 space-y-3">
          {withPhotos.map((r) => (
            <article key={r.user_id} className="rounded-xl bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <strong className="text-[#333]">{r.data?.name ?? "Sans nom"}{r.data?.age ? `, ${r.data.age}` : ""}</strong>
                {r.data?._mod?.approved_at && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Approuvé</span>}
                {repBadge(r.user_id)}
                <span className="text-xs text-[#6b6b73]">soumis le {fmt(r.updated_at)}</span>
                <Link to="/admin/users/$userId" params={{ userId: r.user_id }} className="ml-auto text-xs text-[#e60050] underline">Fiche complète</Link>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {((r.data?.photos ?? []) as string[]).map((p: string) => (
                  <span key={p} className="relative inline-block">
                    <img src={p} alt="" className="h-20 w-20 rounded-lg object-cover" loading="lazy" />
                    <button
                      type="button"
                      onClick={() => removePhoto(r.user_id, p)}
                      aria-label="Retirer cette photo"
                      title="Retirer cette photo (asset conservé)"
                      className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2">
                <button type="button" onClick={() => approve(r.user_id)} className="rounded border border-border px-3 py-1 text-xs">Approuver</button>
              </div>
            </article>
          ))}
          {withPhotos.length === 0 && <p className="text-sm text-[#5c5c66]">Aucune photo.</p>}
        </div>
      )}

      {tab === "Bios" && (
        <div className="mt-4 space-y-3">
          {withBio.map((r) => (
            <article key={r.user_id} className="rounded-xl bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <strong className="text-[#333]">{r.data?.name ?? "Sans nom"}{r.data?.age ? `, ${r.data.age}` : ""}</strong>
                {r.data?._mod?.approved_at && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Approuvé</span>}
                {repBadge(r.user_id)}
                <span className="text-xs text-[#6b6b73]">soumis le {fmt(r.updated_at)}</span>
                <Link to="/admin/users/$userId" params={{ userId: r.user_id }} className="ml-auto text-xs text-[#e60050] underline">Fiche complète</Link>
              </div>
              {r.data?.tagline && <p className="mt-1 text-sm italic text-[#5c5c66]">« {r.data.tagline} »</p>}
              {r.data?.bio && <p className="mt-1 text-sm text-[#555]">{r.data.bio}</p>}
              {(reports[r.user_id] ?? []).length > 0 && (
                <p className="mt-1 text-xs text-[#6b6b73]">Historique : {(reports[r.user_id] ?? []).map((x: any) => `${x.category}/${x.status}`).join(" · ")}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => approve(r.user_id)} className="rounded border border-border px-3 py-1 text-xs">Approuver</button>
                <button type="button" onClick={() => rejectBio(r.user_id)} className="rounded border border-border px-3 py-1 text-xs">Rejeter (original conservé)</button>
              </div>
            </article>
          ))}
          {withBio.length === 0 && <p className="text-sm text-[#5c5c66]">Aucune bio.</p>}
        </div>
      )}

      {tab === "Blog" && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-[#6b6b73]">{BLOG_POSTS.length} articles publiés (code, Équipe SWIVV) — ni brouillons, ni planification, ni historique de révisions supportés.</p>
          {BLOG_POSTS.map((b) => (
            <article key={b.slug} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 text-sm shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#333]">{b.title}</p>
                <p className="text-xs text-[#6b6b73]">{b.category} · {b.author} · publié le {b.date} · {b.readTime} · {b.content.length} paragraphes{b.testimonials ? ` · ${b.testimonials.length} témoignage(s)` : ""}</p>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Publié</span>
              <Link to="/blog/$slug" params={{ slug: b.slug }} className="text-xs text-[#e60050] underline">Aperçu</Link>
            </article>
          ))}
        </div>
      )}

      {tab === "Pages" && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-[#6b6b73]">Pages légales et statiques gérées en code — toute modification passe par le déploiement, avec relecture.</p>
          {PAGES.map(([to, label]) => (
            <div key={to} className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm shadow-sm">
              <p className="flex-1 font-medium text-[#333]">{label}</p>
              <span className="font-mono text-xs text-[#6b6b73]">{to}</span>
              <Link to={to as any} className="text-xs text-[#e60050] underline">Voir</Link>
            </div>
          ))}
        </div>
      )}

      {tab === "Restreint" && (
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-medium text-[#333]">Décisions restrictives ({decisions.filter((x: any) => ["remove", "restrict"].includes(x.decision)).length})</h2>
            {decisions.filter((x: any) => ["remove", "restrict"].includes(x.decision)).map((x: any) => (
              <p key={x.id} className="mt-1 text-xs text-[#555]">{x.target_kind}:{x.target_ref} → <strong>{x.decision}</strong>{x.reason ? ` — ${x.reason}` : ""} · {fmt(x.created_at)}</p>
            ))}
            {decisions.length === 0 && <p className="mt-1 text-xs text-[#6b6b73]">Aucune décision tracée (table absente ou vide — migration 20261013000000).</p>}
          </section>
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-medium text-[#333]">Comptes sanctionnés ({sanctions.length})</h2>
            {sanctions.map((x: any) => (
              <p key={x.user_id} className="mt-1 text-xs text-[#555]">
                <Link to="/admin/users/$userId" params={{ userId: x.user_id }} className="text-[#e60050] underline">{nm(x.user_id)}</Link>
                {" "}· {x.status}{x.until ? ` jusqu'au ${fmt(x.until)}` : ""}
              </p>
            ))}
            {sanctions.length === 0 && <p className="mt-1 text-xs text-[#6b6b73]">Aucun compte suspendu/banni.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
