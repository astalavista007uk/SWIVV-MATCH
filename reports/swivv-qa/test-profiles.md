# Synthetic test profiles — batch `qa-2026-10`

**Status: SEEDED on 2026-10-24** (15/15 accounts). No email was sent (`email_confirm: true`). Passwords are only in the private manifest.
Seeded into the Supabase project referenced by `.env`, which appears to be production — approved by the project owner in session.

## Inventory (15 personas, all fictional, all adults)

| ID | Prénom | Âge | Ville | Genre → recherche | Intention | Langues | Photos | Complétude | Cas de test visé |
|---|---|---|---|---|---|---|---|---|---|
| t01 | Camille | 24 | Paris | femme → homme | Relation sérieuse | fr | 3 | complète | profil de référence, tranche 20–29 |
| t02 | Hugo | 27 | Lyon | homme → femme | Relation amoureuse | fr, en | 3 | complète | bilingue, tranche 20–29 |
| t03 | Inès | 31 | Marseille | femme → homme | Mariage | es, fr | 3 | complète | langue maternelle ≠ UI, matching interculturel |
| t04 | Thomas | 34 | Bordeaux | homme → femme | Relation sérieuse | fr | 2 | partielle | peu de photos |
| t05 | Nadia | 38 | Lille | femme → homme | Mariage | ar, fr | 2 | bio courte | bio minimale |
| t06 | Karim | 41 | Toulouse | homme → femme | Relation sérieuse | fr, ar | 3 | complète | tranche 40–49 |
| t07 | Élise | 45 | Nantes | femme → homme | Relation amoureuse | fr | 3 | complète | tranche 40–49 |
| t08 | Marc | 48 | Strasbourg | homme → femme | Mariage | fr, de | 3 | champs optionnels vides | tolérance aux données manquantes |
| t09 | Sofia | 52 | Nice | femme → homme | Relation sérieuse | pt, fr | 3 | complète | tranche 50–59 |
| t10 | Patrick | 57 | Marseille | homme → femme | Relation amoureuse | fr | 1 | minimale | photo unique = cas limite UI |
| t11 | Monique | 63 | Lyon | femme → homme | Relation amoureuse | fr | 3 | complète | tranche 60–69 |
| t12 | André | 66 | Toulouse | homme → femme | Mariage | fr | 2 | partielle | tranche 60–69 |
| t13 | Léa | 22 | Paris | femme → femme | Relation amoureuse | fr, en | 3 | complète | `seeking` non opposé au genre |
| t14 | Yann | 29 | Nantes | homme → homme | Relation sérieuse | fr | 3 | complète | `seeking` non opposé au genre |
| t15 | Amina | 36 | Bordeaux | femme → homme | Mariage | ar, fr, en | 3 | complète | trilangue, tranche 30–39 |

Coverage check: 9/9 requested cities; all five age bands; `gender`/`seeking` limited to the two values the schema supports (`"woman" | "man"`) — no unsupported category was invented.

## Fields used (actual `SwivvProfile` shape, `src/lib/swivv-data.ts`)

`id, name, age, gender, city, country, distanceKm, photo, photos, tagline, bio, occupation, education, heightCm, weightKg, hairColor, eyeColor, bodyStyle, ethnicity, selfAppearance, bestFeature, drink, smoke, drugs, eatingHabits, haveChildren, childrenCount, wantMoreChildren, employmentStatus, annualIncome, livingSituation, willingToRelocate, hasPets, nationality, firstLanguage, otherLanguages, religiousValues, familyValues, maritalStatus, religion, lookingFor, seeking, interests, languages, online, joinedAt, lastActive, compatibility, verified`

## Isolation mechanism

Each seeded row gets three extra keys inside the existing `data` JSONB blob — **no migration required**:

| Key | Value | Purpose |
|---|---|---|
| `testAccount` | `true` | machine-detectable flag for admin filters and future guard clauses |
| `testBatch` | `qa-2026-10` | lets a whole batch be found/deleted in one query |
| `profileHidden` | `true` | reuses the existing "Masquer mon profil" flag so real members do not see them in `/browse` |

Cleanup is one statement: `delete from public.swivv_profiles where data->>'testBatch' = 'qa-2026-10';` (auth users cascade via `on delete cascade` when removed with `admin.deleteUser`; the seeder prints the exact IDs).

**Caveat:** `profileHidden` only hides at the UI layer today — see FT-06. Until P0-1/P0-3 land, a logged-in user could still read these rows with a crafted query. They contain no real data, so the exposure is cosmetic, but it is the same defect that hides real members.

## Photos

Reused from the project's existing seed set (`src/lib/swivv-data.ts`, Unsplash URLs already used on the homepage): **no new asset was downloaded**, nothing scraped, no dating-site photos, no minors.
Limitation: Unsplash images depict real people under the Unsplash licence, not synthetic identities. If likeness risk matters for marketing screenshots, regenerate the set with a synthetic-face tool or use neutral avatars — that is the only part of the brief this batch cannot satisfy without generating new assets.

## Credentials

Generated at seed time by `scripts/seed-test-profiles.mjs`:

- One random 24-byte password per account (`base64url`).
- Manifest: `secrets/test-credentials-qa-2026-10.json` (git-ignored, POSIX mode `0600` where supported).
- Passwords are never printed to stdout, never logged in the app, never committed.
- Admin users page receives no plaintext password.

## How to seed (after approval)

```bash
# dry run — prints the plan, writes nothing
bun scripts/seed-test-profiles.mjs

# real run — explicit double opt-in
SWIVV_TEST_SEED=1 bun scripts/seed-test-profiles.mjs --apply
```

Prerequisites: the two pending migrations applied (P0-1), and `SUPABASE_SERVICE_ROLE_KEY` present in `.env`. The script uses `email_confirm: true` so **no email is ever sent** and no mailbox is needed.

## Seed run — verified

| Check | Result |
|---|---|
| Accounts created | 15/15 (`auth.users` + `swivv_profiles` row each) |
| Password sign-in (t01) | **OK** — session returned, `auth.uid` matches manifest |
| Own profile row readable | **OK** — `data.name = "Camille"` |
| Rows tagged `testBatch=qa-2026-10` | **15** |
| Emails sent | **0** |
| Manifest | `secrets/test-credentials-qa-2026-10.json` — exists, git-ignored, mode 0600, 15 entries |
| Hidden flag respected by RLS | **NO** — t01 sees 18 other rows, 14 of them `profileHidden: true` (confirms FT-06 live) |

### Account IDs (non-sensitive; passwords stay in the manifest)

| ID | Prénom | `user_id` |
|---|---|---|
| t01 | Camille | `83525bc8-3a0f-4664-8216-240debe0ee59` |
| t02 | Hugo | `4e9d4322-ee97-4d4e-bb92-fed981788cb4` |
| t03 | Inès | `fe94c321-c733-41e2-a3c4-156cf910680d` |
| t04 | Thomas | `caeb011d-b590-4773-8709-40b8dbdac8a9` |
| t05 | Nadia | `a96a5757-0312-490f-9b09-8a6ebd34e738` |
| t06 | Karim | `b10bb70e-2e90-4bcb-bed1-9eb52b6da92a` |
| t07 | Élise | `8e1ab781-79fa-4571-b3c1-20ecb0f0ced4` |
| t08 | Marc | `7c3341aa-c893-4446-983e-7247c72efa03` |
| t09 | Sofia | `320fa6f8-fcd3-4838-8598-49b0e8df1e44` |
| t10 | Patrick | `961e1d43-dca7-453d-a15e-65336c8b94f2` |
| t11 | Monique | `5907053f-b88d-4acf-9b09-9b3f67898ef0` |
| t12 | André | `dd4154ed-5844-487e-8ef1-c8b0aa38fee6` |
| t13 | Léa | `250a46f3-8f06-4338-a623-39424309c46e` |
| t14 | Yann | `916088de-0d91-41df-87c4-9ec10a06faf8` |
| t15 | Amina | `e29a00b4-0b55-4552-88fa-5f093844b759` |

Email pattern: `swivv-qa-2026-10-t01@example.com` … `-t15@example.com` (reserved domain, no mailbox).

Re-verify any time: `bun scripts/verify-seed.mjs` (reads the manifest, prints counts only, never passwords).

Cleanup: delete profiles where `data->>'testBatch' = 'qa-2026-10'`, then delete the 15 auth users (IDs above).