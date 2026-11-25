import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const subscriptionSchema = z.object({
  endpoint: z
    .string()
    .url()
    .max(2048)
    .refine((value) => {
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
    }, "Unsupported push service endpoint"),
  p256dh: z.string().min(40).max(200),
  auth: z.string().min(16).max(100),
  userAgent: z.string().max(1000).nullable(),
});

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => subscriptionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error)
      throw new Error("Impossible d'enregistrer cet appareil pour les notifications push.");
    return { saved: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ endpoint: z.string().url().max(2048) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", context.userId)
      .eq("endpoint", data.endpoint);
    if (error) throw new Error("Impossible de désactiver les notifications push sur cet appareil.");
    return { removed: true };
  });
