# Functional test report

Environment: local dev (`https://127.0.0.1:5273`), Chrome via CDP, 1440×900 (desktop) and 390×844 (mobile).
Raw data: `evidence/public-pages.json`. Screenshots: `evidence/*.png`.
All runs were **unauthenticated** — no test accounts exist yet (see `test-profiles.md`).

## 1. Baseline (executed 2026-10-24)

| Command | Result | Notes |
|---|---|---|
| `bun test` | **139 pass / 0 fail**, 338 assertions, 25 files, ~5 s | Unit tests only (pure logic: matching, moderation, notifications, admin metrics, email HTML) |
| `bun x tsc --noEmit` | **exit 0** | |
| `bun run build` | **exit 0** | Client built in 3.49 s; `.output/server/wrangler.json`, `.output/nitro.json` generated. Only warnings are third-party `"use client"` module-directive notices from Radix |
| `git status` | dirty | 40 files with real diffs (687+/362−). ~80 further files show as modified only because `core.autocrlf=true` normalises LF→CRLF — not content changes |
| `git log` | `main` ahead 2 of `origin/main` | Nothing pushed; last commit `df825d3` |

No `test` script exists in `package.json`; the suite is invoked as `bun test` directly. No E2E framework is installed (no Playwright/Cypress/Vitest).

## 2. Public route smoke (anonymous)

| Route | Result | H1 | Console errors | Failed requests |
|---|---|---|---|---|
| `/` | Renders (SSR 151 KB) | "Fais de belles rencontres, gratuitement" | 1 (build warning) | 0 |
| `/inscription` | **Client-only shell**: server HTML = "Chargement…" (4.1 KB, no h1) | appears after 0.65–1.3 s | 1 | 0 |
| `/browse` | Renders **23 profiles while logged out** | "23 profils" | 1 | 0 |
| `/swipe` | Login prompt | **none** | 1 | 0 |
| `/matches` | Login prompt | **none** | 1 | 0 |
| `/messagerie` | Login gate + full conversation shell | "Conversations (0 · 0 non lu)" | 1 | 0 |
| `/parametres` | Settings shell + "Connecte-toi…" | "Paramètres" | 1 | 0 |
| `/mon-profil` | "Crée ton profil SWIVV" | present | 1 | 0 |
| `/comment-ca-marche` | Renders | "Découvrir comment ça marche" | 1 | 0 |
| `/faq` | Renders | "On répond à tout" | 1 | 0 |

The single recurring console error on every page is a TanStack Router build warning:

> `[tanstack-router] These exports from "src/routes/matches.tsx" will not be code-split and will increase your bundle size`

**FT-01 — Un-shot code-splitting regression (Low/Medium).** Something in `matches.tsx` is exported non-component (a helper/const), forcing the route into the main chunk on every page. Fix: move the helper to `src/lib/`.
**FT-02 — `/inscription` has no server-rendered content (High).** Verified twice. Homepage is SSR'd; signup is not. Impact: worse LCP on the highest-intent page, no indexable copy, blank flash without JS.
**FT-03 — Anonymous `/browse` shows 23 profiles (High, trust).** These are the static `SWIVV_PROFILES` seed personas, merged with DB members (`browse.tsx:127`), displayed with no "démo/exemple" disclosure and the same UI as real members. On a product whose safety content teaches users to spot fake profiles, this is a credibility and consumer-law risk.
**FT-04 — `/swipe` and `/matches` have no `<h1>` (Medium, a11y/SEO).** Login prompts are plain divs.
**FT-05 — Heading order on `/messagerie` (Low, a11y).** Outline order is `H2 "Connexion requise"` → `H1 "Conversations"` → `H2 "Tes messages t'attendent"`. The gate's heading precedes the page heading.

All pages: 0 images without `alt`, 0 unnamed links/buttons, 0 unlabeled form fields at probe time (one unlabeled field appears transiently on mobile `/inscription`). No horizontal overflow at 390 px on the 10 routes tested.

## 3. Code-level findings (verified by reading source)

### Security / privacy

**FT-06 — Hidden profiles are not hidden at the API level (Critical).**
- `supabase/migrations/20260930000000_swivv_public_read.sql` creates a hidden-aware policy (`data->>'profileHidden'`).
- `supabase/migrations/20260930000003_swivv_profiles_public_read.sql` then does `drop policy … "public readable"` and creates `profiles_public_read … using (true)`. Postgres permissive policies are OR'd, so any authenticated member can select **every** profile row, including users who enabled "Masquer mon profil".
- The correction exists at `supabase/migrations/20261029000000_swivv_profile_privacy.sql` (drops both, recreates the hidden-aware policy, strips `birthdate`), but per project notes it is **unapplied**. Remote state must be confirmed with `supabase migration list`.
- **Correction to the earlier draft:** the UI did *not* filter hidden profiles either — `usePublicProfiles` filtered only on `name` + photo. Discovery now filters them client-side (`FEED_FIELDS` gained `profileHidden`, one `if` in the shared hook), verified: signed in as t01, `/browse` renders 15 cards (11 seed men + 4 real members) and **0 of the 15 test accounts**. That is a mitigation, not the fix; the API still returns them.
- **Confirmed live 2026-10-24** after seeding: signed in as test member t01, `select user_id,data from swivv_profiles` returned **19 rows** — 18 other members, 14 of them flagged `profileHidden: true`, plus 4 real members. Ran via `scripts/verify-seed.mjs`.

**FT-07 — No business rate limiting (Medium).** `src/lib/swivv-auth.tsx:136` states it explicitly: "limites Supabase par défaut ; pas de limites métier configurées". Supabase throttles auth events per hour and the email provider has its own caps, but messaging, likes, reports and translation calls have no per-user budget.

**FT-08 — Password strength is advisory only (Medium).** `src/lib/swivv-password.ts` computes a 0–3 score for a UI meter; there is no enforcement. Any password accepted by Supabase Auth (default minimum 6) is valid.

**FT-09 — Admin UI is client-gated (Low, mitigated).** `src/routes/admin.route.tsx` decides visibility with `useAdminRole()` in the browser. Data itself is protected by RLS + `staff_level()` policies, so this is defence-in-depth, not a hole — but the shell (navigation labels, feature names) is visible to anyone who manipulates the client. Acceptable given RLS; document it.

**FT-10 — Upload validation is client-side (Low).** `sendImage` rejects >5 MB (`swivv-store.ts:871`) and profile photos >2.5 MB; MIME type is inferred from the file extension and the `<input accept>` only. Bucket-level policy is the real gate. Worth a server-side content-type check if attachments ever become public.

### Configuration / release

**FT-11 — Claimed production domain is dead (Critical).** `swivvmatch.com` → NXDOMAIN (`Resolve-DnsName`: "DNS name does not exist"). The only live host is `swivv.vercel.app`, serving `<title>SWIVV — Rencontres</title>` — i.e. a build older than the current "SWIVV MATCH — Site de rencontres gratuit" title in the repo.

**FT-12 — `matches.tsx` route exports are not code-split** (see FT-01).

## 4. Not tested (blocked or out of scope)

| Area | Why |
|---|---|
| Registration submit, duplicate email, verification mail | Would create a real auth user; no approval |
| Login/logout/session expiry, password reset | Same |
| Profile edit, photo upload/replace/remove | Same |
| Swipe, like, mutual match, match % in the UI | Same (formula itself IS covered by unit tests) |
| Messaging send/receive, voice, attachments | Same |
| Cross-account access checks (IDOR) | Requires two accounts |
| Admin panel, role matrix, moderation queue | Requires staff accounts |
| Email delivery (Resend) | Would send real mail; `/emails` preview reviewed instead |
| Rate limiting | Cannot be tested without load; static finding only |
| Lighthouse / axe contrast audit | No Lighthouse/axe dependency; DOM checks only |
| Safari/Firefox/mobile devices | Chrome + CDP emulation only |
| Supabase remote schema state | Would require the service role against production |

## 5. Reproduction notes

- Browser probe script and raw JSON: `evidence/public-pages.json` (fields: `h1`, `headingOutline`, `imgsNoAlt`, `unnamedControls`, `unlabeledFields`, `overflowX`, `consoleErrors`, `failedRequests`).
- Timings measured twice on a warm dev server; production numbers will differ.
