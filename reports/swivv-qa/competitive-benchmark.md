# Competitive benchmark — SWIVV MATCH

Researched 2026-10-24 from public marketing pages, help centres, public App Store listings and press releases. No login or paywall was bypassed.
**Caveat:** swipe-app pricing is dynamic by country/age/term; only figures shown on a public listing are reported. Items marked *(unverified)* could not be confirmed on an official page.

## Comparison

| Brand | Positioning | Free tier reality | Paid tier (public price) | Signup friction | Matching | Verification |
|---|---|---|---|---|---|---|
| **Match.com** | Relationship-minded, broad 30+ | Chat with **every match**, 50 ratings/day | Bronze→Diamond, price in-app | Email | No published score; Core Values, intentions | Phone badge, block/report |
| **eHarmony** | Marriage / long-term | Likes + browse; **photos blurred, messaging limited** | 6/12/24 mo, price post-quiz | Email + long quiz (80 q — *unverified*) | **Published Compatibility Score** | Not documented (*unverified*) |
| **POF** | Mass-market, free-first | Search, Like, **message mutual matches**, unlimited replies | Plus/Premium/Prestige; US App Store $19.99/wk, $29.99/mo | Email, short onboard | No score | Not documented (*unverified*) |
| **Meetic** | French serious dating, 30+ | Browse, **free chat with mutual matches**, 6 results/page | Essentiel/Premium/Prestige; FR App Store €24.99/wk → €79.99/6 mo | Email | "Profils compatibles", no number | **Free video-selfie badge**, all photos moderated |
| **Muslima** | Muslim matrimony, faith-first | Browse/Like; **cannot initiate to non-paying** | Gold/Platinum; $35.99–$40.99/mo | Email, ~30 s | "Advanced matching", opaque | Not documented (*unverified*) |
| **Tinder** | Mainstream casual 18–34 | Capped likes, match, chat | Plus/Gold/Platinum, dynamic | Phone/social (*unverified*) | Behavioural ranking, no number | Photo + ID badge; **mandatory Face Check** in CA + 7 countries (2025) |
| **Bumble** | Women-first, respectful | Swipe/match/chat, limited likes | Boost/Premium/Premium+ | **Phone mandatory** | No score | **Photo verification mandatory in USA** |
| **Hinge** | "Designed to be deleted", 25–35 | ~8 likes/day (*unverified*), 1 incoming like | Hinge+/HingeX | Phone/email (*unverified*) | ML "your type", no published score | Selfie badge; Face Check in some regions |
| **Badoo** | Global mass-market, casual | Browse, swipe, message matches, credits | Premium/Extra; $5.99–$8.99 | Phone/email (*unverified*) | No score | 3-step photo verification, **verified-only mode** |
| **OkCupid** | Progressive, question-based | **Unlimited messaging with matches**, Intros | Premium/Premium+/Incognito | Email/phone (*unverified*); 15-question minimum | **Published Match %** with dealbreakers | Not documented (*unverified*) |

Sources: match.com/singles/start-dating-online-for-free-with-match · help.match.com/hc/en-us/articles/6241306373403 · eharmony.com/tour/faq/what-are-your-membership-options · help.pof.com/hc/en-us/articles/41811727204507 · meetic.fr/faq/inscription-et-1ers-pas/quelles-fonctionnalites-meetic-je-peux-utiliser-sans-prendre-dabonnement · meetic.fr/safety · muslima.com/en/general/termsofuse · tinderpressroom.com/2025-10-22-Tinder-to-Expand-Facial-Verification-Feature-Across-the-U-S-,-Setting-a-New-Standard-for-Dating-Safety · support.bumble.com/hc/en-us/articles/28949738572829 · help.hinge.co/hc/en-us/articles/360010947994 · badoo.com/the-blog/how-to-verify-your-profile-on-badoo · okcupid-app.zendesk.com/hc/en-us/articles/23178378006811 · okcupid-app.zendesk.com/hc/en-us/articles/22770910347803

## 1. Features that are now table stakes — do not market as unique

- Selfie/photo-verification badge (Match, Meetic, Tinder, Bumble, Hinge, Badoo).
- Block + report on every profile and message.
- Free messaging **with matches** (Match, Meetic, POF, OkCupid — at least conditionally).
- Interest prompts / profile questions beyond photos.
- Basic discovery filters (age, distance, gender) plus one lifestyle axis.
- "See who likes you" as the paid hook.

Claiming any of these as a differentiator will read as noisy at best, dishonest at worst.

## 2. What SWIVV MATCH already does well

- **Everything free, no paywall at all** — none of the 10 offers that; even POF and OkCupid gate visibility or likes.
- **Published, weighted compatibility percentage** with explainable criteria (`src/lib/match-score.tsx`, covered by tests). Only eHarmony and OkCupid publish a number; SWIVV's is transparent instead of opaque.
- **Voice messages and photo attachments** inside messaging — table stakes on mobile apps, genuinely uncommon on a web-first dating site.
- **French-first moderation surface** (17 admin routes, staff roles, audit log, fraud/health consoles) — more operational maturity than most French niche sites.
- Verified email templates, notification centre and progress feature already shipped.

## 3. Missing or incomplete — materially hurts the experience

| Gap | Why it matters | Reference |
|---|---|---|
| No mandatory photo verification before discovery | Fake-profile risk is the #1 trust killer in dating; selfie badge is now standard in 6/10 competitors | Meetic, Tinder, Bumble, Badoo |
| Demo personas mixed with real members | Contradicts the product's own anti-fake-profile guidance | — |
| No "who liked me" surface for the recipient | Free likes with no reciprocal signal produces silence; this is why competitors monetise it | Tinder Gold, Bumble, Hinge |
| No conversation prompt / icebreaker | First-message paralysis is the main drop-off after a match | Hinge's comment-on-prompt |
| No anti-ghosting or inactivity handling | Dead threads make the product feel empty | Meetic auto-archive (7 days) |
| No verified-only discovery filter | Cheap, high-signal safety control | Badoo |
| No mobile app / PWA install prompt | 8/10 competitors are app-first; the mobile web hero already mimics an app | — |

## 4. Differentiators aligned with "100% free"

1. **"You never pay, and we show you the maths."** Combine free messaging with a compatibility score that lists the criteria that matched — nobody in this set does both. This is the only defensible wedge found.
2. **Verification-first free tier.** Make the selfie badge the default gate for discovery (Meetic already gives it free; nobody pairs it with a transparent score).
3. **Voice-first introductions.** Voice notes exist at SWIVV already; making a 20-second voice intro the default first message is hard for text-only competitors to copy cheaply and is inclusive of low-literacy/multilingual users.
4. **Anti-ghosting by design.** Auto-archive unanswered conversations after N days, free — Meetic treats this as a differentiator, SWIVV can ship it in a week.

## 5. Solo-founder-sized opportunities

| Opportunity | Effort | Why it fits |
|---|---|---|
| Verified-only filter | S | One boolean on an existing verification table |
| Match explanation ("pourquoi 87 %") | S | The criteria scores already exist; render the top 3 contributors |
| Comment-on-prompt likes | M | Reuses the existing profile prompts + chat |
| Auto-archive dead threads | S | Cron + a flag, no schema redesign |
| "Profile of the day" email | S | Email templates + log already exist |
| Public trust page (photo-verification stats) | S | Marketing page, no infra |

## 6. Regulatory / market signal worth acting on

- eHarmony was found by the Federal Court of Australia (25 Aug 2026) to have engaged in misleading conduct about "free" dating, auto-renewal and pricing (`accc.gov.au/media-release/court-finds-eharmony-engaged-in-misleading-conduct-in-relation-to-automatic-renewal-and-pricing-of-its-subscriptions`). A genuinely free product has a rare, time-limited credibility window — but only if the free claim is literally true in the UI.
- Tinder expanded mandatory Face Check (Oct 2025) and Bumble mandates verification in the USA: verification is becoming a baseline expectation, not a premium feature.

## 7. Do not copy

- eHarmony/Muslima's paywall-on-contact model.
- Tinder's dynamic pricing per user.
- Any competitor's copy, illustrations or brand assets. Feature parity is fair; presentation must stay SWIVV's.
