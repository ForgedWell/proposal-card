# Proposal Card — Changelog

---

## [Phase 1] — 2026-03-22

### Added
- **Project scaffolding** — Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database** — PostgreSQL on Supabase, connected via Prisma ORM
- **Prisma schema** — `User`, `Session`, `OtpCode` models with `OtpType` enum
- **Schema pushed** to Supabase (`prisma db push` — tables live)
- **Email OTP** — Resend integration (`lib/email/resend.ts`), 6-digit code, 10-min TTL
- **Phone OTP** — Twilio Verify integration (`lib/sms/twilio.ts`), delegated to Twilio
- **OTP logic** (`lib/auth/otp.ts`) — generate, invalidate old codes, upsert user on verify
- **JWT sessions** (`lib/auth/jwt.ts`) — signed with `jose`, stored in httpOnly cookies, 7-day expiry, revocable via DB
- **API routes**:
  - `POST /api/auth/send-otp` — email or phone, validated with Zod
  - `POST /api/auth/verify-otp` — verifies code, creates session cookie
  - `POST /api/auth/logout` — revokes session, clears cookie
- **Middleware** — protects all non-public routes, redirects unauthenticated users to `/login`
- **Login page** (`/login`) — email/phone toggle, clean mobile-first UI
- **Verify page** (`/verify`) — 6-box OTP input, auto-submit on complete, paste support, resend with 30s cooldown, masked display of contact
- **Dashboard page** (`/dashboard`) — stub page confirming auth works, shows user info
- **Env config** — `.env.local` (gitignored), `.env.example` committed as reference
- **CHANGELOG.md** — this file

### Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma 5 + PostgreSQL (Supabase)
- Resend (email OTP)
- Twilio Verify (phone OTP)
- jose (JWT)
- Zod (validation)

---

## [Phase 1 - Testing] — 2026-03-24

### Added
- **Vitest unit test suite** — 57 tests across 6 files, all passing (`npm test`)
  - Covers: OTP logic, JWT sessions, API routes (`send-otp`, `verify-otp`, `logout`), middleware
  - All external dependencies mocked (Resend, Twilio, Prisma, `jose`) — no network calls
- **Playwright E2E suite** — Chromium headless, webServer auto-start on `npm run test:e2e`
  - 15/20 tests passing:
    - ✅ Middleware redirects (unauthenticated access to protected routes)
    - ✅ All login page UI tests
    - ✅ All API route validation tests
    - ✅ Logout flow
  - ⏳ 5 verify page tests in progress — blocked by Next.js on-demand compilation issue in dev mode; fix: switch to prod build for E2E

### Commands
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`

---

_Phase 2: Profile builder, QR token engine, shareable public card page_
