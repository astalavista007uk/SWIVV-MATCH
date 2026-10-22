import { createFileRoute, Link, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({ meta: [{ title: "Centre de confidentialité — SWIVV" }] }),
  // ponytail: canonical privacy page is /privacy-centre (policy text lives there as "Politique détaillée" + export/delete tools) — this route survives only as a redirect so old links never 404; delete outright when no inbound link remains
  beforeLoad: () => {
    throw redirect({ to: "/privacy-centre" });
  },
  component: LegalPrivacyRedirect,
});

function LegalPrivacyRedirect() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-sm text-[#555]">
        Notre politique a déménagé :{" "}
        <Link to="/privacy-centre" className="font-medium text-[#e91e63] hover:underline">
          ouvrir le centre de confidentialité
        </Link>
        .
      </p>
    </main>
  );
}
