# UX / UI audit

Evidence: `evidence/*.png` (desktop 1440×900, mobile 390×844) and `evidence/public-pages.json`.
Screenshots are from the local dev server; typography and spacing render the same as production, bundle weight does not.
Not verified: colour-contrast ratios (no axe/Lighthouse run), keyboard-only traversal, screen-reader output, Safari/Firefox.

| ID | Route | Severity | Effort |
|---|---|---|---|
| UX-01 | all (mobile 390 px) | High | Small |
| UX-02 | `/`, `/inscription` (header) | Medium | Small |
| UX-03 | `/` (mobile hero) | High | Small |
| UX-04 | `/` (desktop + mobile CTA area) | Medium | Small |
| UX-05 | `/inscription` (mobile) | Medium | Small |
| UX-06 | `/inscription` | Medium | Small |
| UX-07 | `/` (category nav) | Medium | Medium |
| UX-08 | `/browse` | High | Medium |
| UX-09 | `/swipe`, `/matches` | Medium | Small |
| UX-10 | `/messagerie` | Low | Small |
| UX-11 | `/` (stats strip) | Low | Small |
| UX-12 | `/parametres` | Low | Small |

---

### UX-01 — Brand logo is clipped against the left edge on mobile
**Repro:** open `/` or `/inscription` at 390 px.
**Expected:** logo aligned with the page gutter used by everything else (~16 px).
**Actual:** the "SWIVV" wordmark starts at x = 0 and is cut by the viewport edge in both screenshots.
**Fix:** header container is missing `px-4` on the mobile variant (or uses full-bleed). One class.
**Severity:** High — it is the first brand element on every page.

### UX-02 — Header shows three competing actions
**Repro:** any page, mobile or desktop header.
**Expected:** one primary action per state.
**Actual:** on desktop, "S'inscrire | Se connecter" (outlined) sits next to "Créer mon profil" (solid). On mobile, an unlabelled circular arrow icon sits between the logo and "Créer mon profil". During signup (`/inscription`), the header still offers "Créer mon profil".
**Fix:** collapse to a single "Créer mon profil" + secondary "Se connecter" text link; hide the CTA on `/inscription`; give the icon button an accessible name (it has one, but it is not recognisable).
**Note:** "S'inscrire | Se connecter" is one button doing two jobs — a known conversion anti-pattern.

### UX-03 — "Découvrir comment ça marche" is illegible over the photo collage (mobile)
**Repro:** `/` at 390 px.
**Expected:** a visible secondary CTA with sufficient contrast.
**Actual:** dark text is drawn directly over the hero wall photos; at 390 px it overlaps the "Jasmine, 27" card and is hard to read. It also lacks a button outline/background, unlike its desktop counterpart which has a translucent pill.
**Fix:** reuse the desktop pill styles at mobile width.

### UX-04 — Hero story card pushes its own CTA below the fold (mobile)
**Repro:** `/` at 390 px, first paint.
**Expected:** the hero should show the primary action above the fold.
**Actual:** the portrait card is nearly full-viewport; its "S'inscrire | Se connecter" button is off-screen. Only the global CTA is visible.
**Fix:** cap the mobile card height (e.g. `max-h-[55vh]`), or drop the in-card CTA on mobile since the global CTA already exists.

### UX-05 — Date input uses a non-French placeholder
**Repro:** `/inscription` step 1, French Chrome with an `en-US` locale.
**Expected:** `jj/mm/aaaa`.
**Actual:** `dd/mm/yyyy`. The native `<input type="date">` placeholder follows the OS/browser locale, not the page language.
**Fix:** either accept it (native behaviour, zero code) or show a French hint label above the field. Do **not** replace the native picker with a library.
**Ponytail note:** cheapest correct fix is the hint, not a custom component.

### UX-06 — Large dead space above the signup question
**Repro:** `/inscription` at 390×844.
**Expected:** question near the top, progress visible.
**Actual:** the question starts around 45 % of the viewport height; the top half is empty. On small screens this reads as a loading/failed state.
**Fix:** `justify-start` + reduced top padding on the step container.

### UX-07 — Mobile category nav wraps into three rows
**Repro:** `/` at 390 px.
**Expected:** one scrollable row or a "Catégories" disclosure.
**Actual:** 8 categories wrap to 3 rows (third row holds a single item: "Photos récentes"), pushing the hero down ~130 px and consuming prime space.
**Fix:** `overflow-x-auto flex-nowrap` on mobile, or hide the nav behind the existing filter/sort control.

### UX-08 — Demo profiles are indistinguishable from real members
**Repro:** `/browse` while logged out; open any of the 23 seed personas.
**Expected:** either a "profil de démonstration" badge, or removal from discovery.
**Actual:** identical cards, identical profile pages, identical like/message affordances. This is the single biggest trust issue in the UI: the site's own guide teaches users to detect fake profiles, while the product ships 23 of them undisclosed.
**Fix:** badge them (`Démo`) and disable actions, or exclude `SWIVV_PROFILES` from discovery once enough real members exist.

### UX-09 — Login-gated pages have no page heading
**Repro:** `/swipe`, `/matches` while logged out.
**Expected:** one `<h1>` per page ("SWIVV SWIPE", "Mes matches").
**Actual:** no `h1` at all; the gate is a bare div. Screen-reader users get no page title announcement beyond the document title.
**Fix:** promote the existing visible heading text to `<h1>`.

### UX-10 — Heading order on `/messagerie`
**Repro:** `/messagerie` while logged out.
**Expected:** `h1` first.
**Actual:** outline is `H2 "Connexion requise"` → `H1 "Conversations (0 · 0 non lu)"` → `H2 "Tes messages t'attendent"`. The unread counter also reads "0 · 0 non lu" (duplicated zero).
**Fix:** render the gate before the shell, or make the gate an `h2` nested under the `h1`; simplify the counter label.

### UX-11 — Unfalsifiable stat
**Repro:** `/`, stats strip.
**Actual:** "∞ Possibilités de rencontres" next to "100% Gratuit" and "0 €". The infinity claim is decorative, not a claim a user can act on, and sits in a strip that otherwise looks like factual proof.
**Fix (Low):** replace with a real, checkable number (members, messages sent) or a qualitative phrase.

### UX-12 — "Langue" section is the only discoverable translation entry point
**Repro:** `/parametres`, Langue section.
**Actual:** copy now correctly says "Les messages de la messagerie et certains textes de profil peuvent être traduits vers cette langue." Behaviour is manual per message, and the setting is `localStorage`-only (per browser, not per account). Nothing in the UI tells the user it is per-device.
**Fix (Low):** add "(cet appareil)" to the label, or persist the choice in the profile row (it is already a JSONB blob — no migration needed).
**Ponytail note:** persisting in `swivv_profiles.data.lang` is a 3-line change and removes the device-only surprise.

---

## What is working well (do not regress)

- Homepage hero has a clear single `h1` and a strong, legible CTA on desktop.
- All tested pages: no images without `alt`, no unnamed buttons/links, no horizontal overflow at 390 px.
- Consistent dark/pink brand language; `/comment-ca-marche` and `/faq` have clean, deep heading outlines (`h1` → `h2` per section).
- Reduced-motion is handled globally in `src/styles.css`.
- Emails and in-app screens share the same palette and typography.
