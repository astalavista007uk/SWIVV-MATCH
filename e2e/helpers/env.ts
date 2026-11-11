import "dotenv/config";

export const MAIL_USER = process.env.E2E_MAIL_USER ?? "contact@swivvmatch.com";
export const MAIL_PASS = process.env.E2E_MAIL_PASS ?? process.env.IONOS_SMTP_PASS ?? "";
export const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? MAIL_USER;
export const AUTH_EMAIL = process.env.E2E_AUTH_EMAIL ?? "support@swivvmatch.com";
export const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:55321";
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!MAIL_PASS) throw new Error("E2E_MAIL_PASS or IONOS_SMTP_PASS is required");
if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
