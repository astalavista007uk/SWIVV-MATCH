import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Download, Trash2, Lock, Check } from "lucide-react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons, getMyRawProfile, requireSwivvAuth, useSwivvUser } from "@/lib/swivv-auth";
import { getBlocked, getLikes, getMatches, getProfileViews } from "@/lib/swivv-store";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { shrinkDataUrl } from "@/routes/inscription";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy-centre")({
  head: () =>
    pageHead(
      "Confidentialité et données personnelles — SWIVV MATCH",
      "Centre de confidentialité SWIVV MATCH : données collectées, droits RGPD, export et suppression de compte, politique détaillée.",
      "/privacy-centre",
    ),
  component: PrivacyCentrePage,
});

// ponytail: full policy text lives on this page (moved from the old /legal/privacy, now a redirect) — one privacy page for visitors + SEO
const POLICY: [string, string][] = [
  ["1. Données collectées", "Compte : prénom, e-mail, âge, ville. Profil public : photos, bio, centres d'intérêt, intention. Usage : likes, matchs, messages, préférences de recherche. Les messages privés ne sont lisibles que par toi et ton match, plus la modération en cas de signalement."],
  ["2. Utilisation", "Tes données servent uniquement à : afficher ton profil aux membres, calculer tes compatibilités, assurer la modération et la sécurité, et te contacter pour le support. Aucune revente, aucun partage à des annonceurs, aucune publicité ciblée avec tes données de rencontres."],
  ["3. Visibilité", "Ton profil public (photos, prénom, âge, ville, bio) est visible par les membres connectés uniquement. Ton e-mail, ta position exacte et tes signalements restent strictement privés. Seule ta ville et une distance approximative en km sont affichées."],
  ["4. Conservation", "Tes données sont conservées tant que ton compte est actif. Après suppression du compte, ton profil public, tes photos et tes conversations sont effacés, sous réserve des durées légales (ex. journaux de modération en cas d'abus)."],
  ["5. Tes droits", "Accès, rectification, export, suppression : écris-nous via la page contact en précisant ta demande et l'e-mail de ton compte. Réponse sous 30 jours. Tu peux aussi supprimer ton compte toi-même en 1 clic depuis ton profil."],
  ["6. Cookies", "SWIVV utilise uniquement des cookies techniques (session, préférences, sécurité). Aucun cookie publicitaire. Détails sur la page cookies."],
  ["7. Sécurité", "Connexions chiffrées, mots de passe jamais stockés en clair, accès internes limités. En cas de faille avérée, les membres concernés sont informés conformément à la réglementation."],
  ["8. Contact", "Pour exercer tes droits ou poser une question : page contact, objet « Supprimer mes données » ou « Question confidentialité »."],
];

function PrivacyCentrePage() {
  const [exported, setExported] = useState(false);
  const user = useSwivvUser();

  // ponytail: local data only (profile + likes/matches/blocks/views stored on this device) — server rows join the export if a backend endpoint ever assembles it
  const exportData = async () => {
    const profile = await getMyRawProfile().catch(() => null);
    const data = {
      exportedAt: new Date().toISOString(),
      profile: profile ?? null,
      likes: getLikes(),
      matches: getMatches(),
      blocked: getBlocked(),
      profileViews: getProfileViews(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mes-donnees-swivv.json";
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  // ponytail: server row + local signup stash/draft (an in-flight flow can hold newer photos than the last push) — deduped so the PDF matches what Mon profil displays
  const collectPhotos = (p: any): string[] => {
    const out: string[] = [...(p?.photo ? [p.photo] : []), ...(Array.isArray(p?.photos) ? p.photos : [])];
    for (const key of ["swivv-pending-profile", "swivv-signup-draft"]) {
      try {
        const s = JSON.parse(localStorage.getItem(key) ?? "null") as any;
        if (s?.photo) out.push(s.photo);
        if (Array.isArray(s?.photos)) out.push(...s.photos);
      } catch {}
    }
    return out.filter((s, i, a) => s && a.indexOf(s) === i);
  };
  // ponytail: browser print-to-PDF instead of a PDF library (zero deps, real photos + logo, user picks Save as PDF) — a server-rendered PDF if exports ever need sending by email
  const exportPdf = async () => {
    const p: any = await getMyRawProfile().catch(() => null);
    // ponytail: absolute logo URL — the print window opens on about:blank so relative paths never resolve there
    const logo = `${window.location.origin}/swivv-match-logo-transparent.png`;
    const esc = (v: unknown) => String(v ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const facts: [string, unknown][] = [
      ["Prénom", p?.name], ["Âge", p?.age], ["Ville", p?.city], ["Pays", p?.country],
      ["Présentation", p?.tagline], ["Bio", p?.bio], ["Recherche", p?.lookingFor ?? p?.seeking],
      ["Statut", p?.maritalStatus], ["Enfants", p?.haveChildren], ["Métier", p?.occupation],
      ["Religion", p?.religion], ["Langues", Array.isArray(p?.languages) ? p.languages.join(", ") : p?.languages],
      ["Centres d'intérêt", Array.isArray(p?.interests) ? p.interests.join(", ") : p?.interests],
    ];
    // ponytail: shrink to 400px before embedding (full-size dataURLs can silently drop from the print document) + fixed-height 3-col grid; failures render a labeled box so a missing photo is visible, not silent
    const photos = await Promise.all(
      collectPhotos(p).map((s) => (s.startsWith("data:image") ? shrinkDataUrl(s, 400, 0.7).catch(() => s) : Promise.resolve(s))),
    );
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Mes données SWIVV</title>
<style>body{font-family:Arial,sans-serif;color:#333;max-width:700px;margin:0 auto;padding:32px}.band{background:#0f1e33;border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:14px}.band img{height:48px;filter:brightness(0) invert(1)}.band h1{font-size:20px;margin:0;color:#fff}.accent{height:3px;background:#e91e63;border-radius:2px;margin:6px 0 4px}h2{font-size:16px;color:#e91e63;margin:24px 0 8px}.meta{color:#777;font-size:12px}table{width:100%;border-collapse:collapse;font-size:14px}td{padding:7px 8px;border-bottom:1px solid #eee;vertical-align:top}td:first-child{color:#777;width:180px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.grid img{width:100%;height:180px;object-fit:cover;border-radius:10px}.missing{display:flex;align-items:center;justify-content:center;height:180px;border:1px dashed #ccc;border-radius:10px;color:#999;font-size:12px}footer{margin-top:28px;border-top:3px solid #e91e63;padding-top:10px;text-align:center}footer img{height:140px}footer p{font-size:11px;color:#666;margin:4px 0}@media print{.pbreak{break-before:page}.tavoid{break-inside:avoid}table td{padding:5px 8px}.endpage{position:fixed;top:0;bottom:0;left:0;right:0;display:flex;flex-direction:column;justify-content:flex-end}}@page{size:A4;margin:10mm 10mm 16mm 10mm}</style></head><body>
<div class="band"><img src="${logo}" alt="SWIVV"><h1>Mes données</h1></div><div class="accent"></div><p class="meta">Exporté le ${new Date().toLocaleDateString("fr-FR")}</p>
<h2>Mon profil</h2><table class="tavoid">${facts.map(([k, v]) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`).join("")}</table>
<h2>Mon activité</h2><table class="tavoid">
<tr><td>Likes envoyés</td><td>${getLikes().length}</td></tr>
<tr><td>Matchs</td><td>${getMatches().length}</td></tr>
<tr><td>Profils bloqués</td><td>${getBlocked().length}</td></tr>
<tr><td>Visites reçues</td><td>${Object.values(getProfileViews()).reduce((a, b) => a + b, 0)}</td></tr></table>
${photos.length ? `<h2 class="pbreak">Mes photos (${photos.length})</h2>${Array.from({ length: Math.ceil(photos.length / 9) }, (_, i) => photos.slice(i * 9, i * 9 + 9)).map((g, i) => `<div class="grid${i ? " pbreak" : ""}">${g.map((s, j) => `<img src="${s}" alt="Photo ${i * 9 + j + 1}" onerror="this.outerHTML='<div class=missing>Photo ${i * 9 + j + 1} illisible</div>'">`).join("")}</div>`).join("")}` : ""}
<!-- ponytail: photo pages hold max 3 rows (9 photos) so flowing rows can never reach the fixed footer zone — a break fires only mid-flow (Chrome drops it at a page top, so no blank pages); activity+profile print first on page 1 for the same reason -->
<!-- ponytail: activity prints before the photos so dense photo pages never share a page with text that could slide under the fixed footer (grid rows are fixed-height and break cleanly); the photos section renders only when photos exist, else everything stays on one page (the generated-from-your-account note lives on the privacy page itself, not worth 40px of collision budget here) -->
<!-- ponytail: fixed footer bottom-pinned to the @page content area on every page (16mm bottom margin ≈ footer height, so dense pages can't slide under it; Chrome anchors fixed boxes to the content area — measured screen→print spacers drift instead) — ceiling: a >600px profile table or a shrunk print dialog can strand an airy page; un-avoid the tables then -->
<div class="endpage"><footer><img src="${logo}" alt="SWIVV MATCH"><p>SWIVV MATCH – 10 Rue Thureau Dangin, 75015 Paris, France – Tél : +33 6 60 36 82 20</p><p>www.swivvmatch.com – contact@swivvmatch.com</p></footer></div>
</body></html>`);
    w.document.close();
    w.focus();
    // ponytail: print only after every photo decodes (the snapshot otherwise catches empty frames) — 8s cap so one stuck image never blocks the dialog
    const imgs = Array.from(w.document.images ?? []);
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((res) => {
            if (img.complete && img.naturalWidth > 0) return res();
            const done = () => res();
            img.onload = done;
            img.onerror = done;
            setTimeout(done, 8000);
          }),
      ),
    );
    w.print();
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-medium text-[#333]">Centre de confidentialité</h1>
        <p className="mt-2 text-[#777]">
          Tes données t'appartiennent. Voici ce que SWIVV collecte, pourquoi, et comment reprendre le contrôle.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: <Eye className="h-5 w-5 text-[#e91e63]" />,
              t: "Ce que voient les membres",
              d: "Tes photos, prénom, âge, ville, bio et centres d'intérêt. Ton e-mail et ta position exacte restent privés.",
            },
            {
              icon: <Lock className="h-5 w-5 text-[#e91e63]" />,
              t: "Ce que SWIVV utilise",
              d: "Tes préférences et tes likes servent uniquement à calculer tes scores de compatibilité. Jamais revendues, jamais partagées à des annonceurs.",
            },
            {
              icon: <Download className="h-5 w-5 text-[#e91e63]" />,
              t: "Exporter mes données",
              d: "Reçois un document clair et illustré de tes données (profil, photos, activité).",
              action: (
                <span className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    // ponytail: logged-out taps open the login popup and auto-generate after sign-in (requireSwivvAuth queues the callback) — no redirect, user stays on this page
                    onClick={() => requireSwivvAuth("account", exportPdf)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white"
                  >
                    {exported ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                    {exported ? "Généré !" : user ? "Télécharger en PDF" : "Connecte-toi pour télécharger tes données"}
                  </button>
                  {user && (
                    <button
                      type="button"
                      onClick={exportData}
                      className="rounded-md border border-border px-4 py-2 text-sm font-medium text-[#555]"
                    >
                      Format JSON
                    </button>
                  )}
                </span>
              ),
            },
            {
              icon: <Trash2 className="h-5 w-5 text-[#e91e63]" />,
              t: "Tout supprimer",
              d: "Supprime ton compte en 1 clic depuis tes Paramètres. Tes photos et messages sont effacés.",
              action: (
                <Link to="/parametres" className="mt-3 inline-block rounded-md border border-border px-4 py-2 text-sm font-medium text-[#555]">
                  Aller aux Paramètres
                </Link>
              ),
            },
          ].map((c) => (
            <div key={c.t} className="rounded-xl bg-white p-5">
              {c.icon}
              <p className="mt-2 font-medium text-[#333]">{c.t}</p>
              <p className="mt-1 text-sm text-[#777]">{c.d}</p>
              {"action" in c && c.action}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 text-sm leading-relaxed text-[#555]">
          <h2 className="font-medium text-[#333]">En résumé</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Pas de publicité ciblée avec tes données de rencontres.</li>
            <li>Pas de géolocalisation précise affichée (ville + distance en km uniquement).</li>
            <li>Messages privés : visibles uniquement par toi et ton match.</li>
          </ul>
        </div>

        <div className="mt-6 space-y-4">
          <h2 className="font-medium text-[#333]">Politique de confidentialité détaillée</h2>
          {POLICY.map(([t, d]) => (
            <article key={t} className="rounded-xl bg-white p-5">
              <h3 className="font-medium text-[#333]">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#555]">{d}</p>
            </article>
          ))}
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
