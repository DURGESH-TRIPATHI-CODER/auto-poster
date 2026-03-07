# AutoPoster

Single-user social media auto-poster for LinkedIn and X using Playwright automation.

## Stack
- Next.js + React + Tailwind CSS
- Node.js backend routes
- Supabase (Postgres)
- Playwright automation (Chromium)
- node-cron scheduler
- Nodemailer SMTP reminders

## Project Structure
```txt
autoposter/
  app/
    api/
      posts/
      posts/[id]/
      worker/
    dashboard/
    create-post/
  components/
    PostEditor.tsx
    PostList.tsx
    ScheduleForm.tsx
  lib/
    supabaseClient.ts
    linkedinBot.ts
    twitterBot.ts
    scheduler.ts
    email.ts
    validators.ts
    types.ts
  scripts/
    worker.ts
  database/
    schema.sql
  .env.example
  .env
```

## Environment Variables
Configure `.env` with:

```env
APP_URL=http://localhost:3000

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=

LINKEDIN_EMAIL=
LINKEDIN_PASSWORD=

X_EMAIL=
X_PASSWORD=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

REMINDER_EMAIL=
WORKER_SECRET=
```

## Setup
1. Install dependencies:
```bash
npm install
```

2. Install Playwright browser:
```bash
npx playwright install chromium
```

3. Run SQL schema in Supabase SQL Editor:
- File: `database/schema.sql`

4. Create a Supabase Storage bucket named `post-images` and make it public.

5. Start web app:
```bash
npm run dev
```

6. Start worker in another terminal:
```bash
npm run worker
```

## Features
- Create and schedule posts (`linkedin` or `twitter`)
- Optional image URL support in post data
- Dashboard with upcoming and published posts
- Delete scheduled posts
- Worker runs every 5 minutes:
  1. fetch unpublished posts
  2. check day + time window
  3. run Playwright bot
  4. mark as published (or repeat weekly)
- Sunday 6:00 PM weekly reminder via SMTP when next week has no scheduled posts

## Playwright Automation
### LinkedIn (`lib/linkedinBot.ts`)
- Opens login page
- Logs in via `.env` credentials
- Opens feed
- Clicks start post
- Fills content
- Clicks post

### X (`lib/twitterBot.ts`)
- Opens login page
- Logs in via `.env` credentials
- Opens composer
- Inserts text
- Clicks post

## Worker Endpoint (Optional Trigger)
You can manually trigger jobs via API:
- `POST /api/worker`
- Header: `x-worker-secret: <WORKER_SECRET>`
- Body:
  - `{ "mode": "publish" }` for publish cycle
  - `{ "mode": "reminder" }` for reminder cycle

## Security Notes
- Passwords are never stored in DB.
- Credentials are loaded only from environment variables.
- Keep `.env` out of version control.

## Notes
- Social UI selectors can change; update selectors in Playwright bots when needed.
- For first-time login challenges (2FA/captcha), manual intervention may be required.
