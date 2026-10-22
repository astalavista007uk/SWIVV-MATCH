import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mail, MapPin, MessageCircle, Phone, ShieldAlert, CircleHelp } from "lucide-react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { MODERATION_EMAIL } from "@/lib/swivv-email-templates";
import { supabase } from "@/integrations/supabase/client";
import { submitContactTicket } from "@/lib/contact.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contact-us")({
  validateSearch: (search: Record<string, unknown>): { subject?: string } => ({
    subject: typeof search.subject === "string" ? search.subject : undefined,
  }),
  head: () =>
    pageHead(
      "Contacter SWIVV MATCH",
      "Contacte l'équipe SWIVV MATCH : question sur ton compte, signalement d'abus, problème technique ou demande de suppression de données.",
      "/contact-us",
    ),
  component: ContactPage,
});

const SUBJECTS = [
  "Question sur mon compte",
  "Signaler un abus ou un faux profil",
  "Problème de match ou de message",
  "Signaler un problème technique",
  "Suggère une fonctionnalité",
  "Supprimer mes données",
  "Partenariat / Presse",
  "Autre",
];

const ABUSE_SUBJECT = "Signaler un abus ou un faux profil";

// ponytail: keyword responder over a local KB, no LLM backend — plug a real assistant API
// behind answer() if volume ever justifies it
type KbEntry = { keys: string[]; text: string; to?: string; link?: string };

const KB: KbEntry[] = [
  { keys: ["match", "compatible", "pourcentage", "%"], text: "Le % sur chaque profil vient de tes critères Mes Matches : plus tu remplis de critères correspondants, plus il grimpe. Change tes critères puis « Sauvegarder et rechercher » pour voir les chiffres se mettre à jour partout.", to: "/matches", link: "Ouvrir Mes Matches" },
  { keys: ["like", "liker", "coeur"], text: "Touche le cœur sur un profil ou glisse sa photo vers la droite dans SWIVV Swipe. Tu peux déjà lui écrire ; s'il te like en retour, c'est un match et les vocaux et photos se débloquent.", to: "/swipe", link: "Ouvrir SWIVV Swipe" },
  { keys: ["recu", "reçu"], text: "L'icône cœur pleine en haut affiche tes Likes reçus : les profils qui t'ont liké. C'est aussi là que naissent tes futurs matches.", to: "/browse" },
  { keys: ["message", "discuter", "discussion", "conversation"], text: "Va dans Messages (l'enveloppe en haut), choisis une conversation et écris. Tes messages se synchronisent entre ton téléphone et ton ordinateur.", to: "/messagerie", link: "Ouvrir Messages" },
  { keys: ["appel", "appeler", "telephone", "téléphone", "video", "vidéo", "camera", "caméra"], text: "Les appels vidéo sont réservés aux matches mutuels : sur son profil, clique « Demander un appel », confirme, et l'appel démarre dès qu'il accepte. Autorise micro et caméra dans ton navigateur (version https sur téléphone).", to: "/comment-ca-marche", link: "Comment ça marche" },
  { keys: ["vocal", "voix", "audio", "micro"], text: "Avec un match mutuel, touche le micro dans la conversation pour enregistrer un vocal, ■ pour envoyer, ✕ pour annuler. Écoutable des deux côtés, sur téléphone comme ordinateur." },
  { keys: ["photo", "image", "avatar"], text: "Ajoute jusqu'à 5 photos (2,5 Mo max) : directement sur Mon Profil en cliquant + sous ta photo principale, ou à l'étape 6 de l'inscription. La première photo devient ta photo principale.", to: "/mon-profil", link: "Mon profil" },
  { keys: ["inscription", "inscrire", "compte", "creer", "créer"], text: "Crée ton compte depuis « Créer mon profil » en 2 minutes (18 ans minimum, CGU à lire jusqu'en bas et 2 cases à cocher), puis complète ton profil à ton rythme.", to: "/inscription", link: "Créer mon profil" },
  { keys: ["18", "age", "âge", "majeur"], text: "SWIVV est réservé aux 18 ans et plus : tu le certifies en cochant la première case à l'inscription." },
  { keys: ["cgu", "cgv", "condition", "cookie", "confidentialite", "confidentialité"], text: "Tout est en bas de page : CGU détaillées, CGV, cookies, confidentialité. Tu dois les accepter (case à cocher) pour t'inscrire." },
  { keys: ["distance", "km", "loin", "ville"], text: "Les distances sont de vraies distances route depuis ta ville (Paris → Nice ≈ 930 km). Vérifie que ta ville est bien renseignée dans ton profil si un chiffre te surprend." },
  { keys: ["recherche", "filtre", "critere", "critère"], text: "Affine par âge, ville, taille, style de vie et bien plus dans Mes Matches, puis « Sauvegarder et rechercher ». Tes critères sont conservés pour la prochaine visite.", to: "/matches", link: "Mes Matches" },
  { keys: ["langue", "parle"], text: "Indique ta langue maternelle et tes autres langues à l'inscription (47 langues proposées) et filtre dessus dans Mes Matches." },
  { keys: ["supprimer", "effacer", "desinscrire", "désinscrire", "fermer"], text: "Tu peux supprimer ton compte depuis Paramètres : profil, photos et données sont effacés. Cette action est définitive.", to: "/parametres", link: "Paramètres" },
  { keys: ["bloquer", "bloque", "signaler", "abus", "faux", "arnaque", "harcelement", "harcèlement"], text: "Sur la page du profil : Bloquer (il disparaît et ne peut plus te contacter) ou Signaler (notre modération examine). En cas de danger immédiat, contacte aussi les autorités.", },
  { keys: ["securite", "sécurité", "conseil", "rencontre", "rendez-vous"], text: "Premier rendez-vous : lieu public, préviens un proche, garde tes moyens de transport. Le détail est dans « Comment ça marche », section 7.", to: "/comment-ca-marche", link: "Conseils sécurité" },
  { keys: ["notification", "notif", "alerte"], text: "Gère likes, messages et nouveautés depuis Paramètres. Si tu ne reçois rien sur téléphone, vérifie aussi les autorisations du navigateur." },
  { keys: ["prix", "tarif", "gratuit", "payant", "abonnement", "premium"], text: "Tout est gratuit sur SWIVV : inscription, profils, likes, matchs et messages, sans carte bancaire. Les CGV le confirment." },
  { keys: ["parrainage", "inviter", "ami", "parrain"], text: "Invite tes amis célibataires depuis la page d'accueil : plus de profils de qualité, plus de belles rencontres." },
  { keys: ["bug", "marche pas", "erreur", "probleme", "problème", "charge"], text: "Essaie d'abord : recharger la page (Ctrl+Maj+R), te reconnecter, ou un autre navigateur. Si ça persiste, décris-le dans le formulaire ci-dessous avec ton téléphone et ton navigateur." },
  { keys: ["mot de passe", "connexion", "connecter", "oublie", "oublié"], text: "Utilise « Mot de passe oublié » sur l'écran de connexion pour recevoir un lien de réinitialisation. Vérifie tes spams." },
  { keys: ["temoignage", "témoignage", "histoire"], text: "Raconte ta belle histoire sur la page Témoignage : elle pourra inspirer la communauté.", to: "/temoignage", link: "Partager mon témoignage" },
  { keys: ["swipe", "glisser"], text: "Dans SWIVV Swipe, glisse la photo vers la droite pour liker, vers la gauche pour passer. La carte suit ton doigt et la suivante apparaît dessous.", to: "/swipe", link: "SWIVV Swipe" },
  { keys: ["humain", "conseiller", "equipe", "équipe", "support", "email", "e-mail"], text: "Je transmets aux humains ! Utilise le formulaire ci-dessous, l'équipe SWIVV répond en général sous 1 à 2 jours ouvrés." },
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, " ");
}

function answer(q: string): KbEntry {
  const n = ` ${normalize(q)} `;
  let best: KbEntry | null = null;
  let bestHits = 0;
  for (const e of KB) {
    const hits = e.keys.filter((k) => n.includes(normalize(k))).length;
    if (hits > bestHits) {
      best = e;
      bestHits = hits;
    }
  }
  return best ?? { keys: [], text: "Hmm, je n'ai pas bien compris. Reformule ou choisis un sujet, sinon l'équipe support te répondra via le formulaire ci-dessous." };
}

type ChatMsg = { from: "bot" | "me"; text: string; to?: string; link?: string };

function SupportChat() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { from: "bot", text: "Salut ! Je suis l'assistant SWIVV. Pose-moi une question sur les matches, les messages, les appels, ton profil… ou écris « humain » pour contacter le support." },
  ]);
  const [draft, setDraft] = useState("");
  // ponytail: container-level scroll only — scrollIntoView would yank the whole page
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const a = answer(text);
    setMsgs((m) => [...m, { from: "me", text }, { from: "bot", text: a.text, to: a.to, link: a.link }]);
    setDraft("");
  }

  function mailSupport() {
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-white p-4 shadow-sm" role="region" aria-label="Discussion avec l'assistant SWIVV">
      <div ref={boxRef} className="max-h-80 space-y-2 overflow-y-auto" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.from === "me" ? "ml-auto bg-[#e91e63] text-white" : "bg-[#f2f2f2] text-[#333]"}`}>
            <p>{m.text}</p>
            {m.to && (
              <Link to={m.to as never} className={`mt-1 inline-block text-xs font-medium underline ${m.from === "me" ? "" : "text-[#e91e63]"}`}>
                {m.link ?? "Ouvrir"}
              </Link>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écris ta question…"
          aria-label="Écris ta question à l'assistant"
          maxLength={300}
          className="flex-1 rounded-lg border border-border bg-[#f7f7f7] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
        />
        <button type="submit" disabled={!draft.trim()} className="rounded-lg bg-[#e91e63] px-5 py-2 font-medium text-white disabled:opacity-40">
          Envoyer
        </button>
      </form>
      <button type="button" onClick={mailSupport} className="mt-2 w-full rounded-md border border-[#e91e63] px-4 py-2 text-sm font-medium text-[#e91e63]">
        Écrire un e-mail à l'équipe support
      </button>
    </div>
  );
}

function ContactPage() {
  const search = Route.useSearch();
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);

  // Sync the subject every time the URL changes (footer links), because the
  // page does not remount when navigating from /contact-us to /contact-us.
  // "Signaler un abus" arrives with ?subject=... preselected; "Nous contacter"
  // arrives bare and resets to the first subject ("Question sur mon compte").
  useEffect(() => {
    if (
      typeof search.subject === "string" &&
      (SUBJECTS as readonly string[]).includes(search.subject)
    ) {
      setSubject(search.subject);
    } else {
      setSubject(SUBJECTS[0]);
    }
  }, [search.subject]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim() || sending) return;
    // ponytail: ticket lands in the admin inbox for everyone (logged-out included) via one server call — no mailto hop, nothing dies in a missing mail client
    setSending(true);
    setFailed(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const r = await submitContactTicket({
        data: {
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
          fileNames: files.map((f) => f.name),
          userId: user?.id ?? null,
        },
      });
      if (r?.ok) setSent(true);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      {/* ponytail: plain hero, tint lives on the cards — full-bleed color if brand ever wants it */}
      <main className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e91e63]">
          Contact
        </p>
        <h1 className="mt-1 text-3xl font-medium text-[#333]">Parlons-nous</h1>
        <p className="mt-2 text-[#777]">
          Une question, un abus à signaler, un témoignage à partager ? Réponse en général sous 1 à 2 jours ouvrés.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { icon: <CircleHelp className="h-5 w-5 text-[#e91e63]" />, t: "Question simple ?", d: <>La réponse est sûrement dans la <Link to="/faq" className="font-medium text-white underline">FAQ</Link>.</> },
            { icon: <ShieldAlert className="h-5 w-5 text-[#e91e63]" />, t: "Urgence sécurité ?", d: "Choisis « Signaler un abus » ci-dessous." },
            { icon: <Mail className="h-5 w-5 text-[#e91e63]" />, t: "Par e-mail", d: <a className="font-medium text-white underline" href={`mailto:${MODERATION_EMAIL}`}>{MODERATION_EMAIL}</a> },
            { icon: <MapPin className="h-5 w-5 text-[#e91e63]" />, t: "Notre adresse", d: "SWIVV, 10 Rue Thureau Dangin, 75015 Paris, FRANCE" },
            { icon: <Phone className="h-5 w-5 text-[#e91e63]" />, t: "Par téléphone", d: "(+33) 6 60 36 82 20" },
            { icon: <MessageCircle className="h-5 w-5 text-[#e91e63]" />, t: "Live Chat", d: <>Une réponse immédiate ? <button type="button" onClick={() => setChatOpen((o) => !o)} className="font-medium text-white hover:underline">{chatOpen ? "Fermer" : "Discuter"}</button>.</> },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl bg-neutral-800 p-4 shadow-sm transition-transform hover:-translate-y-0.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm [&>*]:text-black">
                {c.icon}
              </span>
              <p className="mt-2 font-medium text-white">{c.t}</p>
              <p className="text-sm text-white/70">{c.d}</p>
            </div>
          ))}
        </div>

        {chatOpen && <SupportChat />}

        {sent ? (
          <div className="mt-6 rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
            {/* ponytail: hand-drawn SVG version of the attached thank-you art (envelope + green check) — swap for the hosted image if brand ever wants it pixel-exact */}
            <svg width="150" height="120" viewBox="0 0 150 120" className="mx-auto" role="img" aria-label="Message reçu">
              <rect x="15" y="38" width="120" height="72" rx="6" fill="#e6eaf2" />
              <path d="M15 44 L75 86 L135 44" fill="none" stroke="#d3d9e6" strokeWidth="4" strokeLinejoin="round" />
              <path d="M15 104 L62 66 M135 104 L88 66" stroke="#dfe4ee" strokeWidth="4" />
              <rect x="43" y="6" width="64" height="62" rx="10" fill="#22c55e" />
              <path d="M63 36 L73 46 L89 28" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-6 text-4xl font-bold text-[#111]">Merci !</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#777]">
              Ton message a bien été reçu, merci {name.trim()} ! L&apos;équipe SWIVV MATCH te répondra à {email.trim()} dans les plus brefs délais.
            </p>
            <p className="mt-8 text-sm text-[#777]">Cordialement,</p>
            <p className="mt-1 text-sm text-[#777]">L&apos;équipe SWIVV MATCH</p>
            {/* ponytail: local reset only (clears the form for a new subject) — router reload if a clean URL state ever matters */}
            <button
              type="button"
              onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); setFiles([]); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="mt-8 w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white hover:bg-[#c2185b]"
            >
              Contacte-nous pour un autre sujet
            </button>
          </div>
        ) : (
          <form id="contact-form" onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div>
              <label
                htmlFor="subject"
                className={`mb-1.5 block text-sm font-medium ${
                  subject === ABUSE_SUBJECT ? "text-red-600" : "text-[#333]"
                }`}
              >
                Sujet
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full rounded-md border px-3 py-2.5 focus:outline-none focus:ring-2 ${
                  subject === ABUSE_SUBJECT
                    ? "border-red-500 bg-red-50 font-medium text-red-700 focus:ring-red-400"
                    : "border-border focus:ring-[#e91e63]"
                }`}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[#333]">
                  Ton prénom
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane"
                  className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#333]">
                  Ton e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-[#333]">
                Ton message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Décris ta demande le plus précisément possible…"
                className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
              />
            </div>
            {/* ponytail: files stay client-side (names ride in the ticket, staff reclaims them by e-mail) — real upload to storage when attachments need to travel with the ticket */}
            <div>
              <label htmlFor="docs" className="mb-1.5 block text-sm font-medium text-[#333]">
                Documents (3 maximum)
              </label>
              <input
                id="docs"
                type="file"
                multiple
                onChange={(e) => {
                  // ponytail: append (each picker opens a new folder, replacing would drop the rest) — dedupe on name+size, cap at 3
                  const picked = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  if (!picked.length) return;
                  setFiles((prev) => [...prev, ...picked.filter((p) => !prev.some((x) => x.name === p.name && x.size === p.size))].slice(0, 3));
                }}
                className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-[#555] file:mr-3 file:rounded-md file:border-0 file:bg-[#e91e63]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#e91e63]"
              />
              {!!files.length && (
                <ul className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-sm text-[#555]">
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        aria-label={`Retirer ${f.name}`}
                        onClick={() => setFiles(files.filter((_, j) => j !== i))}
                        className="font-medium text-[#e91e63] hover:underline"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              disabled={!name.trim() || !email.trim() || !message.trim() || sending}
              className="w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white disabled:opacity-40"
            >
              {sending ? "Envoi…" : "Envoyer"}
            </button>
            {failed && (
              <p role="alert" className="text-center text-sm font-medium text-red-600">
                Envoi impossible pour le moment — vérifie ta connexion et réessaie.
              </p>
            )}
            <p className="text-center text-xs text-[#999]">
              En cas d'urgence (menace, chantage), contacte aussi les autorités locales.
            </p>
          </form>
        )}
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
