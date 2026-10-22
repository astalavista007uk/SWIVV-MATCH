import { describe, expect, test } from "bun:test";

// ponytail: static guard like block-guard.test.ts (bun can't run Postgres) — the blocked_read policy is what lets
// the blocked member see the banner/icon; real proof is applying it and reading swivv_blocks as the blocked account.
const SQL = await Bun.file(new URL("../supabase/migrations/20261027000000_swivv_blocks_blocked_read.sql", import.meta.url)).text();

describe("blocked-read migration", () => {
  test("blocked members can read blocks held against them", () => {
    expect(SQL).toContain("CREATE POLICY swivv_blocks_blocked_read ON public.swivv_blocks");
    expect(SQL).toContain("blocked_id = auth.uid()");
  });
  test("nothing else in the block model changes", () => {
    expect(SQL).not.toContain("FOR INSERT");
    expect(SQL).not.toContain("FOR UPDATE");
    expect(SQL).not.toContain("FOR DELETE");
  });
});
