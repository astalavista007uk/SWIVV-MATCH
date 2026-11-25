import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-swivv-push-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let different = a.length ^ b.length;
  for (let i = 0; i < length; i++) different |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return different === 0;
}

function safeLink(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//"))
    return "/notifications";
  return value;
}

function validPushEndpoint(value: string): boolean {
  try {
    const endpoint = new URL(value);
    const host = endpoint.hostname.toLowerCase();
    return (
      endpoint.protocol === "https:" &&
      (host === "fcm.googleapis.com" ||
        host === "updates.push.services.mozilla.com" ||
        host === "push.services.mozilla.com" ||
        host.endsWith(".push.apple.com"))
    );
  } catch {
    return false;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const configuredSecret = Deno.env.get("SWIVV_PUSH_WEBHOOK_SECRET") ?? "";
  const suppliedSecret = request.headers.get("x-swivv-push-secret") ?? "";
  if (!configuredSecret || !constantTimeEqual(configuredSecret, suppliedSecret)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const notificationId = await request
    .json()
    .then((body) => body?.id as string | undefined)
    .catch(() => undefined);
  if (!notificationId || !/^[0-9a-f-]{36}$/i.test(notificationId))
    return json({ error: "Invalid notification id" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@swivvmatch.com";
  if (!url || !serviceKey || !vapidPublic || !vapidPrivate) {
    console.error("SWIVV Web Push is missing server configuration.");
    return json({ error: "Push delivery is not configured" }, 503);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: notification, error: notificationError } = await admin
    .from("swivv_notifications")
    .select("id,user_id,title,link")
    .eq("id", notificationId)
    .maybeSingle();
  if (notificationError || !notification) return json({ error: "Notification not found" }, 404);

  const { data: subscriptions, error: subscriptionError } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", notification.user_id);
  if (subscriptionError) {
    console.error("SWIVV Web Push could not load subscriptions.");
    return json({ error: "Could not load subscriptions" }, 500);
  }
  if (!subscriptions?.length) return json({ sent: 0, removed: 0, failed: 0 });

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const payload = JSON.stringify({
    title: notification.title || "SWIVV MATCH",
    message: "Ouvre SWIVV MATCH pour consulter cette notification.",
    url: safeLink(notification.link),
  });

  let sent = 0;
  let removed = 0;
  let failed = 0;
  await Promise.all(
    subscriptions.map(async (subscription) => {
      if (!validPushEndpoint(subscription.endpoint)) {
        const { error: deleteError } = await admin
          .from("push_subscriptions")
          .delete()
          .eq("id", subscription.id);
        if (deleteError) failed++;
        else removed++;
        return;
      }
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: 86400 },
        );
        sent++;
      } catch (error) {
        const statusCode = Number((error as { statusCode?: number })?.statusCode ?? 0);
        if (statusCode === 404 || statusCode === 410) {
          const { error: deleteError } = await admin
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
          if (deleteError) failed++;
          else removed++;
        } else {
          failed++;
          console.error(`SWIVV Web Push delivery failed (HTTP ${statusCode || "unknown"}).`);
        }
      }
    }),
  );

  return json({ sent, removed, failed });
});
