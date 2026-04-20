# TrickDB

A trick-centric video study database for the tricking community. Users upload short clips of individual tricks, the community votes on quality, and everyone builds private study lists from the best examples.

**Live site:** https://action-loop-web.vercel.app

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui v4
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Deployment:** Vercel (auto-deploys from `main`)

## Local Development

### Prerequisites

- Node.js 20+
- A Supabase project with the schema applied (see `supabase/migrations/`)

### Setup

```bash
npm install
```

Create `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Run

```bash
npm run dev
```

Open http://localhost:3000.

## Database Migrations

SQL migrations live in `supabase/migrations/` and must be run manually in the Supabase SQL Editor in order:

1. `00001_initial_schema.sql` — tables, views, triggers
2. `00002_rls_policies.sql` — row-level security
3. `00003_fuzzy_search.sql` — pg_trgm extension and fuzzy search functions
4. `00004_admin_delete_tricks.sql` — admin delete policy for tricks

## Auth

- Email/password and Google OAuth via Supabase Auth
- Google OAuth requires a Client ID/Secret from Google Cloud Console
- Supabase callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`

## Admin Access

Set `is_admin = true` on a user record in the `users` table. Admin pages are at `/admin/*`.
