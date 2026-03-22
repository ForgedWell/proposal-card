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

_Phase 2: Profile builder, QR token engine, shareable public card page_
