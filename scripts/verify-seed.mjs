import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const m = JSON.parse(readFileSync("secrets/test-credentials-qa-2026-10.json", "utf8"));
const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const svc = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const t01 = m.accounts[0], t02 = m.accounts[1];

const user = createClient(url, anon, { auth: { persistSession: false } });
const { data: auth, error: authErr } = await user.auth.signInWithPassword({ email: t01.email, password: t01.password });
console.log("login t01:", authErr ? "FAIL " + authErr.message : "OK uid=" + (auth.user?.id === t01.userId ? "matches manifest" : "MISMATCH"));

if (auth?.user) {
  const own = await user.from("swivv_profiles").select("data").eq("user_id", t01.userId).maybeSingle();
  console.log("own profile row:", own.error ? "ERR " + own.error.message : (own.data?.data?.name ?? "missing"));
  const all = await user.from("swivv_profiles").select("user_id,data");
  const rows = all.data ?? [];
  const testIds = new Set(m.accounts.map((a) => a.userId));
  const others = rows.filter((r) => r.user_id !== t01.userId);
  console.log("visible rows:", rows.length, "| others:", others.length, "| others hidden-flagged:", others.filter((r) => r.data?.profileHidden === true).length, "| others NOT test batch:", others.filter((r) => !testIds.has(r.user_id)).length);
  console.log("RLS hidden-flag respected:", others.filter((r) => r.data?.profileHidden === true).length === 0 ? "YES" : "NO (FT-06 confirmed live)");
  await user.auth.signOut();
}

const col = await svc.from("swivv_email_log").select("provider_id").limit(1);
console.log("email_log.provider_id:", col.error ? "MISSING (" + (col.error.code || col.error.message) + ")" : "present");
const col2 = await svc.from("swivv_email_log").select("error").limit(1);
console.log("email_log.error:", col2.error ? "MISSING (" + (col2.error.code || col2.error.message) + ")" : "present");
const cnt = await svc.from("swivv_profiles").select("user_id", { count: "exact", head: true }).eq("data->>testBatch", "qa-2026-10");
console.log("seeded rows:", cnt.count, "| error:", cnt.error?.message ?? "none");
