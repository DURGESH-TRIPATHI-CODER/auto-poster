# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build production bundle
npm run lint         # Run ESLint
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run worker       # Run cron scheduler (tsx scripts/worker.ts)
npm run worker -- --now  # Force publish all pending posts immediately
```

No test suite is configured. Manual testing scripts exist in `scripts/testBots.ts`, `scripts/loginLinkedIn.ts`, `scripts/loginX.ts`.

## Architecture

**AutoPoster** — personal social media scheduler that posts to LinkedIn and X via Playwright browser automation, with a Next.js 14 App Router frontend.

### Data Flow

```
PostEditor (UI)
  → /api/posts (Zod validation)
  → Supabase DB (posts table, published=false)
  → scripts/worker.ts (cron, every 5 min)
  → lib/scheduler.ts (isDueNow check)
  → lib/linkedinBot.ts / lib/twitterBot.ts (Playwright)
  → lib/email.ts (SMTP notification)
```

Manual publish bypasses the schedule: `POST /api/posts/[id]` triggers a bot immediately.

### Database

Single table `posts` (see `database/schema.sql`):
- `platform`: `'linkedin' | 'twitter'`
- `day_of_week`: 0–6 (Sunday=0)
- `post_time`: `TIME` (HH:MM)
- `repeat_weekly`: boolean — if true, post resets `published=false` after publishing (republished weekly)
- `published`: false = pending, true = published (or awaiting next weekly cycle)

Multi-platform posts are stored as **separate rows** (one per platform), created from a single UI submission.

### Scheduling Logic (`lib/scheduler.ts` + `lib/validators.ts`)

- `isDueNow()` returns true if current time >= scheduled time on the scheduled day. Overdue same-day posts also publish.
- 6.5-day grace period: skips a post if `last_published_at` is within 6.5 days (prevents double-publish for weekly repeats).
- `runWeeklyReminder()` fires Sundays at 6 PM — sends email if no posts are scheduled for next week.

### Bot Session Persistence (`lib/session.ts`)

Playwright saves browser context (cookies/storage) to `.sessions/linkedin.json` and `.sessions/twitter.json`. On subsequent runs, bots load the saved session and skip login. If the session is expired (redirected to login), the file is deleted and re-authentication runs. Run `scripts/loginLinkedIn.ts` / `scripts/loginX.ts` manually to establish a fresh session.

### API Routes

| Route | Methods | Notes |
|---|---|---|
| `/api/posts` | GET, POST | GET supports `?published=true/false` filter |
| `/api/posts/[id]` | PUT, DELETE, POST | POST = publish now |
| `/api/worker` | POST | Requires `x-worker-secret` header; body `{mode:"reminder"}` triggers reminder job |
| `/api/auth/login` | POST | Sets `autoposter_auth` httpOnly cookie (8h TTL) |
| `/api/upload` | POST | Uploads image to Supabase Storage, returns public URL |

### Auth

`lib/auth.ts` uses hardcoded `DEMO_USERS` — this is intentional for a personal app. Cookie-based session set on login.

### Key Conventions

- All DB operations use the **admin Supabase client** (`supabaseAdmin` from `lib/supabaseClient.ts`) — never the browser client.
- The `AppShell` component wraps all pages; pass `title`, `subtitle`, and optional `action` props.
- Drafts are stored in **localStorage** (not DB) — see `app/drafts/page.tsx`.
- Images are uploaded to Supabase Storage before post submission; `image_url` is stored in DB.
- Tailwind primary color is `#5048e5` (purple). Dark theme throughout (zinc-950 backgrounds).
