# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production (runs prisma generate first)
npm run lint             # ESLint via Next.js

# Unit tests (Vitest)
npm test                 # Run all unit tests
npm run test:watch       # Watch mode
npx vitest run tests/lib/otp.test.ts   # Run a single test file

# E2E tests (Playwright, requires dev server running)
npm run test:e2e         # Run all E2E tests
npx playwright test tests/e2e/login.spec.ts  # Single E2E test

# Database
npm run db:push          # Sync Prisma schema to database
npm run db:generate      # Regenerate Prisma client
npm run db:studio        # Open Prisma Studio GUI
```

## Architecture

**Next.js 14 App Router** with TypeScript, Tailwind CSS, PostgreSQL (Supabase), and Prisma ORM.

### Route Groups
- `app/(auth)/` — Login and OTP verification pages (public)
- `app/(dashboard)/` — Protected user dashboard (server-rendered with async data fetching)
- `app/(legal)/` — Privacy policy and terms pages (public)
- `app/c/[slug]/` — Public shareable proposal card page
- `app/api/` — REST API routes with Zod request validation

### Business Logic (`lib/`)
All database operations go through typed functions in `lib/`, never raw Prisma queries in routes:
- `lib/auth/jwt.ts` — JWT signing/verification, session create/revoke/validate
- `lib/auth/otp.ts` — Email OTP generation and verification (auto-upserts user)
- `lib/profile/profile.ts` — Profile CRUD, slug/token generation, card activation
- `lib/connect/requests.ts` — Connection request lifecycle with notifications
- `lib/connect/messages.ts` — Messaging between approved connections
- `lib/sms/proxy.ts` — SMS masking via Twilio (privacy-preserving communication)
- `lib/email/resend.ts` — Email delivery (OTP + transactional)
- `lib/db.ts` — Prisma singleton (reused in dev, fresh in prod)

### Auth Flow
Email-only OTP authentication. JWT stored in httpOnly `session` cookie (7-day expiry). Middleware (`middleware.ts`) protects all routes except public paths. Sessions are dual-validated: JWT signature + DB session record (enables instant revocation).

### Key Patterns
- **Zod validation** on all API request bodies for runtime type safety
- **Fire-and-forget** for non-critical async ops (scan logging, notifications via `Promise.allSettled`)
- **Wali (guardian)** feature routes connection requests through a designated guardian contact
- **SMS masking** via Twilio Programmable Messaging for privacy between connections

## Testing

**Vitest** for unit tests (`tests/api/`, `tests/lib/`). Prisma client is fully mocked via `tests/__mocks__/db.ts`. External services (Resend, Twilio, jose) are mocked per-test with `vi.mock()`. Test setup in `tests/setup.ts` sets `JWT_SECRET` and `NODE_ENV=test`.

**Playwright** for E2E tests (`tests/e2e/`). Runs against the dev server (auto-started). Single worker, Chromium headless. Global setup in `tests/e2e/global-setup.ts`.

## Path Alias

`@/*` maps to the project root (e.g., `import { db } from "@/lib/db"`).

## Deployment

Deployed on Vercel with `output: "standalone"` in `next.config.mjs`. Environment variables configured via `.env.local` locally and platform secrets in production. See `.env.example` for required variables.

---

# PROJECTS.md — Active Project Briefs

**Load this file on every session startup, from any channel.**
**Keep it updated.** After any meaningful work session — new features, decisions, phase changes, blockers — update this file before closing out. Treat it like a living document, not a snapshot.

---

## Proposal Card

**What it is:**
A web app that lets users create a shareable personal/professional "proposal card" — essentially a polished public profile page accessible via a short URL or QR code. Think of it as a business card that links to a dynamic, self-hosted profile.

**Stack:**
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL on Supabase via Prisma ORM
- Resend (email OTP), Twilio Verify (phone OTP)
- `jose` for JWT sessions, Zod for validation
- Hosted/built via the workspace at `~/.openclaw/workspace/proposal-card/`

**Current Phase: 2 — Profile Builder + Communication Layer (in progress as of 2026-03-24)**

Phase 1 delivered:
- OTP-based login (email or phone) —s, mobile-first
- JWT sessions stored as httpOnly cookies, revocable via DB
- Prisma schema: `User`, `Session`, `OtpCode` models live on Supabase
- API routes: `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/logout`
- Middleware protecting non-public routes
- Login page (`/login`) — email/phone toggle
- Verify page (`/verify`) — 6-box OTP input, paste support, 30s resend cooldown
- Dashboard stub (`/dashboard`) — confirms auth, shows user info

**Upcoming Phase: 2 — Profile Builder + Communication Layer (Days 21–45)**

Full Phase 2 scope (our roadmap + design doc):

_Profile & Card (our roadmap):_
- Profile fields on User model (name, bio, links, photo, etc.)
- QR token engine — unique token per card for scan-to-view
- Shareable public card page at `/c/[slug]`
- Prisma schema expansion

_Communication Layer (design doc items 16–19):_
- **#16 Twilio proxy SMS** — generate ephemeral phone numbers per active connection, forward to owner's real number, auto-expire with TTL
- **#17 In-apowner and approved prospect exchange messages inside platform; owner controls escalation to real contact info
- **#18 Wali notification** — owner registers a guardian phone/email; system notifies guardian on new contact requests for approval routing
- **#19 Consent flow** — owner sees pending requests with structured context (name, intent, time of scan); approve or decline; approval unlocks messaging or proxy number

**Key Decisions Made:**
- **Email-only login** (phone login removed 2026-03-24) — cleaner UX, cheaper (no Twilio Verify costs), simpler A2P registration
- Email OTP stored locally in `otp_codes` table, sent via Resend
- Phone number still collected in profile for proxy SMS masking (not for login)
- Sessions are DB-tracked (not stateless JWT) to allow revocation
- `prisma db push` used in Phase 1 (not migrations — will likely switch for Phase 2+)
- Prisma 5 + `@prisma/client` — npm audit flagged some advisories, addressed with `npm audit fix`

**Recent Activity:**
- 2026-03-22: Phase 1— auth, OTP, JWT sessions, all pages
- 2026-03-24: Full test suite — Vitest 57/57, Playwright 20/20
- 2026-03-24: Phase 2 started — Prisma schema expanded, profile API, public card page, consent flow shipped
- npm audit run, Prisma major version upgrade noted as future task

**Phase 2 — Complete (2026-03-24):**
- Prisma schema: User expanded (slug, displayName, bio, photoUrl, location, links, cardToken, cardActive, waliPhone, waliEmail, waliActive) + CardScan, ConnectionRequest, Message, ProxyConnection models — all live on Supabase
- `lib/profile/profile.ts` — getProfile, updateProfile, activateCard, deactivateCard, getPublicCard, logCardScan, slug/token generation
- `lib/connect/requests.ts` — createConnectionRequest, approveRequest, declineRequest, owner+Wali email notifications
- `lib/email/resend.ts` — added generic sendEmail alongside sendOtpEmail
- API routes: GET/PATCH `/api/profile`, POST/DELETE `/api/profile/card`, POST `/api/connect/request`, GET/PATCH `/api/connect/requests`
- Put `/c/[slug]` — profile display, links, scan logging, contact request form
- Dashboard rebuilt — CardPanel (activate/deactivate), ProfileForm (edit all fields + links), RequestsPanel (approve/decline pending requests)
- Middleware updated — `/c/` and `/api/connect/request` are public
- **Wali UI** — WaliPanel in dashboard, GET/PATCH `/api/profile/wali`
- **QR generation** — `/api/profile/qr` returns SVG QR code pointing to card URL
- **In-app messaging** — MessagesPanel thread UI, GET/POST `/api/connect/messages`, read receipts
- **Twilio proxy** — `lib/sms/proxy.ts`, GET/POST/DELETE `/api/connect/proxy`
- Phase 2 tests: complete

**Test Coverage (Phase 1) — ALL PASSING:**

_Unit tests (Vitest) — 85/85 (`npm test`):_
- `tests/lib/otp.test.ts` — createEmailOtp, verifyEmailOtp (9 tests)
- `tests/lib/jwt.test.ts` — signToken, verifyToken, createSession, revokeSession, validateSession (11 tests)
- `tests/api/send-otp.test.ts` — POST /api/auth/send-otp, email + phone + validation (10 tests)
- `tests/api/verify-otp.test.ts` — POST /api/auth/verify-otp, email + phone + cookie props + validation (13 tests)
- `tests/api/logout.test.ts` — POST /api/auth/logout (4 tests)
- `tests/middleware.test.ts` — public paths, protected paths, invalid/valid tokens (10 tests)
- Run with: `npm test` | Watch: `npm run test:watch` | Coverage: `npm run test:coverage`

_E2E tests (Playwright / Chromium) — 43/43 (`npm run test:e2e`):_
- ✅ Middleware redirects (unauthenticated → /login)
- ✅ Login page UI (renders, input, phone toggle, button state, validation)
- ✅ Verify page OTP flow (valid/invalid codes, length validation, missing field) — API-level
- ✅ API send-otp validation
- ✅ API verify-otp validation
- ✅ Logout
- Note: verify page browser tests replaced with API-level tests — headless Chromium crashes rendering /verify due to limited /dev/shm on this server. UI behavior covered by Vitest unit suite.

## 🔥 In Progress

_(nothing — Phase 3 complete)_

## 📋 Queued — Phase 4 (→ Polish & Launch Prep)

- [ ] Card designer: 2–3 templates with customization (color, name display, bio snippet)
- [ ] Basic analytics dashboard: scan count, contact requests, approved connections, active TTLs
- [ ] Safety UX: onboarding tips, safety guidance, panic button (hide profile + kill proxies + alert support)
- [ ] Legal review: Terms of Use, Privacy Policy, telecom compliance for proxy numbers
- [ ] Soft launch planning

## ✅ Done

### Phase 3 — Safety & Order Flow (2026-03-27)
- [x] Prisma migration: Block, Report, ContactAttempt models + ReportCategory enum + fieldVisibility on User
- [x] Switched from `prisma db push` to proper migrations
- [x] Field visibility: per-field public/hidden toggles (defaults: name/bio/location public, photo/links hidden)
- [x] Block & report: one-click block auto-declines pending requests, report with category selection
- [x] Rate limiting: DB-backed, 5 per contact + 15 per IP per owner per 24h
- [x] Turnstile CAPTCHA: Cloudflare Turnstile on contact form (privacy-first, skipped in dev if no keys)
- [x] Card PDF download: business-card-sized PDF with QR code, brand header, download from dashboard
- [x] BlockedPanel in dashboard for managing blocked contacts
- [x] QR code image shown in CardPanel dashboard
- [x] Tests: 115 Vitest unit + E2E suite

### Phase 2 — Profile Builder + Communication Layer (2026-03-24)
- [x] Prisma schema expansion, profile API, public card page, consent flow
- [x] Wali UI, QR generation, in-app messaging, Twilio proxy SMS
- [x] Dashboard: CardPanel, ProfileForm, RequestsPanel, WaliPanel, MessagesPanel

### Phase 1 — Foundation (2026-03-22)
- [x] OTP auth (email + phone), JWT sessions, middleware, login/verify/dashboard pages

---

# PROPOSAL CARD — Project Brief for Claude Code

> This file is the authoritative reference for this project. Read it fully before writing any code, creating any files, or making architectural decisions. When in doubt about scope, intent, or a design decision, refer back here first.

---

## What This Project Is

A **privacy-first physical + web proposal card system** for Muslims seeking marriage. Users create a profile, order physical cards printed with a QR code, and hand them out in person to signal marriage interest. The card links to a minimal profile page. Contact is mediated through temporary proxy channels — no phone number or email is ever exposed directly. The Islamic framework (wali routing, consent-gating, intention signaling) is baked into the architecture, not bolted on.

**This is not a dating app.** There is no browse/swipe interface. Discovery happens in person, through the physical card. The platform handles identity, contact mediation, privacy, and safety only.

---

## Core Design Principles

1. **Privacy-first by default.** Minimal public info. Sensitive fields (photo, real name, phone) are opt-in and never exposed without explicit owner action.
2. **Consent-gated.** No information is revealed and no contact is made without the card owner approving each step.
3. **TTL-enforced intentionality.** Tokens expire (default 48 hours). This is an Islamic design choice — it filters passive interest and prevents profiles from circulating indefinitely without the owner's knowledge.
4. **Wali/guardian support is opt-in, not mandatory.** It must be easy to enable, prominent in onboarding, but never forced.
5. **Physical card first.** The card is the product. The platform exists to support it.

---

## End-to-End Flow

### Step 1 — Sign-Up & Profile Creation
- User creates account (email + phone OTP).
- Completes minimal profile: display name, age, region, short bio, optional photo.
- Each field has a visibility toggle (public / hidden).
- Optional identity verification (ID or selfie liveness) returns a trust badge. Encouraged but not required at MVP.

### Step 2 — Token Issuance & Card Order
- User generates a unique QR token mapped to their profile URL.
- Token has configurable TTL (default: 48 hours from first scan).
- No phone number or email appears on the card — only the QR and display name.
- MVP: user downloads a printable QR card PDF. Physical fulfillment is manual at launch.

### Step 3 — Prospect Scans Card
- QR scan → minimal profile landing page (public fields only + Contact button).
- **No account required for prospect at MVP.** Guest contact form: name, phone, brief message. This is intentional — removing friction at the moment of interest.

### Step 4 — Contact Mediation
Card owner selects one of three contact modes (set on their profile):
- **Proxy SMS** — Twilio-generated ephemeral number forwards to owner's real number for TTL duration. Prospect texts/calls through it.
- **In-app messaging** — Messages stored and moderated inside the platform. Owner controls when (or if) to reveal real contact.
- **Structured request** — Prospect fills a form: name, intent, relationship expectations. Owner approves or declines.

Owner receives a notification with context: time of scan, approximate location (if geo is enabled by owner).

### Step 5 — Consent & Escalation
- Owner must explicitly approve before prospect sees any additional profile fields.
- Wali routing (optional): owner can configure contact to forward to a guardian's number or queue for guardian approval first.
- If approved: ephemeral contact (proxy or in-app) continues.
- Owner promotes to permanent contact only when ready — never automatic.

### Step 6 — TTL & Closing
- At TTL expiration: connection auto-terminates.
- Owner may extend TTL (free or paid) or convert connection to direct contact.
- Owner dashboard shows: scan count, contact request count, approved connections, active TTLs.

---

## Technical Architecture

### Frontend
- Account portal and profile editor
- Card designer (2–3 templates at MVP)
- Purchase and download (QR card PDF)
- Prospect landing page — mobile-first, fast, minimal

### Backend
- Token mapping engine: QR token → profile URL
- TTL engine: expiration, extension, invalidation
- Proxy communications: Twilio SMS/voice
- In-app messaging with moderation layer
- Payments (Stripe)
- Abuse detection (rate limiting, reporting, blocking)

### Integrations
| Service | Purpose |
|---|---|
| Twilio | Proxy phone numbers, SMS forwarding, OTP |
| Stripe | Card purchases, subscriptions, TTL extensions |
| Identity Verification (TBD) | ID + liveness for trust badges (post-MVP) |
| Content Moderation | NLP screening of messages (post-MVP) |

### Recommended MVP Stack
| Layer | Choice |
|---|---|
| Frontend | React, mobile-responsive |
| Backend | Node.js or FastAPI (Python) |
| Database | Postgres (user data), Redis (TTL token state) |
| Proxy | Twilio Programmable SMS |
| Hosting | Vercel or Railway for MVP speed |
| Payments | Stripe |
| Moderation | Keyword filtering + manual review queue at MVP |

---

## Privacy & Safety Architecture

### Default Settings
- Minimal public profile. Photo, real name, full contact: opt-in only.
- Default contact mode: structured request or in-app message. No direct phone shown unless owner explicitly enables it.

### Proxy Numbers
- All phone contact through ephemeral Twilio numbers. Real numbers never exposed unless owner promotes.
- Numbers rotate; abusers are blocklisted and cannot reuse numbers.

### Two-Step Reveal
- No auto-reveal of any personal data. Owner approves each connection individually.
- Structured request form (name, intent, expectations) creates intentionality and a paper trail.

### Rate Limits & Anti-Abuse
- Per-profile rate limit: max contact attempts per 24-hour window (configurable by owner).
- CAPTCHA on guest contact form.
- Rapid scan detection (multiple scans from same device flagged).

### Blocking & Reporting
- One-click block and report on any contact.
- Cross-user blocklist: repeat abusers flagged platform-wide.

### Wali / Guardian Workflow
- Owner registers a guardian phone/email.
- System sends notification on new contact requests; guardian can approve or decline on owner's behalf.
- User-controlled, not mandatory. Prominent in onboarding.

### Safety UX
- Panic button: hides profile, terminates all active proxies, alerts support. **This is a digital safety tool only — do not market it as a physical safety feature.**
- Onboarding tips: do not reveal phone until comfortable, meet in public first, how to handle pressure.

### Technical Protections
- TLS everywhere.
- PII hashed at rest.
- Minimal data retention with user-configurable delete periods.
- Consent logging and audit trail for every data reveal event.

---

## Edge Cases & How to Handle Them

| Scenario | Handling |
|---|---|
| Profile screenshot shared | Watermark visible fields; blur sensitive fields until approval; short TTL limits screenshot value |
| Card handed to a friend | Contact still requires owner approval; recipient must self-identify in structured request |
| Owner is unresponsive | "Away" mode auto-declines or queues; TTL extension available to owners who want more time |
| Unverified card holder | Trust badge system signals verified vs. unverified; no verification required to order cards |
| Mass card distribution abuse | Rate limits per profile per window; anomaly detection on rapid scans |
| Male receiver UX | Men receive same core feature set: tagging, notes, archiving, structured request handling, blocking |

---

## Revenue Model

| Stream | Description |
|---|---|
| Card Sales | One-time purchase of physical printed cards |
| Subscriptions | Monthly/annual plans bundling cards + feature access |
| Premium Templates | Luxury card designs and materials |
| TTL Extensions | Paid extension of expired connection windows |
| Verified Badge | Paid identity verification unlocking extended features |
| Event / B2B Licensing | Bulk orders for masjid programs, events, matchmakers |

---

## 90-Day MVP Build Plan

> **Guiding rule:** Skip NFC for v1. Skip advanced analytics. Skip behavioral anomaly engine. Focus on one loop: card → landing page → structured request → in-app message → wali notification. Get that tight before adding anything else.

### Phase 1 — Foundation (Days 1–20)
1. Backend setup: user auth (email + phone OTP), profile model (name, age, region, bio, optional photo, visibility flags per field).
2. Token engine: generate unique QR tokens mapped to profile URLs. 48-hour TTL default. Token invalidation on demand.
3. Minimal profile landing page: mobile-first, shows only public fields, Contact button. No login wall for prospect.
4. Guest contact form: prospect submits name, phone, message. No account required. Data held pending owner review.

### Phase 2 — Communication Layer (Days 21–45)
5. Twilio proxy SMS: generate ephemeral number per active connection, forward to owner's real number, auto-expire with TTL.
6. In-app messaging: owner and approved prospect exchange messages inside platform. Owner controls escalation.
7. Wali notification: owner registers mail; system notifies guardian on new contact requests.
8. Consent flow: owner sees pending requests with context (name, intent, scan time). Approve or decline. Approval unlocks messaging or proxy.

### Phase 3 — Safety & Order Flow (Days 46–65)
9. Block and report: one-click block; report flow with categories (spam, harassment, inappropriate).
10. Rate limiting: cap contact attempts per profile per 24 hours. CAPTCHA on guest contact form.
11. Profile privacy controls: owner toggles per field. Defaults — public: display name, age, region, bio. Hidden: photo, full name.
12. Card order flow: user downloads printable QR card PDF with their token. Physical fulfillment is manual at this stage.

### Phase 4 — Polish & Launch Prep (Days 66–90)
13. Card designer: 2–3 templates with basic customization (color, name display, optional bio snippet). Dignified, professional aesthetic.
14. Basic analytics dashboard: scan count, contact requests, approved connections, active TTLs.
15. Safety UX: onboarding tips, safety guidance, panic button (hide profile + kill proxies + alert support).
16. Legal review: Terms of Use, Privacy Policy, telecom compliance for proxy numbers.
17. Soft launch: 1–2 Muslim community influencers or one masjid marriage program as first distribution channel.

---

## Go-To-Market

**Primary channels:**
- Masjid marriage committees — institutional legitimacy, captive audience, repeat orders.
- Islamic matrimonial events (ISNA, local) — single event = thousands of card distributions.
- Muslim matchmakers (khataba) — B2B recurring card orders, professional credibility.
- Islamic content creators — YouTube, TikTok, Instagram focused on marriage and lifestyle.

**Positioning:** "Always be ready." The person carrying their proposal card signals seriousness before they say a word. Lead with privacy and respect — not features. Community trust must be earned before it can be monetized.

---

## Open Questions (Do Not Make Assumptions On These)

- **Product name:** "Proposal Card" is a working title — final brand name unresolved.
- **Verification incentives:** How to make the trust badge functionally valuable (unlock longer TTLs, more profile fields) rather than cosmetic — still being designed.
- **Physical fulfillment partner:** On-demand print API vs. manual vs. digital-only MVP — decision pending.
- **NFC:** Deferred to v2. Do not build NFC support in v1.
- **Regional defaults:** Wali/mahram norms differ by culture. Configurable defaults per region is a future consideration, not MVP.

---

*End of brief. Refer back to this file whenever scope or intent is unclear.*
