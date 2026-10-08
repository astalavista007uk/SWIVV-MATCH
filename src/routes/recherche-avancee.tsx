import { createFileRoute } from "@tanstack/react-router";
import { MatchesPage } from "@/routes/matches";

export const Route = createFileRoute("/recherche-avancee")({
  head: () => ({ meta: [{ title: "Recherche avancée — SWIVV" }] }),
  component: () => <MatchesPage title="Recherche Avancée" mode="search" />,
});

// ponytail: alias of /matches (same component, zero duplication) — split into a real page if the two ever diverge
