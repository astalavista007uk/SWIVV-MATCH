import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { PawPrint, Search, ArrowLeft, Briefcase, Eye, EyeOff, Check, X, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CguAcceptDialog } from "@/components/cgu-accept-dialog";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

async function signInWithFacebook(intent: Intent) {
  const userType = intent === "provider" ? "sitter" : "owner";
  const serviceCategories = intent === "provider" ? [] : ["pet_owner"];
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: window.location.origin,
      data: { user_type: userType, service_categories: serviceCategories },
    },
  });
  if (error) toast.error(error.message);
}

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The Supabase auth client stringifies an opaque/empty error body (e.g. a 5xx
 * Response object) into "{}" or "[object Object]". Never surface that to users —
 * map it to a clear, actionable message and rely on the console log for detail.
 */
function authErrorMessage(err: any, fallback: string, serviceUnavailable: string): string {
  const raw = typeof err?.message === "string" ? err.message.trim() : "";
  if (!raw || raw === "{}" || raw === "[object Object]") {
    const status = err?.status;
    if (err?.name === "AuthRetryableFetchError" || (typeof status === "number" && status >= 500)) {
      return serviceUnavailable;
    }
    return fallback;
  }
  return raw;
}

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — PET BASE" }] }),
  component: AuthPage,
});

type Intent = "provider" | "owner" | "signin" | null;

function AuthPage() {
  const { t } = useTranslation();
  const { mode } = Route.useSearch();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [intent, setIntent] = useState<Intent>(mode === "signin" ? "signin" : null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [verifyEmailSent, setVerifyEmailSent] = useState<string | null>(null);
  const [cguOpen, setCguOpen] = useState(false);
  const [cguAccepted, setCguAccepted] = useState(() => {
    try {
      return localStorage.getItem("swivv-cgu-accepted") === "1";
    } catch {
      return false;
    }
  });
  const pendingNav = useRef(false);

  const emailInvalid = emailTouched && email.length > 0 && !EMAIL_RE.test(email);

  useEffect(() => {
    if (!loading && user && !pendingNav.current) nav({ to: "/browse" });
  }, [user, loading, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!intent) return;
    if ((intent === "provider" || intent === "owner") && !cguAccepted) {
      toast.error("Ouvre les CGU détaillées, lis jusqu'en bas et clique Accepter.");
      setCguOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      if (intent === "signin") {
        // Retry transient/retryable failures (5xx, network). The Supabase client
        // otherwise surfaces these as an opaque "{}" error that locks users out
        // even though sign-in would succeed on the next attempt.
        let result: { data: any; error: any } = { data: {}, error: null };
        for (let attempt = 1; attempt <= 3; attempt++) {
          result = await supabase.auth.signInWithPassword({ email, password });
          const retryable =
            result.error?.name === "AuthRetryableFetchError" ||
            (typeof result.error?.status === "number" && result.error.status >= 500);
          if (!result.error || !retryable || attempt === 3) break;
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
        const { data, error } = result;
        if (error) throw error;
        if (data.user) {
          await supabase
            .from("profiles")
            .update({
              last_login: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
            })
            .eq("id", data.user.id);
        }
        toast.success(t("auth.welcomeBackToast"));
        pendingNav.current = true;
        nav({ to: "/browse" });
        return;
      }

      // Signup path — set default categories based on intent
      const serviceCategories = intent === "provider" ? [] : ["pet_owner"];
      const userType = intent === "provider" ? "sitter" : "owner";

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName, user_type: userType, service_categories: serviceCategories },
        },
      });
      if (error) throw error;

      // Email confirmation required: no session returned yet.
      // Show "check your email" screen instead of logging in.
      if (data.user && !data.session) {
        setVerifyEmailSent(email);
        return;
      }

      if (data.user && data.session) {
        await supabase
          .from("profiles")
          .update({
            user_type: userType,
            service_categories: serviceCategories,
          })
          .eq("id", data.user.id);
      }

      toast.success(t("auth.accountCreated"));
      pendingNav.current = true;
      // Providers land on dashboard to complete profile; owners land on browse
      nav({ to: intent === "provider" ? "/dashboard" : "/browse" });
    } catch (err: any) {
      console.error("[auth] sign-in/sign-up failed:", err);
      toast.error(authErrorMessage(err, t("auth.somethingWrong"), t("auth.serviceUnavailable")));
    } finally {
      setSubmitting(false);
    }
  }

  const isSignin = intent === "signin";
  const isSignup = intent === "provider" || intent === "owner";

  // Password requirement checks (shown on signup only)
  const pwReqs = [
    { label: t("auth.pwMin6"), met: password.length >= 6 },
    { label: t("auth.pwLetter"), met: /[a-zA-Z]/.test(password) },
    { label: t("auth.pwNumber"), met: /\d/.test(password) },
  ];
  const pwAllMet = pwReqs.every((r) => r.met);

  // Headline/subtitle based on intent
  const copy = {
    provider: {
      title: t("auth.providerTitle"),
      sub: t("auth.providerSub"),
      cta: t("auth.providerCta"),
    },
    owner: {
      title: t("auth.ownerTitle"),
      sub: t("auth.ownerSub"),
      cta: t("auth.ownerCta"),
    },
    signin: {
      title: t("auth.welcomeBack"),
      sub: t("auth.signinSub"),
      cta: t("auth.submitSignin"),
    },
  }[intent ?? "signin"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent/60 via-background to-secondary/20 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
        <Link to="/" className="flex items-center justify-center gap-2" aria-label="PET BASE home">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <PawPrint className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">PET BASE</span>
        </Link>

        {/* VERIFICATION PENDING SCREEN (email confirmation required) */}
        {verifyEmailSent && (
          <div className="mt-8 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold">{t("auth.verifyEmailTitle")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.verifyEmailDesc", { email: verifyEmailSent })}
            </p>
            <p className="text-xs text-muted-foreground">{t("auth.verifyEmailTip")}</p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setVerifyEmailSent(null);
                setIntent("signin");
              }}
            >
              {t("auth.verifyEmailBack")}
            </Button>
          </div>
        )}

        {/* INTENT SELECTION (initial screen) */}
        {!intent && !verifyEmailSent && (
          <div className="mt-8 space-y-4">
            <h1 className="text-center text-2xl font-bold">{t("auth.welcomeTo")}</h1>
            <p className="text-center text-sm text-muted-foreground">{t("auth.chooseStart")}</p>

            <button
              type="button"
              onClick={() => setIntent("provider")}
              className="group flex w-full items-start gap-4 rounded-2xl border border-border bg-background p-5 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                aria-hidden="true"
              >
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{t("auth.offerServices")}</div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t("auth.offerServicesDesc")}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIntent("owner")}
              className="group flex w-full items-start gap-4 rounded-2xl border border-border bg-background p-5 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                aria-hidden="true"
              >
                <Search className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{t("auth.lookingForCare")}</div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t("auth.lookingForCareDesc")}
                </p>
              </div>
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs uppercase text-muted-foreground">
                  {t("auth.orDivider")}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-[#1877F2] text-[#1877F2] hover:bg-[#1877F2]/5"
              onClick={() => {
                if (!cguAccepted) {
                  toast.error("Ouvre les CGU détaillées, lis jusqu'en bas et clique Accepter.");
                  setCguOpen(true);
                  return;
                }
                signInWithFacebook("owner");
              }}
            >
              <FacebookIcon className="h-5 w-5" />
              {t("auth.continueWithFacebook")}
            </Button>

            <button
              type="button"
              onClick={() => setIntent("signin")}
              className="w-full rounded-xl border border-border bg-background py-3 text-sm font-medium transition hover:bg-accent"
            >
              {t("auth.alreadyHaveAccount")}
            </button>
          </div>
        )}

        {/* FORM (provider / owner / signin) */}
        {intent && !verifyEmailSent && (
          <>
            <button
              type="button"
              onClick={() => setIntent(null)}
              className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("auth.chooseDifferent")}
            </button>

            <h1 className="mt-4 text-center text-2xl font-bold">{copy.title}</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">{copy.sub}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {isSignup && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t("auth.fullName")}</Label>
                  <Input
                    id="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("auth.namePlaceholder")}
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailTouched(false);
                  }}
                  onBlur={() => setEmailTouched(true)}
                  autoComplete="email"
                  aria-invalid={emailInvalid}
                  aria-describedby={emailInvalid ? "email-error" : undefined}
                  className={
                    emailInvalid ? "border-destructive focus-visible:ring-destructive" : ""
                  }
                />
                {emailInvalid && (
                  <p id="email-error" className="text-xs font-medium text-destructive" role="alert">
                    {t("auth.emailInvalid")}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  {isSignin && (
                    <button
                      type="button"
                      onClick={() => setResetOpen(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t("auth.forgotPassword")}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignin ? "current-password" : "new-password"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {isSignup && (
                  <ul className="mt-1 space-y-0.5" aria-label="Password requirements">
                    {pwReqs.map((req) => (
                      <li
                        key={req.label}
                        className={`flex items-center gap-1.5 text-xs ${req.met ? "text-muted-foreground" : "text-muted-foreground/60"}`}
                      >
                        {req.met ? (
                          <Check className="h-3 w-3 text-success" aria-hidden="true" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        )}
                        {req.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={submitting || (isSignup && (!pwAllMet || !cguAccepted))}
              >
                {submitting ? t("auth.please") : copy.cta}
              </Button>
            </form>

            {/* Cross-link between sign-in and sign-up */}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isSignin ? (
                <>
                  {t("auth.noAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => setIntent(null)}
                    className="font-medium text-primary hover:underline"
                  >
                    {t("auth.signUpLink")}
                  </button>
                </>
              ) : (
                <>
                  {t("auth.haveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => setIntent("signin")}
                    className="font-medium text-primary hover:underline"
                  >
                    {t("auth.signInLink")}
                  </button>
                </>
              )}
            </div>

            {isSignup && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {cguAccepted ? "✓ CGU détaillées acceptées. " : ""}
                <button type="button" onClick={() => setCguOpen(true)} className="underline hover:text-foreground">
                  {cguAccepted ? "Relire les CGU détaillées" : "Lire les CGU détaillées et accepter"}
                </button>{" "}
                · {t("auth.agreeToTerms")}{" "}
                <Link to="/terms-and-conditions" className="underline hover:text-foreground">
                  {t("auth.termsLink")}
                </Link>{" "}
                {t("auth.andWord")}{" "}
                <Link to="/privacy-centre" className="underline hover:text-foreground">
                  {t("auth.privacyLink")}
                </Link>
                .
              </p>
            )}

            {/* Social sign-in */}
            <div className="mt-4">
              <div className="relative mb-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs uppercase text-muted-foreground">
                    {t("auth.orDividerForm")}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-[#1877F2] text-[#1877F2] hover:bg-[#1877F2]/5"
                onClick={() => {
                  if (!isSignin && !cguAccepted) {
                    toast.error("Ouvre les CGU détaillées, lis jusqu'en bas et clique Accepter.");
                    setCguOpen(true);
                    return;
                  }
                  signInWithFacebook(intent);
                }}
              >
                <FacebookIcon className="h-5 w-5" />
                {isSignin ? t("auth.signInWithFacebook") : t("auth.continueWithFacebook")}
              </Button>
            </div>
          </>
        )}
      </div>

      <ForgotPasswordDialog open={resetOpen} onOpenChange={setResetOpen} defaultEmail={email} />
      <CguAcceptDialog
        open={cguOpen}
        onOpenChange={setCguOpen}
        onAccept={() => {
          setCguAccepted(true);
          try {
            localStorage.setItem("swivv-cgu-accepted", "1");
          } catch {}
        }}
      />
    </div>
  );
}

function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultEmail: string;
}) {
  const { t } = useTranslation();
  const [resetEmail, setResetEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setResetEmail(defaultEmail);
  }, [open, defaultEmail]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      toast.success(t("auth.resetSent"));
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? t("auth.resetError"));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("auth.resetTitle")}
          </DialogTitle>
          <DialogDescription>{t("auth.resetDesc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reset-email">{t("auth.email")}</Label>
            <Input
              id="reset-email"
              type="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              {t("auth.resetCancel")}
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? t("auth.resetSending") : t("auth.resetSend")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
