---
name: SWIVV MATCH
description: French serious-first dating with consent-gated contact.
colors:
  editorial-magenta: "oklch(0.583 0.251 12)"
  stage-black: "#101014"
  ink: "oklch(0.18 0.01 220)"
  paper: "oklch(1 0 0)"
  mist: "oklch(0.96 0.005 220)"
  hairline: "oklch(0.92 0.005 220)"
  muted-ink: "oklch(0.45 0.02 220)"
  success: "oklch(0.52 0.14 152)"
  warning: "oklch(0.62 0.15 55)"
  danger: "oklch(0.55 0.22 27)"
  info: "oklch(0.55 0.15 240)"
typography:
  display:
    fontFamily: "Nunito, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Nunito, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Nunito, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.005em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "20px"
  4xl: "24px"
  panel: "26px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.editorial-magenta}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "12px 18px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  input-text:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  card-profile:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "0"
  badge-demo:
    backgroundColor: "{colors.stage-black}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: SWIVV MATCH

## Overview

**Creative North Star: "The Confident Introduction"**

SWIVV is a warm, direct, editorial dating product. Real portraits sit on a black stage; hot pink arrives only where the product wants a decision — the headline, the primary CTA, the compatibility number. The tone is French, adult, and self-assured: it speaks in tutoiement, shows real faces, and never begs. Serious intent is the posture, not a lecture.

The system is intentionally thin and token-driven. Nunito carries both display and body with a heavy, tight headline voice; surfaces are calm white and cool grey, separated by hairlines rather than heavy shadow. The one theatrical surface is the marketing hero: a tilted photo wall, a black stage, and a story card. Everything inside the product gets quieter so profiles and compatibility can lead.

**Key Characteristics:**
- Pink is a scarce accent, not a wash.
- Black stages marketing; white and cool grey carry the product.
- Heavy Nunito headlines over a 15px body.
- Soft, tactile cards with hairline borders and restrained hover lift.
- Real portraits are the primary imagery; no abstract illustration layer.

## Colors

An editorial pink on a black-and-paper base, with cool grey supports and semantic status tokens.

### Primary
- **Editorial Magenta** (`oklch(0.583 0.251 12)`, ≈ `#e60050`): primary CTAs, active states, score numbers, links, focus rings, and the one accent line in the legal hero. It should feel decisive, not decorative.

### Neutral
- **Stage Black** (`#101014`): marketing hero, site header, and the footer's dark band.
- **Ink** (`oklch(0.18 0.01 220)`): primary text on paper.
- **Paper** (`oklch(1 0 0)`): page and card background.
- **Mist** (`oklch(0.96 0.005 220)`): secondary surfaces, muted blocks, disabled fills.
- **Hairline** (`oklch(0.92 0.005 220)`): borders, dividers, inputs.
- **Muted Ink** (`oklch(0.45 0.02 220)`): secondary text; use this, never raw `#999`, where small text must stay legible.

### Status
- **Success** (`oklch(0.52 0.14 152)`), **Warning** (`oklch(0.62 0.15 55)`), **Danger** (`oklch(0.55 0.22 27)`), **Info** (`oklch(0.55 0.15 240)`): status pills and feedback only, using the `bg-<token>/15 text-<token>` pattern.

### Named Rules
**The 10% Pink Rule.** Editorial Magenta covers no more than ~10% of any screen. Its rarity is what makes a CTA or a score read as important.

**The AA Muted Rule.** Small secondary text uses the muted-ink token (≈4.5:1 on paper) or darker. Raw `#999` and `#777` are retired for text.

## Typography

**Display Font:** Nunito (with system sans fallbacks)
**Body Font:** Nunito (with system sans fallbacks)
**Label Font:** Nunito, 600

**Character:** One humanist sans doing both jobs, with weight and tracking creating the hierarchy. Headlines are heavy and tight; body text is calm and open.

### Hierarchy
- **Display** (900, `clamp(2rem, 4.5vw, 3rem)`, 1.15): hero and page H1; tracking -0.03em.
- **Headline** (800, `clamp(1.5rem, 3vw, 2rem)`, 1.15): section H2; tracking -0.02em.
- **Title** (700, 1.25rem, 1.15): card and panel H3; tracking -0.015em.
- **Body** (400, 0.9375rem, 1.55): default reading size; max width 65–75ch on long copy.
- **Label** (600, 0.875rem, 1.4): form labels, metadata, and small controls.

### Named Rules
**The One Family Rule.** Nunito is the family. Do not introduce a display serif or a second sans; change weight and tracking instead.

## Layout

Marketing pages cap at `max-w-6xl` with `px-4`; legal and reading pages at `max-w-5xl`; contact at `max-w-3xl`; swipe at `max-w-md`. The rhythm is a 4 / 8 / 16 / 24 / 32 / 40 spacing ladder, with `py-8` to `py-12` between sections. Profile grids run 2 columns on mobile, 3 on small, 4–5 on desktop. The footer is a five-column grid on large screens and stacks to two on small. Mobile-first: the header wraps, the category bar scrolls or wraps, and primary actions stay full-width.

## Elevation & Depth

Tactile and confident, not glossy. Paper surfaces sit flat with a hairline border; depth appears as a response to state — a soft hover lift and a low, wide shadow on cards. The marketing hero is the exception: it uses a black stage, a gradient scrim, and drifting photo strips to create atmosphere. No glassmorphism, no heavy drop shadows, no nested floating panels.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04)`): subtle separation from the page.
- **Card hover** (`box-shadow: 0 14px 30px -16px rgba(0,0,0,0.22)`): profile and content cards on hover.
- **Legal card** (`box-shadow: 0 1px 1px rgba(0,0,0,0.03), 0 14px 30px -16px rgba(0,0,0,0.18)`): the shared legal page card.

### Named Rules
**The Response-Only Rule.** Surfaces are flat at rest. Shadows appear on hover or to separate a floating layer; they are never the default decoration.

## Shapes

Rounded, friendly, never pill-shaped by default. The base radius is 8px (`--radius: 0.5rem`), scaling to 12px for inputs and small cards, 16px for profile cards, 20–24px for marketing panels, and 26px for the legal/profile panel language. Pills (`9999px`) are reserved for badges, chips, and the desktop hero CTA. Corners are consistent within a surface; no mixed radii on one card.

## Components

### Buttons
- **Shape:** 8px radius on product CTAs; full pill on the desktop hero and badges.
- **Primary:** Editorial Magenta fill, paper text, 12px 18px padding, weight 700.
- **Hover / Focus:** slight brightness lift on hover; a 2px magenta focus outline with offset. No shadow.
- **Secondary:** paper fill, ink text, hairline border, same radius and padding.

### Chips / Badges
- **Style:** `bg-<status>/15 text-<status>` for status; solid stage-black at 75% for the "Démo" label; white/10 pills on the dark hero.
- **State:** selected chips use a magenta tint (`bg-[#e60050]/10 text-[#e60050]`).

### Cards / Containers
- **Corner Style:** 16px profile cards, 24–26px marketing/legal panels.
- **Background:** paper; mist for grouped/secondary blocks; gradient white → mist → `#e8e8e8` for legal cards.
- **Shadow Strategy:** response-only (see Elevation).
- **Border:** 1px hairline; legal cards add a white/70 ring.
- **Internal Padding:** 12–16px for compact cards; 24px for legal cards; 40px horizontal on desktop panels.

### Inputs / Fields
- **Style:** paper fill, 1px hairline border, 8px radius, 10–12px padding, 14px label.
- **Focus:** magenta border plus a soft magenta ring; never remove the focus indicator.
- **Error / Disabled:** danger border and message near the field; disabled uses mist fill and muted ink.

### Navigation
- **Header:** stage-black band, paper logo and auth controls; wraps to two rows on mobile.
- **Category bar:** black band, white/pink links, wraps to multiple rows on mobile.
- **Footer:** mist band, five columns on desktop, 2 on small; link labels in ink, metadata in muted ink.

### Legal / Reading Card
The shared legal surface: gradient paper-to-mist card, 24px radius, 24px padding, tight heavy H2, 15px body at 1.6 line-height. Use it for policies, help articles, and long-form guidance so reading pages feel like one product.

### Score / Compatibility Number
Magenta, weight 700, 11–13px; always paired with the intent label. It is the product's signature data point and should stay visible wherever a match decision is shown.

## Do's and Don'ts

### Do:
- **Do** use the `--primary` token (Editorial Magenta) for every primary action, score, and focus ring.
- **Do** let real portraits and compatibility numbers carry the page; keep chrome quiet.
- **Do** use the shared legal card for long-form reading.
- **Do** keep "Your Match. Your Story." fixed as the English brand line.
- **Do** label example profiles as `Démo` and keep verification/online/distance signals off them.

### Don't:
- **Don't** introduce a teal, blue, or second accent; the `/swipe` teal is a defect to remove.
- **Don't** hardcode hex values in components when a token exists.
- **Don't** use raw `#999` or `#777` for small text; use the AA muted-ink token.
- **Don't** use heavy shadows, glass, or nested floating panels.
- **Don't** use English placeholders or untranslated template copy inside the French product.
