import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SwivvAuthButtons, getMyProfile, openAuthModal, signOutSwivv, useSwivvUser } from "@/lib/swivv-auth";
import { clearSwivvLocal, getAppLang, isProfileHidden, setAppLang, setProfileHidden } from "@/lib/swivv-store";
import { deleteAccount as deleteAuthUser } from "@/lib/delete-account.functions";
import { SwivvSettingsTabs } from "@/components/swivv-settings-tabs";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — SWIVV" }] }),
  component: SettingsPage,
});

// ponytail: text inputs masked as discs — password managers only hunt type=password, so nothing can ever be prefilled
const maskStyle = { "-webkit-text-security": "disc" } as CSSProperties;

function SettingsPage() {
  const nav = useNavigate();
  const user = useSwivvUser();
  const { loading } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  // ponytail: resync on account switch only (no remount on modal login) — profile name wins over the auth fallback, keystrokes never refetch
  useEffect(() => {
    setName(user?.name ?? "");
    if (!user) return;
    let live = true;
    getMyProfile().then((p) => {
      if (live && p?.name) setName(p.name);
    });
    return () => {
      live = false;
    };
  }, [user?.email]);

  const [newEmail, setNewEmail] = useState("");
  const [oldPw, setOldPw] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  // ponytail: change-fields mount only on demand (like the name field) — no inputs at load means managers have nothing to paint into
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPw, setEditingPw] = useState(false);
  // ponytail: disabled-until-tap — managers skip disabled fields, so nothing can be prefilled before the user touches one
  const [pwUnlocked, setPwUnlocked] = useState(false);
  // ponytail: unique field names per page load — managers match memorized signatures, so unrecognizable fields stay blank
  const fieldUid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(() => isProfileHidden());
  const [lang, setLang] = useState(getAppLang);
  const [editingName, setEditingName] = useState(false);
  const [confirmHide, setConfirmHide] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function saveName(): Promise<boolean> {
    const clean = name.trim();
    if (!clean) {
      setMsg("Entre un prénom.");
      return false;
    }
    // ponytail: autofill drops e-mails into name fields — refuse, don't persist
    if (clean.includes("@")) {
      setMsg("Ton prénom ne peut pas être une adresse e-mail.");
      return false;
    }
    // ponytail: digits-only check — full username policing if moderation ever needs it
    if (/\d/.test(clean)) {
      setMsg("Ton prénom ne peut pas contenir de chiffres.");
      return false;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ data: { name: clean } });
    setBusy(false);
    setMsg(error ? "Sauvegarde impossible. Réessaie." : "Prénom mis à jour.");
    return !error;
  }

  async function saveEmail(): Promise<boolean> {
    if (!/.+@.+\..+/.test(newEmail.trim())) {
      setMsg("Entre une adresse e-mail valide.");
      return false;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
    setBusy(false);
    if (error) {
      setMsg("Changement impossible. Réessaie.");
      return false;
    }
    setNewEmail("");
    setMsg("Vérifie ta nouvelle adresse e-mail pour confirmer le changement.");
    return true;
  }

  async function savePassword(): Promise<boolean> {
    // ponytail: old-password check via re-sign-in (no verify API client-side) — server-side check if this ever needs hardening
    if (pw.length < 8) {
      setMsg("Mot de passe : 8 caractères minimum.");
      return false;
    }
    if (pw !== pw2) {
      setMsg("Les deux mots de passe ne correspondent pas.");
      return false;
    }
    if (!user) {
      setMsg("Connecte-toi pour changer de mot de passe.");
      return false;
    }
    setBusy(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPw });
    if (signErr) {
      setBusy(false);
      setMsg("Ancien mot de passe incorrect.");
      return false;
    }
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setMsg("Changement impossible. Réessaie.");
      return false;
    }
    setOldPw("");
    setPw("");
    setPw2("");
    setMsg("Mot de passe mis à jour.");
    return true;
  }

  async function deleteAccount() {
    setConfirming(true);
  }

  // ponytail: reasons stashed locally only (no feedback table yet) — POST them wherever exit surveys go when that exists
  const DELETE_REASONS = [
    "J'ai trouvé quelqu'un",
    "Pas assez de profils près de moi",
    "Je n'utilise plus l'application",
    "Problème technique",
    "Autre",
  ];

  async function confirmDelete() {
    const reason = deleteReason === "Autre" ? otherReason.trim() || "Autre" : deleteReason;
    if (!reason) return;
    try {
      localStorage.setItem("swivv-delete-reason", JSON.stringify({ reason, at: new Date().toISOString() }));
    } catch {}
    setConfirming(false);
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      // Server fn purges the auth.users row too, so the e-mail can sign up again afterwards
      await deleteAuthUser({ data: { reason } });
      if (uid) await (supabase as any).from("swivv_profiles").delete().eq("user_id", uid);
      clearSwivvLocal();
      await signOutSwivv();
      nav({ to: "/" });
    } catch {
      setDeleteError("La suppression a échoué, réessaie dans un instant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <Link to="/mon-profil" className="text-sm text-[#555]">← Mon profil</Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-medium text-[#333]">Paramètres</h1>
        <SwivvSettingsTabs />

        {loading ? null : !user ? (
          <div className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-[#777]">Connecte-toi pour gérer tes paramètres.</p>
            <button
              type="button"
              onClick={() => openAuthModal("account", "signin")}
              className="mt-4 w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white"
            >
              Se connecter / S&apos;inscrire
            </button>
          </div>
        ) : (
          <>
            <section id="compte" aria-label="Compte" className="mt-6 scroll-mt-4">
              <h2 className="font-medium text-[#333]">Compte</h2>
              <div className="mt-2 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
                <div id="email">
                  <span className="mb-1 block text-sm font-medium text-[#333]">Ton adresse e-mail</span>
                  <p className="text-sm text-[#777]">{user.email}</p>
                  {editingEmail ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="email"
                        name={`nmail-${fieldUid}`}
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="nouvelle@adresse.fr"
                        autoComplete="off"
                        autoFocus
                        className="w-full rounded-md border border-border px-3 py-2.5 text-[15px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (await saveEmail()) {
                              setEditingEmail(false);
                              setNewEmail("");
                            }
                          }}
                          disabled={busy}
                          className="rounded-md bg-[#e91e63] px-4 py-2 font-medium text-white disabled:opacity-60"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmail(false);
                            setNewEmail("");
                          }}
                          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-[#555]"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingEmail(true)}
                      className="mt-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-[#555]"
                    >
                      Changer d&apos;adresse e-mail
                    </button>
                  )}
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium text-[#333]">Ton prénom</span>
                  {/* ponytail: text by default so password managers can't paint a saved e-mail into the field — input only while editing */}
                  {editingName ? (
                    <div className="flex gap-2">
                      <input
                        id="set-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={40}
                        autoComplete="given-name"
                        autoFocus
                        className="w-full rounded-md border border-border px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (await saveName()) setEditingName(false);
                        }}
                        disabled={busy}
                        className="shrink-0 rounded-md bg-[#e91e63] px-4 font-medium text-white disabled:opacity-60"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="w-full rounded-md bg-[#f7f7f7] px-3 py-2.5 text-[15px] text-[#333]">{user.name}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setName(user?.name ?? "");
                          setEditingName(true);
                        }}
                        className="shrink-0 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-[#555]"
                      >
                        Modifier
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor={`npw-${fieldUid}`} className="mb-1 block text-sm font-medium text-[#333]">Nouveau mot de passe</label>
                  {editingPw ? (
                    <div className="space-y-2" onPointerDownCapture={() => setPwUnlocked(true)}>
                      <input
                        type="text" inputMode="text" style={maskStyle}
                        value={oldPw}
                        onChange={(e) => setOldPw(e.target.value)}
                        placeholder="Mot de passe actuel"
                        autoComplete="current-password"
                        autoFocus
                        disabled={!pwUnlocked}
                        className="w-full rounded-md border border-border px-3 py-2.5 text-[15px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                      />
                      <input
                        id={`npw-${fieldUid}`}
                        name={`npw-${fieldUid}`}
                        type="text" inputMode="text" style={maskStyle}
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder="Nouveau mot de passe (8 caractères min)"
                        autoComplete="off"
                        disabled={!pwUnlocked}
                        className="w-full rounded-md border border-border px-3 py-2.5 text-[15px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                      />
                      <input
                        type="text" inputMode="text" style={maskStyle}
                        name={`npw2-${fieldUid}`}
                        value={pw2}
                        onChange={(e) => setPw2(e.target.value)}
                        placeholder="Confirme le nouveau mot de passe"
                        autoComplete="off"
                        disabled={!pwUnlocked}
                        className="w-full rounded-md border border-border px-3 py-2.5 text-[15px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (await savePassword()) {
                              setEditingPw(false);
                              setPwUnlocked(false);
                            }
                          }}
                          disabled={busy}
                          className="rounded-md bg-[#e91e63] px-4 py-2 font-medium text-white disabled:opacity-60"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPw(false);
                            setPwUnlocked(false);
                            setOldPw("");
                            setPw("");
                            setPw2("");
                          }}
                          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-[#555]"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPw(true);
                        setPwUnlocked(false);
                        setOldPw("");
                        setPw("");
                        setPw2("");
                      }}
                      className="rounded-md border border-border px-4 py-2 text-sm font-medium text-[#555]"
                    >
                      Changer de mot de passe
                    </button>
                  )}
                </div>
                {msg && <p className="text-sm text-[#555]">{msg}</p>}
                <Link
                  to="/inscription"
                  className="block w-full rounded-md border border-border px-4 py-2.5 text-center font-medium text-[#555]"
                >
                  Modifier mon profil complet
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await signOutSwivv();
                    nav({ to: "/" });
                  }}
                  className="w-full rounded-md border border-[#e91e63] px-4 py-2.5 font-medium text-[#e91e63]"
                >
                  Déconnexion
                </button>
              </div>
            </section>

            <section id="langue" aria-label="Langue" className="mt-8 scroll-mt-4">
              <h2 className="font-medium text-[#333]">Langue</h2>
              <div className="mt-2 rounded-2xl bg-white p-4 shadow-sm">
                {/* ponytail: picks the message-translation target only (UI stays French) — full i18n if a 2nd locale ships */}
                <select
                  value={lang}
                  onChange={(e) => {
                    setLang(e.target.value);
                    setAppLang(e.target.value);
                  }}
                  aria-label="Langue de traduction des messages"
                  className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-[15px] text-[#333]"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                </select>
                <p className="mt-2 text-sm text-[#777]">
                  Les messages reçus pourront être traduits vers cette langue.
                </p>
              </div>
            </section>

            <section aria-label="Zone dangereuse" className="mt-8">
              <h2 className="font-medium text-red-700">Zone dangereuse</h2>
              <div className="mt-2 rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#333]">
                    <span className="block font-medium">Masquer mon profil</span>
                    <span className="text-[#777]">Invisible des autres utilisateurs jusqu'à réactivation.</span>
                  </span>
                  {/* ponytail: hand-rolled switch, no toggle lib — headless UI if switches ever need animations */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={hidden}
                    aria-label="Masquer mon profil"
                    onClick={() => {
                      if (hidden) {
                        setHidden(false);
                        void setProfileHidden(false);
                      } else {
                        setConfirmHide(true);
                      }
                    }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${hidden ? "bg-[#e91e63]" : "bg-[#d4d4d4]"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${hidden ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
                {confirmHide && !hidden && (
                  <div className="mt-3 rounded-lg bg-[#f7f7f7] p-3">
                    <p className="text-sm text-[#333]">Ton profil ne sera plus visible par les autres utilisateurs. Continuer ?</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setHidden(true);
                          void setProfileHidden(true);
                          setConfirmHide(false);
                        }}
                        className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white"
                      >
                        Oui, masquer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmHide(false)}
                        className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-[#555]"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-4 text-sm text-[#555]">
                  Supprime ton profil, tes likes, tes matchs et tes messages. Irréversible.
                </p>
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={busy}
                  className="mt-3 w-full rounded-md bg-red-600 px-4 py-2.5 font-medium text-white disabled:opacity-60"
                >
                  {busy ? "Suppression…" : "Supprimer mon compte"}
                </button>
              </div>
            </section>
          </>
        )}
      </main>
      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmer la suppression du compte"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirming(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SwivvLogo />
            <h2 className="mt-2 text-xl font-medium text-[#333]">Swivv Out ?</h2>
            <p className="mt-1 text-sm text-[#777]">
              Tu es sûr de vouloir partir ? Ton profil, tes likes, tes matchs et tes messages seront effacés. Irréversible.
            </p>
            <p className="mt-4 text-sm font-medium text-[#333]">Pourquoi nous quittes-tu ?</p>
            <div className="mt-2 space-y-2" role="radiogroup" aria-label="Motif de suppression">
              {DELETE_REASONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2 text-sm text-[#555]">
                  <input
                    type="radio"
                    name="delete-reason"
                    value={r}
                    checked={deleteReason === r}
                    onChange={() => setDeleteReason(r)}
                    className="accent-[#e91e63]"
                  />
                  {r}
                </label>
              ))}
            </div>
            {deleteReason === "Autre" && (
              <textarea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Dis-nous en plus…"
                rows={3}
                maxLength={500}
                className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
              />
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-md border border-border px-4 py-2.5 font-medium text-[#555]"
              >
                Rester
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={!deleteReason || busy}
                className="flex-1 rounded-md bg-red-600 px-4 py-2.5 font-medium text-white disabled:opacity-60"
              >
                {busy ? "Suppression…" : "Swivv Out"}
              </button>
            </div>
            {deleteError && <p className="mt-2 text-sm font-medium text-red-600">{deleteError}</p>}
          </div>
        </div>
      )}
      <SwivvFooter />
    </div>
  );
}
