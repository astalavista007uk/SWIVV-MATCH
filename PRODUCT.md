# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** French-speaking adults aged 18 and over who are looking for a serious relationship or marriage. They browse curated profiles, compare compatibility, verify their photos/identity, and expect a respectful, private, safety-conscious experience.

**Secondary:** adults using the same product with other stated intentions (the intent filter includes casual and other options), plus the internal moderation/support team operating the admin surfaces.

## Product Purpose

SWIVV MATCH is a French online dating and matchmaking platform for adults. It helps people meet around stated intentions, compare compatibility, and start contact only with consent. Success means a member finds a credible, compatible person nearby and can move from a match to a safe conversation without unsolicited messages, ads, or unnecessary identity collection.

## Positioning

Serious-first French dating with a visible compatibility score, verified photos and identity, and consent-gated contact requests (text, voice, files) instead of open unsolicited messaging. Privacy is part of the pitch: 18+ access, in-browser face matching for photo verification, no ad targeting, no data resale, and a free MVP.

## Operating Context

- **Geography and language:** France-first; the shipped UI is French, English, and Spanish. Prices, addresses, and legal copy are French (Paris address, CNIL/RGPD references).
- **Business model:** free at launch. Monetization is intentionally undecided; do not invent a paywall, premium tier, or pricing claim.
- **Core loop:** create an account with a date of birth and 18+ declaration → complete a structured profile → browse/filter or swipe → like or react → mutual like opens a match → send a contact request (text, voice, or files) → the recipient accepts or declines before messaging unlocks.
- **Trust and safety:** age declaration plus 18+ policy, selfie photo verification, optional identity badge, reporting/blocking, moderation tools, contact-request approvals, and rate/cooldown rules.
- **Environment:** responsive web, mobile-heavy usage, real-time match/notification events, Supabase auth/storage/Postgres, Vercel hosting, IONOS SMTP transactional email.

## Capabilities and Constraints

- **Accounts:** email/password and social sign-in (Supabase), age gate at signup, profile completion, multiple photos, language preference.
- **Profiles:** structured fields covering intent, relationship history, family, lifestyle, appearance, languages, interests, location, and values; public profile pages; profile statistics and progress views.
- **Discovery:** browse with category shortcuts (`Près de moi`, `En ligne`, `Mariage`, `Relation sérieuse`, `Nouveaux profils`, `Photos récentes`, `Profils populaires`), advanced search, filters, sorting, swipe deck, likes, and photo reactions.
- **Compatibility:** a weighted score over profile criteria (country, city, age, distance, marital status, intent, religion/practice, family values, languages, interests, etc.) with hard filters for gender/age/distance; the same score feeds cards, member pages, and match suggestions.
- **Contact requests:** a request must be accepted before a conversation unlocks; approved requests can open text, voice-note, and file/image channels according to the recipient's choices; declines have a cooldown.
- **Verification:** selfie/photo verification (in-browser face comparison where possible) and an identity badge for staff-reviewed documents; documents are not retained after the decision.
- **Communication:** in-app messaging with text, voice notes, images/files, read state, unread counts, blocking, reporting, and signed private media URLs.
- **Content and help:** how-it-works guide, FAQ, help center, safety guidance, blog, contact/support tickets, legal pages (terms, CGV, privacy, cookies, mentions légales, age verification, data privacy).
- **Admin:** moderation, reports, verification review, user lookup, announcements, analytics, health, fraud, and support surfaces.
- **Device reach:** responsive web. No native app is confirmed; store badges on the marketing site say "Bientôt disponible" and must not be presented as shipped.
- **Data honesty:** the bundled example profiles are labeled demo data. They are not real members and must never carry real verification, online, or precise-distance signals.

## Brand Commitments

- **Name:** SWIVV MATCH (also "SWIVV" in the logo and shorthand).
- **Voice:** French, warm, direct, tutoiement ("Fais de belles rencontres", "Commence à Swivver", "Parlons-nous"), with concrete safety language.
- **Fixed tagline:** "Your Match. Your Story." is an intentional English brand line; keep it fixed. Everything around it (UI copy, placeholders, forms) should be properly localised.
- **Logo and palette:** heart/S mark; hot pink `#e60050` (UI token `--primary`, oklch(0.583 0.251 12)); black, white, and cool grey supports.
- **Typography:** Nunito for display and body, heavy weights for headlines.
- **Commercial commitments:** no advertising, no data resale, free at launch, 18+ only.
- **Address:** SWIVV MATCH, 10 Rue Thureau Dangin, 75015 Paris, France. Contact: contact@swivvmatch.com.

## Evidence on Hand

- Working TanStack Start codebase with real Supabase auth, profiles, likes, matches, contact requests, messaging, verification, moderation, and admin surfaces.
- Real Supabase accounts and profiles exist; the product also ships 23 demo profiles, now explicitly labeled "Démo" and stripped of verification/online/distance signals.
- Real editorial and support content: how-it-works guide with localized illustrations, FAQ, help center, safety articles, blog posts, and the full legal set.
- **Absences:** no verified press, customer logos, benchmark data, or real testimonial inventory is confirmed. Do not fabricate social proof, ratings, member counts, or testimonials.

## Product Principles

1. **Trust is the product.** Verification, consent-gated contact, moderation, and honest labels outrank growth tactics.
2. **Serious intent first.** The brand, discovery, and copy lead with lasting relationships while still letting members state other intentions.
3. **Consent before conversation.** Nobody receives unsolicited messages; a contact request must be accepted.
4. **Collect the minimum.** Verify adulthood and authenticity without stockpiling identity documents or sensitive data.
5. **French clarity.** Plain, warm French; no jargon, no untranslated template copy, no dark patterns.

## Accessibility & Inclusion

A broad adult audience, including mobile and older users. WCAG AA is the working target, not yet verified: a November 2026 audit found contrast, tap-target, signup-label, and modal-focus issues that remain open.
