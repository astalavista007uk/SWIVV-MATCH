// AI provider abstraction — no provider is configured.
// ponytail: interface first, SDKs later (no new dependency until credentials exist) —
// all business logic calls callModel(); rules run deterministic evaluators meanwhile

export type AiProvider = "none" | "openai" | "anthropic" | "mistral" | "custom";

export type ProviderStatus = {
  provider: AiProvider;
  configured: boolean;
  /** Concrete steps to activate, shown in the UI. */
  steps: string[];
};

export function providerStatus(): ProviderStatus {
  return {
    provider: "none",
    configured: false,
    steps: [
      "Choisir un fournisseur (OpenAI, Anthropic, Mistral…), de préférence UE.",
      "Créer une clé API et la poser côté serveur (jamais dans le navigateur).",
      "Câbler callModel() sur le SDK et renseigner coûts/latence depuis l'usage réel.",
      "Repasser les règles sensibles en revue humaine avant toute activation.",
    ],
  };
}

/** Always throws until a provider is wired — never returns simulated text. */
export async function callModel(_prompt: string, _opts?: { maxTokens?: number; redact?: boolean }): Promise<string> {
  throw new Error("IA non configurée — aucun fournisseur branché (voir Centre IA › Coûts).");
}

/** Strip the fields a model must never see (emails, exact locations, message bodies). */
export function redactForModel(input: Record<string, unknown>): Record<string, unknown> {
  const drop = new Set(["email", "body", "message", "city", "phone", "photos", "bio"]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) if (!drop.has(k)) out[k] = v;
  return out;
}
