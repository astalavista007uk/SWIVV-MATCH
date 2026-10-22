import { describe, expect, test } from "bun:test";

// ponytail: static guard only (bun can't run Postgres) — asserts the block-guard migration still says what it must:
// definer helper, guard on all five social writes, open chat policy gone, leave-paths (USING) untouched.
// Real proof is applying it in Supabase and probing blocked writes from a second account.
const SQL = await Bun.file(new URL("../supabase/migrations/20261026000000_swivv_block_guard.sql", import.meta.url)).text();

describe("block guard migration", () => {
  test("helper is SECURITY DEFINER with locked search_path", () => {
    expect(SQL).toContain("CREATE OR REPLACE FUNCTION public.is_blocked(a uuid, b uuid)");
    expect(SQL).toContain("SECURITY DEFINER SET search_path = public");
    expect(SQL).toMatch(/blocker_id = a AND blocked_id = b/);
  });
  test("every social insert checks the guard", () => {
    for (const needle of [
      "NOT public.is_blocked(auth.uid(), user_id)",
      "NOT public.is_blocked(auth.uid(), liked_id)",
      "NOT public.is_blocked(user_a, user_b)",
      "NOT public.is_blocked(auth.uid(), viewed_id)",
      "NOT public.is_blocked(auth.uid(), owner_id)",
    ]) expect(SQL).toContain(needle);
  });
  test("superseded open chat policy is dropped", () => {
    expect(SQL).toContain("DROP POLICY IF EXISTS chats_deliver ON public.swivv_chats");
  });
  test("leave-paths keep working while blocked", () => {
    expect(SQL).toContain("USING (auth.uid() = liker_id OR public.staff_level() >= 10)");
    expect(SQL).toContain("USING (auth.uid() = user_a OR auth.uid() = user_b OR public.staff_level() >= 10)");
    expect(SQL).toContain("USING (auth.uid() = viewer_id OR public.staff_level() >= 10)");
  });
});
