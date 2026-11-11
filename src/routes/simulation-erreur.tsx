import { createFileRoute } from "@tanstack/react-router";

// Simulation of a broken page: throws before the route renders, so the crash screen is what you
// actually see. ponytail: a real throw (not a copy of the markup) so the demo can never drift
// from the production behaviour it is demonstrating.
export const Route = createFileRoute("/simulation-erreur")({
  beforeLoad: () => {
    throw new Error("Simulation d'erreur — page de secours");
  },
  component: () => null,
} as any);
