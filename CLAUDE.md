@AGENTS.md

# TrickDB — Project Context

## What this is

A trick-centric video study database for tricking (the martial arts discipline). NOT a social network. The product is a structured reference library where users search tricks, watch community-ranked example clips, and build private study lists. See `spec.md` for the full product spec.

## Architecture

Next.js 16 App Router with Supabase backend. Server components fetch data, client components handle interactivity. No API routes except `/auth/callback/route.ts` for OAuth code exchange.

### Key patterns

- **Server components** (`page.tsx`) query Supabase via `createClient()` from `@/lib/supabase/server` and pass data to client components
- **Client components** (`"use client"`) use `createClient()` from `@/lib/supabase/client` for mutations and real-time state
- **Middleware** (`src/middleware.ts` calling `src/lib/supabase/middleware.ts`) handles auth session refresh, protected route redirects, and admin route gating
- **RLS** enforces all access control at the database level — admin checks use `exists (select 1 from public.users where id = auth.uid() and is_admin = true)`

### Directory structure

```
src/
  app/
    page.tsx                    # Homepage — top tricks this week
    layout.tsx                  # Root layout with navbar
    tricks/
      page.tsx                  # Browse all tricks alphabetically
      [slug]/
        page.tsx                # Trick page (server) — fetches trick + clip count
        clip-grid.tsx           # Client — infinite scroll grid with clip modal
    upload/page.tsx             # Upload flow with preview, trick selector, validation
    favorites/
      page.tsx                  # Server — fetches user's favorited clips
      favorites-list.tsx        # Client — grid with unfavorite action
    request-trick/
      page.tsx                  # Server wrapper
      request-form.tsx          # Client form for trick requests
    auth/
      login/page.tsx            # Sign in (Google OAuth + email/password)
      signup/page.tsx           # Sign up
      set-username/page.tsx     # Username prompt on first action
      callback/route.ts         # OAuth code exchange
    admin/
      layout.tsx                # Admin layout — auth + is_admin check, tab nav
      tricks/                   # Create tricks, toggle active, delete
      aliases/                  # Create/delete aliases with trick search
      reports/                  # Review reports, hide/remove clips
      requests/                 # Approve (auto-creates trick) or reject
      clips/                    # Filter by status, restore/hide/remove
  components/
    navbar.tsx                  # Top nav with search, auth links
    search-bar.tsx              # Autocomplete with fuzzy fallback + "Request trick" link
    trick-selector.tsx          # Multi-select trick picker for upload
    clip-modal.tsx              # Video player modal with votes, favorites, reports, speed controls
    ui/                         # shadcn/ui v4 components (base-ui, uses `render` prop not `asChild`)
  lib/
    supabase/
      client.ts                 # Browser Supabase client
      server.ts                 # Server Supabase client (cookies)
      middleware.ts              # Session refresh + route protection
      storage-url.ts            # Public URL helper for storage paths
    time.ts                     # timeAgo() utility
    utils.ts                    # cn() classname merge
```

### Database tables

All in `public` schema. See `supabase/migrations/00001_initial_schema.sql` for full DDL.

- `users` — extends auth.users, has `is_admin` boolean
- `tricks` — canonical trick list with `name`, `normalized_name`, `slug`, `is_active`
- `trick_aliases` — aliases for search (FK to tricks, ON DELETE CASCADE)
- `clips` — uploaded video metadata, `status` field (active/hidden/removed)
- `clip_tricks` — many-to-many clips<->tricks (ON DELETE CASCADE both sides)
- `clip_votes` — like (+1) / dislike (-1) per user per clip
- `clip_favorites` — private favorites per user
- `clip_reports` — user reports with predefined reason categories
- `trick_requests` — user-submitted trick requests (pending/approved/rejected)

Views: `clip_scores` (aggregated vote counts), `trick_weekly_scores` (homepage ranking).

### Search

Search uses normalized prefix matching on `tricks.normalized_name` and `trick_aliases.normalized_alias`. When exact matches return nothing, fuzzy fallback uses `pg_trgm` similarity via `supabase.rpc("search_tricks_fuzzy")`. Zero results show a "Request this trick" link.

Normalization: lowercase, trim, collapse spaces, replace hyphens/underscores with spaces, strip punctuation.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon/public key
```

## Deployment

- Vercel auto-deploys from `main` branch on push
- Supabase SQL migrations must be run manually in the SQL Editor
- Google OAuth configured in Google Cloud Console (project: enduring-plate-487307-c4, currently in Testing mode)

## Conventions

- shadcn/ui v4 uses base-ui under the hood — components use `render` prop, NOT `asChild`
- Supabase FK joins in TypeScript return arrays; cast with `as any` when the join is known to be singular
- Admin pages are simple/functional, not heavily polished
- All trick names are stored with both display form and normalized form
- Slugs are generated client-side via `normalize().replace(/ /g, "-")`
