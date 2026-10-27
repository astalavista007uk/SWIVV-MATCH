# Improvement roadmap

Ranking basis: user impact → trust & safety → business impact → effort. No item is recommended merely because a competitor has it.

## P0 — before anyone else sees the site

| ID | Action | Why | Effort | Depends on |
|---|---|---|---|---|
| P0-1 | Apply the two pending migrations (`20261025000000_swivv_email_log_diag.sql`, `20261029000000_swivv_profile_privacy.sql`), then redeploy `main` | Hidden profiles are readable by every logged-in member at the API level (confirmed live; UI now filters them client-side as a stopgap); email log writes fail with 42703 and stay `queued` | S (minutes) | **Blocked**: no DB password / Supabase access token on this machine. Paste both files in the SQL Editor, or set `SUPABASE_ACCESS_TOKEN` and run `supabase db query --linked -f <file>` |
| P0-2 | Point `swivvmatch.com` DNS at Vercel and add the domain in the project; redeploy | Domain returns NXDOMAIN; only a stale `swivv.vercel.app` build is live | S | Registrar + Vercel |
| P0-3 | Add an authenticated RLS regression check: as member A, `select * from swivv_profiles` must not return member B when B set `profileHidden` | The bug was introduced by a later permissive policy; it can silently regress again | S | **Partial**: `scripts/verify-seed.mjs` already performs exactly this check and currently fails; wire it into CI after P0-1 |
| P0-4 | Push the 40 uncommitted files (or revert them) after review | Working tree is dirty across routes, migrations and email templates; a deploy from this tree is unreviewable | S | Author review |

## P1 — trust and conversion

| ID | Action | Why | Effort | Depends on |
|---|---|---|---|---|
| P1-1 | Badge or remove the 23 `SWIVV_PROFILES` demo personas in discovery | Undisclosed fictional profiles on a trust-sensitive product; contradicts the site's own anti-fake-profile guide | S | — |
| P1-2 | Server-render `/inscription` step 1 (real `h1`, real copy, no "Chargement…" shell) | Primary conversion page currently ships 4.1 KB of empty HTML | M | — |
| P1-3 | Add Playwright with 6 smoke specs: signup, login, browse, like, open chat, send message | 139 unit tests but zero E2E; every regression today is found by hand | M | Test accounts |
| P1-4 | Introduce a test-account convention (`data.testAccount`, `data.testBatch`, `profileHidden: true`) + the provided seeder | Enables repeatable QA without polluting real discovery | S | **Done** — 15/15 accounts seeded, login verified, manifest at `secrets/` |
| P1-5 | Make photo verification a discovery gate (verified members first, or verified-only toggle) | Selfie badge is table stakes in 6/10 competitors; it is the cheapest anti-fake-profile control | M | Existing `swivv_verification` tables |

## P2 — quality and safety

| ID | Action | Why | Effort |
|---|---|---|---|
| P2-1 | Per-user rate limits on messages, likes, reports and translation calls | Code states plainly that only Supabase defaults exist | M |
| P2-2 | Enforce a 12-character minimum on signup (server-side) | Strength meter is advisory; 6-char passwords are accepted | S |
| P2-3 | Fix the `matches.tsx` non-code-split export warning | Console noise on every page + bundle bloat | S |
| P2-4 | Add `<h1>` to `/swipe` and `/matches`; fix heading order on `/messagerie` | Screen readers get no page heading; outline starts at `h2` | S |
| P2-5 | Mobile header: restore left gutter on the logo, collapse the three competing CTAs, make the category nav a single scrollable row | First brand element is clipped at 390 px; two rival primary CTAs | S |
| P2-6 | Replace the illegible mobile "Découvrir comment ça marche" text-over-photo with the desktop pill | Contrast failure on the hero | S |
| P2-7 | Add conversation starters (3 contextual prompts once a match exists) | Main drop-off after a match is the empty thread | M |

## P3 — differentiation

| ID | Action | Why | Effort |
|---|---|---|---|
| P3-1 | Show *why* a match scores 87 % (top 3 weighted criteria) | The scoring data already exists; this is the one thing no competitor does free | S |
| P3-2 | "Verified only" discovery filter | High-signal, cheap, matches Badoo's best feature | S |
| P3-3 | Auto-archive conversations unanswered for 14 days | Anti-ghosting, free — Meetic treats this as premium positioning | S |
| P3-4 | Persist the translation language inside `swivv_profiles.data` instead of `localStorage` | Currently per-device with no UI hint; JSONB needs no migration | S |
| P3-5 | Admin "Test accounts" filter (read-only list: badge, ID, name, age, city, email, completeness, status) | Only if the test-account convention is adopted; search on `/admin/users` may already suffice | S |
| P3-6 | Voice intro as first message | Differentiated and inclusive; voice pipeline already exists | M |

## Explicitly not recommended

- A paid tier or "credits": the 100 % free claim is the only defensible wedge (see benchmark §4) and its market value just went up after the eHarmony ruling.
- Copying eHarmony's paywall-on-contact or Tinder's dynamic pricing.
- Rewriting the matching algorithm: it is deterministic, tested and explainable — the gap is presentation, not maths.
- A custom date-picker, a design-system refactor, or an additional state library. None of the findings need them.
