# Design

<!-- impeccable:design-schema 1 -->

The incumbent visual world, reverse-engineered from `src/styles.css`, the shadcn/Radix component layer, and the surfaces in `src/routes` and `src/components`.

## Platform

web (responsive, PWA). Mobile-first marketplace with a fixed bottom nav on small screens and a desktop top nav; dark mode supported.

## Color

oklch token system. Light values in `:root`, dark overrides in `.dark`; both registered in `@theme inline` so Tailwind utilities (`bg-*`, `text-*`, `fill-*`, `/opacity` modifiers) resolve.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.129 0.042 264.7)` | Page |
| `--foreground` | `oklch(0.18 0.01 220)` | `oklch(0.984 0.003 247.9)` | Body text |
| `--primary` | `oklch(0.52 0.09 200)` ≈ `#436a81` | `oklch(0.929 0.013 255.5)` | Brand accent, CTAs, links |
| `--primary-foreground` | white | dark | On primary |
| `--muted-foreground` | `oklch(0.45 0.02 220)` | `oklch(0.704 0.04 256.8)` | Secondary text |
| `--destructive` | `oklch(0.6 0.22 25)` | `oklch(0.704 0.191 22.2)` | Errors, destructive actions |
| `--success` | `oklch(0.52 0.14 152)` | `oklch(0.7 0.16 152)` | Positive status, completed, verified |
| `--warning` | `oklch(0.62 0.15 55)` | `oklch(0.75 0.15 65)` | Pending, disputes, alerts |
| `--danger` | `oklch(0.55 0.22 27)` | `oklch(0.7 0.19 22)` | Lost/urgent, cancel, decline |
| `--info` | `oklch(0.55 0.15 240)` | `oklch(0.7 0.15 240)` | Informational, escrow, accepted |
| `--card` / `--popover` / `--border` / `--input` / `--ring` | see styles.css | | Surfaces |

**Status badge convention:** `bg-<token>/15 text-<token>` (e.g. `bg-success/15 text-success`). This is the single canonical pattern for status pills; it auto-adjusts in dark mode.

### Open decision — brand color

The UI `--primary` token is a muted steel-cyan (`oklch(0.52 0.09 200)` ≈ `#436a81`). The transactional email system (`src/lib/email-templates.ts`) and invoice HTML (`src/lib/invoice.ts`) use a more saturated teal (`#0d9488`). The `theme-color` meta now matches the UI token. **Reconciling the email/invoice palette to the UI primary (or vice-versa) is an open visual decision requiring browser/email-client review** — it should not be done blind.

## Typography

- **Faces:** Nunito (400–900), loaded from Google Fonts, registered as `--font-sans` and `--font-display`. Used for both display and body.
- **Base:** 15px / 1.55, weight 400, tracking -0.005em.
- **Headings:** weight 800–900, tight tracking (-0.02 to -0.03em), fluid H1/H2 via `clamp()`.
- **Links:** weight 600, primary color, underline on hover.

## Spacing & Shape

- `--radius` 0.5rem base, scaled `sm → 4xl` via the token ladder.
- Containers capped at `max-w-6xl` with `px-4`.
- Card default: `rounded-xl`/`rounded-2xl`, `border border-border`, `bg-card`, soft shadow on hover.

## Motion

- Transitions on color/shadow/transform for hover feedback; `group-hover:scale-105` on card imagery; Radix entrance/exit animations via `tw-animate-css`.
- **Reduced motion:** a global `@media (prefers-reduced-motion: reduce)` block collapses transition/animation durations to ~0 while preserving state changes. Loading indicators remain visible (static).

## Iconography

Lucide React, single stroke weight, `aria-hidden="true"` on decorative icons. Paw motif (`PawPrint`) for the brand mark and map markers.

## Components

shadcn/ui (Radix primitives) in `src/components/ui/*` — dialog, sheet, popover, select, radio-group, checkbox, dropdown-menu, etc. Custom marketplace components in `src/components/*` (`ListingCard`, `BookingForm`, `ServicesMap`, `SiteHeader`, `BottomNav`, `ChatWidget`, `HeartButton`, `ProfileAvatar`).

## Layout patterns

- **Public landing:** split hero (provider-first / owner-search), earnings strip, services grid, feed, how-it-works, pricing, trust + testimonials.
- **Browse:** split list/map (desktop) with view toggle; list/map toggle (mobile); filter bottom-sheet on mobile.
- **Category pages:** shared `ListingLayout` (header + cross-links).
- **Detail:** photo gallery (`profile-blocks`), booking form, contact panel, reviews.
- **Account:** dashboard (tabbed), bookings, orders (service + pet), earnings, payments, messages, profile, settings.

## Known token-debt

- A handful of decorative gradient CTAs in the dashboard (`from-amber-500 to-orange-500`, `from-red-500 to-rose-500`) still use raw palette stops by design; migrate only if the gradient is dropped.
- Facebook OAuth buttons intentionally use the Facebook brand blue `#1877F2`.
- Photo-overlay remove buttons use `bg-black/50 text-white` (always on imagery, theme-independent) — correct as-is.
