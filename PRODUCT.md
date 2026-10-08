# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary audiences, plus two situational ones:

1. **Pet owners** — seeking trusted, bookable care for their animals (sitting, walking, boarding, daycare, grooming, drop-in visits, veterinary). They browse providers, compare reviews and ratings, message, book, pay securely, and leave reviews. Many are busy working owners or travellers who need recurring or last-minute care.

2. **Service providers** — pet sitters, dog walkers, groomers, boarders, daycare operators, and vets offering care for pay. They create listings, set prices and availability, manage bookings, communicate with owners, receive payouts, and build reputation. Some are individuals (a student walking dogs); others are small businesses (a grooming salon or clinic).

3. **People rehoming pets** — owners/sellers listing pets for sale or adoption, with offer/buy/adoption flows and secure handoff.

4. **People with lost pets** — owners posting lost-pet alerts and finders reporting found pets, sharing printable flyers and claims with proof photos.

## Product Purpose

PET BASE is a two-sided marketplace that connects pet owners who need care with vetted providers who offer it — across the full spectrum of pet services (sitting, dog walking, grooming, drop-in visits, daycare, boarding, veterinary) — and also supports pet sales/adoption and a lost-and-found pet network. Success means a owner reliably finds and books a trustworthy caregiver nearby, and a provider reliably fills their schedule with secure, paid work.

## Positioning

A single hub for *all* pet-care needs — not just dog walking or just sitting — combining service booking, secure escrow payments, in-app messaging, reviews, plus adjacent pet life events (pets for sale/adoption, lost-and-found). Trust signals (ID-verified providers, insured bookings, reviews/ratings) and a provider-first earnings story (transparent fees, keep ~82%, no tip cut) differentiate it from single-category apps.

## Operating Context

- **Geographic focus:** France-first (€ pricing, Paris/regional addresses), designed to expand. Multilingual (English, French, Spanish, Italian, Portuguese, German, Dutch, Chinese, Japanese, Arabic) for residents and tourists.
- **Booking model:** request-and-confirm with provider acceptance, escrow-style secure payments, booking fees, dispute resolution, and reviews after completion.
- **Provider flow:** onboarding wizard sets service categories and details; dashboard manages listings, availability, and earnings.
- **Trust & safety:** profile verification, insured-booking messaging, report-animal-abuse reporting, support handoff (AI chat → human).
- **Payment/routing:** Supabase backend, Stripe Connect for provider payouts, currency switching for display.
- **Reach:** responsive web app with PWA support (installable, push notifications, service worker).

## Capabilities and Constraints

- **Service categories:** pet sitting, dog walking, grooming, boarding, daycare, drop-in visits, veterinary, pets for sale/adoption.
- **Booking engine:** per-service pricing (per hour/day/night/visit/flat), date ranges vs. time slots, per-pet multipliers for eligible services, working-hours-aware slot generation, unavailable-date blocking.
- **Marketplace mechanics:** favorites, reviews/ratings, in-app messaging with attachments, offers/negotiation for pet sales, pickup-code handoff, escrow hold and release.
- **Lost-and-found:** alert posting with photos/reward, found-pet claims with proof, printable flyer generation, social sharing, reunion marking.
- **Internationalization:** 10 languages including right-to-left Arabic; client-side language detection with persistence.
- **Theming:** light/dark mode via CSS custom properties (oklch), token-driven.
- **Technical constraints:** TanStack Start (React 19) + Vite, Supabase (auth incl. Facebook OAuth, Postgres, storage), Tailwind CSS v4 + Radix UI (shadcn), Leaflet/OpenStreetMap maps, deployed via Cloudflare/Wrangler. *(Branding currently splits between teal `#0d9488` in browser meta + transactional emails and a cyan `oklch(0.52 0.09 200)` primary token in the UI — to be reconciled.)*

## Brand Commitments

- **Name:** PET BASE (final, used in header, emails, and meta).
- **Logo motif:** a paw print, used in the header mark and map markers.
- **Voice (inferred from copy):** warm, trustworthy, lightly playful ("paw-some", paw motifs), reassuring about safety and transparency.
- No other binding visual constraints confirmed; the incumbent token system may be reconciled and documented.

## Evidence on Hand

- Working TanStack Start codebase with real Supabase integration, booking/payment/escrow domain logic, and provider/owner flows.
- Incumbent visual implementation (tokens in `src/styles.css`, shadcn/Radix components, i18n strings).
- Transactional email templates (`src/lib/email-templates.ts`) and invoice HTML (`src/lib/invoice.ts`).
- **Absences:** no real provider/review inventory yet — browse currently blends hardcoded demo data (`src/lib/home-feed-data.ts`) with live DB results; future work must not present fabricated listings as real bookable providers.

## Product Principles

1. **Trust is the product.** Verification, insured bookings, reviews, and transparent dispute resolution must be visible and credible — a marketplace for live animals fails without trust.
2. **One hub for the whole pet.** Cover every care need and adjacent life event (care, sale/adoption, lost-and-found) rather than fragmenting across single-purpose apps.
3. **Provider-first sustainability.** Transparent earnings, fair fees, and reliable payouts attract the supply that makes the marketplace work.
4. **Calm and clear over clever.** Booking, payment, and handoff involve money and living animals — flows must be legible, low-anxiety, and hard to get wrong.
5. **Local and multilingual by default.** France-first but built for residents and visitors of many languages, with location-aware discovery.

## Accessibility & Inclusion

- Public marketplace serving a broad general audience, including older pet owners and users on mobile devices — accessibility (WCAG AA target) and mobile responsiveness are product requirements, not polish.
- Multilingual including right-to-left (Arabic); RTL layout correctness must be maintained.
