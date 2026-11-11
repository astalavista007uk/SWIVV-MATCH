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
import { useLang, useT } from "@/lib/i18n";
import { answerSupport, SUPPORT_STARTERS } from "@/lib/support-kb";
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
  "Question sur la vérification d'identité",
  "Signaler un abus ou un faux profil",
  "Problème de match ou de message",
  "Signaler un problème technique",
  "Suggère une fonctionnalité",
  "Supprimer mes données",
  "Partenariat / Presse",
  "Autre",
];

const ABUSE_SUBJECT = "Signaler un abus ou un faux profil";

type ChatMsg = { from: "bot" | "me"; text: string; to?: string; link?: string };

function SupportChat() {
  const t = useT();
  const lang = useLang();
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { from: "bot", text: SUPPORT_STARTERS[lang] },
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
    const a = answerSupport(text, lang);
    setMsgs((m) => [...m, { from: "me", text }, { from: "bot", text: a.text, to: a.to, link: a.link }]);
    setDraft("");
  }

  function mailSupport() {
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-white p-4 shadow-sm" role="region" aria-label={t("Discussion avec l'assistant SWIVV")}>
      <div ref={boxRef} className="max-h-80 space-y-2 overflow-y-auto" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.from === "me" ? "ml-auto bg-[#e60050] text-white" : "bg-[#f2f2f2] text-[#333]"}`}>
            <p>{m.text}</p>
            {m.to && (
              <Link to={m.to as never} className={`mt-1 inline-block text-xs font-medium underline ${m.from === "me" ? "" : "text-[#e60050]"}`}>
                {m.link ?? t("Ouvrir")}
              </Link>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("Écris ta question…")}
          aria-label={t("Écris ta question à l'assistant")}
          maxLength={300}
          className="flex-1 rounded-lg border border-border bg-[#f7f7f7] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e60050]"
        />
        <button type="submit" disabled={!draft.trim()} className="rounded-lg bg-[#e60050] px-5 py-2 font-medium text-white disabled:opacity-40">
          {t("Envoyer")}
        </button>
      </form>
      <button type="button" onClick={mailSupport} className="mt-2 w-full rounded-md border border-[#e60050] px-4 py-2 text-sm font-medium text-[#e60050]">
        {t("Écrire un e-mail à l'équipe support")}
      </button>
    </div>
  );
}

function ContactPage() {
  const t = useT();
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
      <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      {/* ponytail: plain hero, tint lives on the cards — full-bleed color if brand ever wants it */}
      <main className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e60050]">
          {t("Contact")}
        </p>
        <h1 className="mt-1 text-3xl font-medium text-[#333]">{t("Parlons-nous")}</h1>
        <p className="mt-2 text-[#5c5c66]">
          {t("Une question, un abus à signaler, un témoignage à partager ? Réponse en général sous 1 à 2 jours ouvrés.")}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { icon: <CircleHelp className="h-5 w-5 text-[#e60050]" />, t: "Question simple ?", d: <>{t("La réponse est sûrement dans la")}{" "}<Link to="/faq" className="font-medium text-white underline">{t("FAQ")}</Link>.</> },
            { icon: <ShieldAlert className="h-5 w-5 text-[#e60050]" />, t: "Urgence sécurité ?", d: "Choisis « Signaler un abus » ci-dessous." },
            { icon: <Mail className="h-5 w-5 text-[#e60050]" />, t: "Par e-mail", d: <a className="font-medium text-white underline" href={`mailto:${MODERATION_EMAIL}`}>{MODERATION_EMAIL}</a> },
            { icon: <MapPin className="h-5 w-5 text-[#e60050]" />, t: "Notre adresse", d: "SWIVV, 10 Rue Thureau Dangin, 75015 Paris, FRANCE" },
            { icon: <Phone className="h-5 w-5 text-[#e60050]" />, t: "Par téléphone", d: "(+33) 6 60 36 82 20" },
            { icon: <MessageCircle className="h-5 w-5 text-[#e60050]" />, t: "Live Chat", d: <>{t("Une réponse immédiate ?")}{" "}<button type="button" onClick={() => setChatOpen((o) => !o)} className="font-medium text-white hover:underline">{chatOpen ? t("Fermer") : t("Discuter")}</button>.</> },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl bg-neutral-800 p-4 shadow-sm transition-transform hover:-translate-y-0.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm [&>*]:text-black">
                {c.icon}
              </span>
              <p className="mt-2 font-medium text-white">{t(c.t)}</p>
              <p className="text-sm text-white/70">{typeof c.d === "string" ? t(c.d) : c.d}</p>
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
            <p className="mt-6 text-4xl font-bold text-[#111]">{t("Merci !")}</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#5c5c66]">
              {t("Ton message a bien été reçu, merci {name} ! L'équipe SWIVV MATCH te répondra à {email} dans les plus brefs délais.", { name: name.trim(), email: email.trim() })}
            </p>
            <p className="mt-8 text-sm text-[#5c5c66]">{t("Cordialement,")}</p>
            <p className="mt-1 text-sm text-[#5c5c66]">{t("L'équipe SWIVV MATCH")}</p>
            {/* ponytail: local reset only (clears the form for a new subject) — router reload if a clean URL state ever matters */}
            <button
              type="button"
              onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="mt-8 w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white hover:bg-[#c2185b]"
            >
              {t("Contacte-nous pour un autre sujet")}
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
                {t("Sujet")}
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full rounded-md border px-3 py-2.5 focus:outline-none focus:ring-2 ${
                  subject === ABUSE_SUBJECT
                    ? "border-red-500 bg-red-50 font-medium text-red-700 focus:ring-red-400"
                    : "border-border focus:ring-[#e60050]"
                }`}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[#333]">
                  {t("Ton prénom")}
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane"
                  className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#6b6b73] focus:outline-none focus:ring-2 focus:ring-[#e60050]"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#333]">
                  {t("Ton e-mail")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#6b6b73] focus:outline-none focus:ring-2 focus:ring-[#e60050]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-[#333]">
                {t("Ton message")}
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder={t("Décris ta demande le plus précisément possible…")}
                className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#6b6b73] focus:outline-none focus:ring-2 focus:ring-[#e60050]"
              />
            </div>
            <div className="rounded-md border border-border bg-[#f7f7f7] p-3 text-sm text-[#555]">
              {t("Pour joindre des documents, envoie-les par e-mail à contact@swivvmatch.com.")}
            </div>
            <button
              type="submit"
              disabled={!name.trim() || !email.trim() || !message.trim() || sending}
              className="w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white disabled:opacity-40"
            >
              {sending ? t("Envoi…") : t("Envoyer")}
            </button>
            {failed && (
              <p role="alert" className="text-center text-sm font-medium text-red-600">
                {t("Envoi impossible pour le moment — vérifie ta connexion et réessaie.")}
              </p>
            )}
            <p className="text-center text-xs text-[#6b6b73]">
              {t("En cas d'urgence (menace, chantage), contacte aussi les autorités locales.")}
            </p>
          </form>
        )}
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
