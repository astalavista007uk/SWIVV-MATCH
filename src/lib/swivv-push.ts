import { savePushSubscription, removePushSubscription } from "@/lib/push.functions";

export type PushState =
  | "loading"
  | "enabled"
  | "disabled"
  | "unsupported"
  | "denied"
  | "install-required"
  | "configuration-missing"
  | "unauthenticated"
  | "error";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isInstalledPwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function browserPushSupport(): PushState | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "unsupported";
  if (
    !window.isSecureContext ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  if (isIos() && !isInstalledPwa()) return "install-required";
  if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) return "configuration-missing";
  if (Notification.permission === "denied") return "denied";
  return null;
}

function applicationServerKey(value: string): ArrayBuffer {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (!existing) await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

export async function getPushState(): Promise<PushState> {
  const unsupported = browserPushSupport();
  if (unsupported) return unsupported;
  try {
    const reg = await registration();
    return (await reg.pushManager.getSubscription()) ? "enabled" : "disabled";
  } catch {
    return "error";
  }
}

export async function enablePushOnThisDevice(): Promise<PushState> {
  const unsupported = browserPushSupport();
  if (unsupported) return unsupported;

  // Call from the button's click handler so browsers can honor the permission prompt.
  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    return "error";
  }
  if (permission !== "granted") return permission === "denied" ? "denied" : "disabled";

  try {
    const reg = await registration();
    const {
      data: { user },
    } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
    if (!user) return "unauthenticated";

    const subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(import.meta.env.VITE_VAPID_PUBLIC_KEY),
      }));
    const keys = subscription.toJSON().keys;
    if (!keys?.p256dh || !keys.auth) {
      await subscription.unsubscribe();
      return "error";
    }

    await savePushSubscription({
      data: {
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: navigator.userAgent.slice(0, 1000),
      },
    });
    return "enabled";
  } catch {
    return "error";
  }
}

export async function disablePushOnThisDevice(): Promise<PushState> {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const subscription = await reg?.pushManager.getSubscription();
    if (!subscription) return "disabled";
    await removePushSubscription({ data: { endpoint: subscription.endpoint } });
    await subscription.unsubscribe();
    return "disabled";
  } catch {
    return "error";
  }
}
