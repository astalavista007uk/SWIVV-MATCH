import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAFF = ["super_admin", "admin", "moderator", "support", "analyst"];

// ponytail: the admin directory also lists auth users without a profile row
// (fresh signups awaiting e-mail confirmation). 20 pages x 1000 is a hard ceiling;
// move to a keyset page if the member base ever outgrows it.
export const adminListAuthUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (!(roles ?? []).some((r: any) => STAFF.includes(String(r.role)))) throw new Error("forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const out: { id: string; email: string | null; name: string | null; created_at: string | null; last_sign_in_at: string | null }[] = [];
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      for (const u of data.users) {
        out.push({
          id: u.id,
          email: u.email ?? null,
          name: (u.user_metadata?.name as string | undefined) ?? null,
          created_at: u.created_at ?? null,
          last_sign_in_at: u.last_sign_in_at ?? null,
        });
      }
      if (data.users.length < 1000) break;
    }
    return out;
  });
