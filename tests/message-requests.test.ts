import { describe, expect, test } from "bun:test";
import {
  acceptedRequest,
  canMedia,
  canRequest,
  canText,
  cooldownDaysLeft,
  latestRequest,
  matchesRequest,
  REQUEST_COOLDOWN_MS,
  type MessageRequest,
} from "../src/lib/swivv-requests";
import { en } from "../src/lib/locales/en";
import { es } from "../src/lib/locales/es";

const ME = "11111111-1111-1111-1111-111111111111";
const PEER = "22222222-2222-2222-2222-222222222222";

function req(patch: Partial<MessageRequest> = {}): MessageRequest {
  return {
    id: "r1",
    sender_id: ME,
    recipient_id: PEER,
    initial_message: "Salut, ton profil m'a plu !",
    status: "accepted",
    text_allowed: true,
    voice_allowed: false,
    files_allowed: false,
    voice_requested: false,
    files_requested: false,
    conversation_key: `${ME}:${PEER}`,
    sender_name: "Alex",
    sender_photo: "",
    created_at: new Date().toISOString(),
    responded_at: new Date().toISOString(),
    ...patch,
  };
}

describe("message requests", () => {
  test("only an accepted request with text granted enables text", () => {
    expect(canText(req())).toBe(true);
    expect(canText(undefined)).toBe(false);
    expect(canText(req({ text_allowed: false }))).toBe(false);
    expect(canText(req({ status: "pending" }))).toBe(false);
    expect(canText(req({ status: "declined" }))).toBe(false);
  });

  test("voice and attachments stay off until granted", () => {
    const r = req();
    expect(canMedia(r, "voice")).toBe(false);
    expect(canMedia(r, "files")).toBe(false);
  });

  test("each optional permission can be granted on its own", () => {
    expect(canMedia(req({ voice_allowed: true }), "voice")).toBe(true);
    expect(canMedia(req({ voice_allowed: true }), "files")).toBe(false);
    expect(canMedia(req({ files_allowed: true }), "voice")).toBe(false);
    expect(canMedia(req({ files_allowed: true }), "files")).toBe(true);
  });

  test("both permissions can be granted together", () => {
    const r = req({ voice_allowed: true, files_allowed: true });
    expect(canMedia(r, "voice")).toBe(true);
    expect(canMedia(r, "files")).toBe(true);
  });

  test("revoking a permission blocks new media without touching text", () => {
    const r = req({ voice_allowed: false, files_allowed: false });
    expect(canText(r)).toBe(true);
    expect(canMedia(r, "voice")).toBe(false);
    expect(canMedia(r, "files")).toBe(false);
  });

  test("a declined request never opens a conversation", () => {
    const r = req({ status: "declined" });
    expect(canText(r)).toBe(false);
    expect(canMedia(r, "voice")).toBe(false);
  });

  test("a pending request cannot be duplicated", () => {
    expect(canRequest(req({ status: "pending" }), { blocked: false })).toBe(false);
    expect(canRequest(undefined, { blocked: false })).toBe(true);
  });

  test("declined pairs wait out the cooldown", () => {
    const now = Date.now();
    const recent = req({ status: "declined", responded_at: new Date(now - 1000).toISOString() });
    expect(canRequest(recent, { blocked: false, now })).toBe(false);
    expect(cooldownDaysLeft(recent, now)).toBe(7);
    const old = req({
      status: "declined",
      responded_at: new Date(now - REQUEST_COOLDOWN_MS - 1000).toISOString(),
    });
    expect(canRequest(old, { blocked: false, now })).toBe(true);
    expect(cooldownDaysLeft(old, now)).toBe(0);
  });

  test("blocked users cannot request; a mutual match still needs one", () => {
    expect(canRequest(undefined, { blocked: true })).toBe(false);
    expect(canText(undefined, true)).toBe(false);
    expect(canRequest(undefined, { blocked: false })).toBe(true);
    expect(canRequest(req(), { blocked: false })).toBe(false);
  });

  test("additional permission requests are tracked then granted", () => {
    const asked = req({ voice_requested: true });
    expect(matchesRequest(asked, "voice")).toBe(false);
    expect(asked.voice_requested).toBe(true);
    const granted = req({ voice_allowed: true });
    expect(matchesRequest(granted, "voice")).toBe(true);
  });

  test("picks the request for the right peer and ignores other pairs", () => {
    const other = req({ id: "r2", sender_id: PEER, recipient_id: ME, status: "pending" });
    expect(latestRequest([other], `u:${PEER}`, ME)?.id).toBe("r2");
    expect(latestRequest([other], ME, ME)).toBeUndefined();
  });

  test("finds the accepted request that opens the thread", () => {
    const accepted = req({ id: "r3" });
    const pending = req({ id: "r4", status: "pending" });
    expect(acceptedRequest([pending, accepted], `u:${PEER}`, ME)?.id).toBe("r3");
    expect(acceptedRequest([pending], `u:${PEER}`, ME)).toBeUndefined();
    expect(acceptedRequest([accepted], ME, ME)).toBeUndefined();
  });

  test("every new interface string is translated in EN and ES", () => {
    const keys = [
      "Contacter {name}",
      "Demande de connexion",
      "Demandes de connexion",
      "Nouvelle demande de connexion",
      "Souhaites-tu te connecter avec cette personne ?",
      "Choisis ce que tu autorises :",
      "Texte",
      "Autoriser",
      "Fonctionnalités autorisées",
      "Les messages texte ne sont pas encore autorisés. Active-les ci-dessus.",
      "Les messages texte ne sont pas encore autorisés par ce membre.",
      "Les messages texte ne sont pas encore autorisés. Autorise-les pour discuter.",
      "Les messages texte ne sont pas encore autorisés par {name}.",
      "Autoriser les messages texte",
      "Accepter la demande",
      "Refuser la demande",
      "Annuler la demande",
      "Envoyer la demande",
      "Demande envoyée",
      "Demande envoyée — en attente de sa réponse.",
      "Texte activé",
      "Vocaux",
      "Pièces jointes",
      "Révoquer",
      "Demander",
      "Cette personne a refusé la demande. Tu pourras réessayer dans {n} jour(s).",
      "Envoie une demande de connexion depuis le profil pour commencer à discuter.",
      "Match mutuel",
      "Match mutuel — envoie une demande de connexion pour discuter.",
    ] as const;
    for (const key of keys) {
      expect((en as Record<string, string>)[key]).toBeTruthy();
      expect((es as Record<string, string>)[key]).toBeTruthy();
    }
  });
});
