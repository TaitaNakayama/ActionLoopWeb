# TrickDB — Product & Engineering Spec (Finalized)

## 1. Purpose

Build a **trick-centric searchable training database** for the tricking community. Users upload short public study clips, attach them to canonical tricks, and the community votes on whether each clip is a good example of the trick. Users can search by trick name or alias and save clips to a private study list.

This is a **trick dictionary**, not a social network. The product should feel closer to a structured reference library than to Instagram or TikTok. Combo footage is discouraged — each clip should ideally demonstrate a single trick.

---

## 2. Product Principles

### 2.1 Trick pages are the center of the product
The main navigational object is the **trick page**, not the user profile. Users are browsing tricks and the best study examples for those tricks.

### 2.2 Canonical trick system is required
Users must not invent arbitrary trick names. The platform maintains a canonical trick list managed by admins. Users attach uploaded clips to existing canonical tricks. Users can submit trick requests via an in-app form for admin review.

### 2.3 Alias support is required
Search must support aliases and spelling variants. Example: `dub cork` should resolve to `double cork`.

### 2.4 Ranking is about quality of example, not social popularity
A like/dislike vote means:
- "this is a good example of the trick"
- "this is not a good example of the trick / misleading / low study value"

### 2.5 One trick per clip is the ideal
This is a trick dictionary. Each clip should ideally demonstrate one trick. Multi-tagging is allowed (max 3) but the UX nudges users toward single-trick tagging. A clip of a cartwheel into double full belongs on the double full page, not the cartwheel page.

### 2.6 Public clip library, private favorites
All uploaded clips are public. Favorites are private to the user.

### 2.7 Minimal surface area for v1
Do not build public profiles, followers, comments, messaging, or complex personalization.

### 2.8 Search quality and upload correctness matter more than social features

---

## 3. Brand & Visual Design

### 3.1 Working name
**TrickDB** (placeholder — can be changed with find-and-replace)

### 3.2 Visual style
- **Light + clean** aesthetic
- White/light gray backgrounds, sharp typography, colored accents
- Modern and accessible feel (think: Linear, Notion)
- Utility-oriented, not flashy social media styling
- Good video contrast on clip thumbnails

---

## 4. Tech Stack

### 4.1 Frontend
- **Next.js** with App Router
- **TypeScript**
- **React**
- **Tailwind CSS** for styling
- Optional component library: **shadcn/ui**

### 4.2 Backend / Database / Storage / Auth
- **Supabase**
- **Postgres** for relational data
- **Supabase Auth** for authentication (email + password + Google OAuth)
- **Supabase Storage** for uploaded video files (public bucket)
- **Row Level Security (RLS)** on user-owned tables

### 4.3 Deployment
- Frontend deployed to **Vercel**
- Supabase hosted backend

### 4.4 Video handling
- Browser upload to Supabase Storage
- Store metadata in Postgres
- Public bucket with UUID-based paths (`clips/{uuid}.{ext}`)
- Auto-generated thumbnails (extract frame at ~50% duration via browser canvas)
- Keep architecture open for later transcoding pipeline

---

## 5. Scope of V1

### 5.1 Included in v1
- User authentication (email + password + Google OAuth)
- Upload short video clip with preview player (no trim)
- Select 1–3 canonical tricks during upload (soft nudge toward 1)
- Performer name field (free-text, optional — shows "Unknown" if blank)
- Public trick pages with ranked clips
- Like / dislike clip (toggle, split counts visible)
- Favorite clip to private study list (soft warning on 2nd favorite per trick)
- Report clip (predefined categories + optional notes)
- Search tricks by canonical name or alias (autocomplete dropdown)
- Homepage with top tricks this week (grid of 8–12 cards with thumbnails)
- Browse all tricks page (/tricks, alphabetical)
- Trick page clip ranking by score with three sort options: Top, Newest, Rising
- Infinite scroll pagination on trick pages
- Clip modal with prev/next navigation and deep-linkable URLs
- Video playback speed controls (0.25x, 0.5x, 1x, 2x)
- Collapsed display for clips with score ≤ -5
- In-app trick request form with admin review queue
- Fuzzy search suggestions on zero results
- Admin tools for trick/alias management, clip moderation, report review

### 5.2 Explicitly excluded from v1
- Comments
- Followers / following
- Public profiles
- Public favorites
- Custom collections
- User-created tricks (admin-only)
- Advanced moderation dashboards
- AI auto-tagging
- Recommendation engine / algorithmic feed
- Notifications
- Account deletion
- Video trim UI (planned for v2)
- Combo-specific trick entries
- Captions (removed — unnecessary for trick dictionary)
- Onboarding tour

---

## 6. User Roles

### 6.1 Guest
Can:
- View homepage
- Search tricks
- Open trick pages
- Browse all tricks
- Watch public clips

Cannot:
- Upload, vote, favorite, report

### 6.2 Authenticated user
Can:
- Upload clips
- Vote like/dislike on clips (toggle on/off)
- Favorite clips
- Report clips
- View private favorites page
- Submit trick requests

### 6.3 Admin
Determined by `is_admin` boolean on user record, set manually in DB.

Can:
- Create canonical tricks
- Create trick aliases
- Edit trick metadata
- Hide or remove clips
- Review reports
- Review and action trick requests

Admin pages live at `/admin/*` in the main app, protected by middleware.

---

## 7. Core User Flows

### 7.1 Search flow
1. User lands on homepage.
2. Search input is visually dominant at the top.
3. User types a trick query (e.g., `double cork` or `dub cork`).
4. Autocomplete dropdown appears (debounced ~200ms) showing matching tricks.
5. Results match against canonical names, aliases, and normalized forms.
6. If no results: show fuzzy/similar suggestions + "Request this trick" link.
7. User selects a trick → navigates to that trick's page.

### 7.2 Upload flow
1. Authenticated user clicks upload. If not logged in, redirect to login with return URL to `/upload`.
2. If user has no username yet, prompt to set one before proceeding.
3. User selects a video file.
4. **Preview player** shows the selected video so user can verify it's correct.
5. System validates duration (≤ 20s), file size (≤ 100MB), and MIME type (client-side).
6. User types into trick selector input (autocomplete).
7. User selects 1–3 tricks. At least one required. Soft nudge at 2+: "Best clips focus on a single trick."
8. User optionally enters performer name (free-text).
9. User submits.
10. Video uploads to Supabase Storage (`clips/{uuid}.{ext}`).
11. Thumbnail auto-generated from video frame.
12. Clip record created in database with trick associations.
13. User redirected to the primary trick page.

### 7.3 Trick browsing flow
1. User opens trick page (`/tricks/[slug]`).
2. Trick name displayed prominently at top.
3. Sort options available: **Top** (default), **Newest**, **Rising**.
4. Ranked list of clips shown with infinite scroll (20 per batch).
5. Each clip shows: thumbnail, performer name (or "Unknown"), score (like/dislike counts shown separately), upload date.
6. Clicking a clip opens a **modal/overlay** with:
   - Video player with speed controls (0.25x, 0.5x, 1x, 2x)
   - Video loops by default
   - Like/dislike buttons (toggle, showing split counts)
   - Favorite button
   - Report button
   - Performer name and uploader attribution
   - Prev/next navigation arrows to browse clips without closing
   - Deep-linkable URL: `/tricks/[slug]?clip=[id]`
7. Clips with score ≤ -5 are **collapsed** — visible but require click to expand.

### 7.4 Favorite flow
1. Authenticated user clicks favorite on a clip.
2. If user already has a favorite for the same trick, show soft warning: "You already have a favorite for [trick]. Save anyway?"
3. User can dismiss and proceed.
4. Clip is added to private favorites list.

### 7.5 Report flow
1. Authenticated user clicks report on a clip.
2. User selects from predefined categories:
   - Wrong trick tagged
   - Not a trick clip
   - Inappropriate / NSFW
   - Duplicate clip
   - Low quality / unwatchable
   - Stolen content / no attribution
   - Dangerous / unsafe technique
3. User optionally adds free-text notes.
4. Report is stored for admin review.

### 7.6 Trick request flow
1. User encounters missing trick (during search or upload).
2. User clicks "Request this trick" link.
3. In-app form: trick name (required) + optional notes/description.
4. Request stored in `trick_requests` table.
5. Admin reviews queue and can approve (create the trick) or reject.

---

## 8. Information Architecture / Pages

### 8.1 Homepage `/`
- Prominent search bar at the top (autocomplete dropdown)
- "Top Tricks This Week" section: responsive grid of 8–12 trick cards
- Each card shows: trick name, clip count, top clip thumbnail
- Fallback when insufficient vote data: rank by recent upload count
- Navigation bar at top

### 8.2 Trick page `/tricks/[slug]`
- Trick name prominent at top
- Sort toggle: Top | Newest | Rising
- Clip count displayed
- Infinite-scroll list of clip items
- Each clip item: thumbnail, performer name, score (split like/dislike counts), relative upload time
- Click opens clip modal (see §7.3)
- Name-based slug; old slugs redirect on rename

### 8.3 Browse all tricks `/tricks`
- Alphabetical list of all active tricks
- Optional letter filter (A–Z)
- Each trick links to its trick page

### 8.4 Upload page `/upload`
- Video file input
- Preview player (shows selected video before upload)
- Trick selector (multi-select autocomplete, 1–3 tricks, required)
- Performer name field (optional free-text, placeholder: "Who is performing?")
- Clear validation errors for file type, size, duration
- Upload progress indicator
- Requires authentication (redirect to login if not authenticated)

### 8.5 Favorites page `/favorites`
- Private page for authenticated users
- Flat list of favorited clips, most recently favorited first
- Each item shows: clip thumbnail, trick name, performer, score
- Unfavorite action available
- Responsive layout

### 8.6 Auth pages
- Sign in (email/password + Google OAuth)
- Sign up (email/password + Google OAuth)
- Username prompt (shown on first upload/action if no username set)

### 8.7 Admin pages `/admin/*`
- `/admin/tricks` — create/edit canonical tricks
- `/admin/aliases` — create/edit trick aliases
- `/admin/reports` — review and action reports
- `/admin/requests` — review trick requests (approve/reject)
- `/admin/clips` — moderate clips (hide/remove)
- Can be simple/internal — polished UI not required

---

## 9. Data Model

### 9.1 `users`
Partially backed by Supabase Auth.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID PK | Matches auth user ID |
| `username` | text unique nullable | Set on first action, 3–20 chars, alphanumeric + underscores |
| `is_admin` | boolean default false | Set manually in DB |
| `created_at` | timestamptz default now() | |

### 9.2 `tricks`
Canonical trick list, admin-managed.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID PK | |
| `name` | text unique not null | Display name |
| `normalized_name` | text unique not null | Lowercased, trimmed, collapsed spaces |
| `slug` | text unique not null | URL-safe, used in routing |
| `is_active` | boolean default true | |
| `created_at` | timestamptz default now() | |

### 9.3 `trick_aliases`
Alias table for search resolution.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID PK | |
| `trick_id` | UUID FK → tricks(id) ON DELETE CASCADE | |
| `alias` | text not null | Display form |
| `normalized_alias` | text unique not null | For matching; globally unique |
| `created_at` | timestamptz default now() | |

### 9.4 `clips`
Uploaded clip metadata.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users(id) | Uploader |
| `storage_path` | text not null | e.g., `clips/{uuid}.mp4` |
| `thumbnail_path` | text nullable | Auto-generated thumbnail |
| `performer_name` | text nullable | Free-text, shows "Unknown" if null |
| `duration_seconds` | integer not null | Client-validated ≤ 20 |
| `file_size_bytes` | bigint not null | Client-validated ≤ 100MB |
| `mime_type` | text not null | video/mp4, video/quicktime, video/webm |
| `status` | text not null default 'active' | active, hidden, removed |
| `content_hash` | text nullable | Reserved for future duplicate detection |
| `created_at` | timestamptz default now() | |

### 9.5 `clip_tricks`
Many-to-many association (1–3 tricks per clip).

| Field | Type | Notes |
|-------|------|-------|
| `clip_id` | UUID FK → clips(id) ON DELETE CASCADE | |
| `trick_id` | UUID FK → tricks(id) ON DELETE CASCADE | |
| `created_at` | timestamptz default now() | |

Constraint: unique `(clip_id, trick_id)`

### 9.6 `clip_votes`
One vote per user per clip.

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | UUID FK → users(id) ON DELETE CASCADE | |
| `clip_id` | UUID FK → clips(id) ON DELETE CASCADE | |
| `value` | smallint not null | CHECK value IN (-1, 1) |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |

Constraint: unique `(user_id, clip_id)`

Behavior:
- Clicking like sets vote to `1`
- Clicking dislike sets vote to `-1`
- Clicking the same vote again **removes the vote** (delete row)

### 9.7 `clip_favorites`

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | UUID FK → users(id) ON DELETE CASCADE | |
| `clip_id` | UUID FK → clips(id) ON DELETE CASCADE | |
| `created_at` | timestamptz default now() | |

Constraint: unique `(user_id, clip_id)`

### 9.8 `clip_reports`

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users(id) ON DELETE CASCADE | |
| `clip_id` | UUID FK → clips(id) ON DELETE CASCADE | |
| `reason` | text not null | Predefined category |
| `notes` | text nullable | Optional free-text details |
| `status` | text not null default 'open' | open, reviewed, dismissed, actioned |
| `created_at` | timestamptz default now() | |

Predefined reason values:
- `wrong_trick`
- `not_a_trick`
- `inappropriate`
- `duplicate`
- `low_quality`
- `stolen_content`
- `dangerous_technique`

### 9.9 `trick_requests`
User-submitted requests for new tricks.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users(id) ON DELETE CASCADE | |
| `trick_name` | text not null | Requested trick name |
| `notes` | text nullable | Optional context |
| `status` | text not null default 'pending' | pending, approved, rejected |
| `created_at` | timestamptz default now() | |

---

## 10. Search Design

### 10.1 Search target
Search resolves **tricks**, not clips. The search box directs users to trick pages.

### 10.2 Search inputs supported
Match against:
- Canonical trick name
- Aliases
- Normalized forms

Examples: `double cork`, `Double Cork`, `doublecork`, `dub cork`

### 10.3 Search normalization
Normalization function applied to all names, aliases, and queries:
- Lowercase
- Trim leading/trailing whitespace
- Collapse repeated spaces
- Replace hyphens/underscores with spaces
- Strip punctuation

Store normalized forms in DB.

### 10.4 Autocomplete behavior
- Debounced ~200ms
- Dropdown shows matching tricks as user types
- Keyboard navigable (arrow keys + enter)
- Show canonical trick name in results
- Subtly indicate alias match (e.g., "Double Cork — matched 'dub cork'")
- On zero results: show fuzzy/similar suggestions + "Request this trick" link

### 10.5 Fuzzy matching
When exact/prefix matching returns no results, attempt fuzzy matching (e.g., Levenshtein distance or trigram similarity) to suggest close matches before falling back to the trick request prompt.

---

## 11. Ranking Logic

### 11.1 Trick page clip ranking — Top (default)
1. Clip score descending (score = sum of vote values)
2. `created_at` descending as tie-break

Example: 10 likes, 2 dislikes → score 8

### 11.2 Trick page clip ranking — Newest
1. `created_at` descending

### 11.3 Trick page clip ranking — Rising
Clips uploaded in the last 48–72 hours with score > 0, sorted by score descending. Surfaces quality new content that the community is validating.

### 11.4 Homepage "Top Tricks This Week"
Rank tricks by sum of votes on clips attached to each trick where vote `created_at >= now() - interval '7 days'`.

**Cold start fallback**: when insufficient vote data, rank tricks by number of clips uploaded in the last 7 days.

### 11.5 Collapse threshold
Clips with net score ≤ **-5** are displayed in a collapsed state on trick pages. They remain present but require a click to expand. Hardcoded for v1.

---

## 12. Upload Constraints and Validation

### 12.1 File type
Allowed MIME types:
- `video/mp4`
- `video/quicktime`
- `video/webm`

### 12.2 Clip duration
- Maximum: **20 seconds**
- Enforced **client-side only** in v1 (reading video element metadata)
- Surfaced clearly in upload UI

### 12.3 File size
- Maximum: **100 MB**

### 12.4 Required fields
- Video file
- At least one trick tag (max 3)

### 12.5 Optional fields
- Performer name (free-text)

### 12.6 Upload preview
- Show selected video in a player before upload (v1)
- Video trim UI planned for **v2**

### 12.7 Multi-tag nudge
- At 2+ tricks selected, show: "Best clips focus on a single trick"
- Hard cap at 3 trick tags

### 12.8 Rate limiting
- No upload rate limit in v1
- Rely on reports and moderation for abuse

### 12.9 Thumbnails
- Auto-generated only (extract frame at ~50% video duration via browser canvas)
- No custom thumbnail upload
- Store path in `thumbnail_path` on clip record

### 12.10 Duplicate discouragement
- `content_hash` field reserved for future use
- No active duplicate detection in v1
- Rely on votes and reports

---

## 13. Moderation and Safety

### 13.1 Required capabilities in v1
- Users can report clips (predefined categories + optional notes)
- Admins can hide/remove clips (set status to `hidden` or `removed`)
- Clips can be downvoted; score ≤ -5 triggers visual collapse
- Admins can review reports and trick requests

### 13.2 Disallowed content categories
- Pornography / explicit sexual content
- Unrelated spam uploads
- Graphic illegal content
- Abusive or malicious content

### 13.3 Initial strategy
- Report-based moderation
- Admin review via `/admin` pages
- Optional lightweight automatic filtering if easy to integrate
- Do not block launch on sophisticated content moderation

### 13.4 Public bucket + moderation
- Videos in public Supabase Storage bucket
- When clip status is set to `hidden` or `removed`, the clip is excluded from all queries
- Consider deleting storage files for `removed` clips to prevent continued URL access

---

## 14. Authentication and Permissions

### 14.1 Auth methods
- Email + password
- Google OAuth
- Both via Supabase Auth

### 14.2 Username collection
- Not required at signup
- Prompted on first action (upload, etc.) if no username set
- Constraints: 3–20 characters, alphanumeric + underscores, unique

### 14.3 Permission rules

**Guests:**
- Read public tricks
- Read active public clips
- Search and browse

**Authenticated users:**
- Upload clips (own)
- Create/update/delete own votes
- Create/delete own favorites
- Create own reports
- Submit trick requests

**Admins:**
- Manage tricks and aliases
- Moderate clips and reports
- Review trick requests

### 14.4 Auth wall behavior
- Upload page: redirect to login with return URL back to `/upload`
- Other protected actions: redirect to login with return to current page

### 14.5 Row Level Security
RLS on tables with user-specific writes:
- `clip_votes`
- `clip_favorites`
- `clip_reports`
- `clips` (ownership)
- `trick_requests` (ownership)

Public read access only exposes `active` clips.

---

## 15. API / Data Access Design

Use Next.js server actions and/or route handlers with Supabase client. Keep write operations validated server-side.

### Required operations:
- List top tricks this week (with cold-start fallback)
- Search tricks by query (autocomplete endpoint)
- Get trick page data (trick info + paginated clips with scores)
- Upload clip metadata + storage
- Create clip-trick links
- Submit / update / remove vote
- Toggle favorite
- Submit report
- Submit trick request
- Admin: create/edit trick
- Admin: create/edit alias
- Admin: moderate clip/report
- Admin: review trick requests

---

## 16. Video Playback UX

### 16.1 Trick page behavior
- Clips displayed as a scrollable list of thumbnail cards
- Clicking a clip opens a **modal/overlay**
- Only one clip plays at a time

### 16.2 Modal player features
- Video loops by default
- Playback speed controls: **0.25x, 0.5x, 1x, 2x**
- Like/dislike buttons with split counts
- Favorite and report buttons
- Performer name and uploader attribution
- Prev/next navigation (arrows + keyboard left/right)
- Deep-linkable URL via query param: `/tricks/[slug]?clip=[id]`

### 16.3 Mobile behavior
- Responsive vertical list layout (same as desktop, optimized for touch)
- Larger tap targets
- Modal works full-screen or near-full-screen on mobile
- No swipeable card stack — consistent experience across devices

---

## 17. UI / UX Requirements

### 17.1 General tone
- Clean, modern, minimal
- Light + clean aesthetic (white/light gray, sharp typography, colored accents)
- Search-first, utility-oriented
- No flashy social-media styling

### 17.2 Homepage
- Search input visually dominant near top
- Grid of 8–12 trick cards below
- Each card: trick name, clip count, top clip thumbnail
- No onboarding or welcome tour

### 17.3 Trick page
- Trick name prominent
- Sort toggle: Top | Newest | Rising
- Clip list easy to scan (infinite scroll)
- Modal for focused clip viewing with navigation

### 17.4 Upload page
- Video file input with preview player
- Clear progress feedback during upload
- Clear validation errors
- Trick selector autocomplete feels responsive
- Performer name field with "Who is performing?" placeholder
- Multi-tag nudge message

### 17.5 Favorites page
- Private study list
- Flat list, most recently favorited first
- Soft warning when saving 2nd favorite for same trick

### 17.6 Mobile support
- Responsive from day one
- Touch-optimized controls
- Vertical list layout on trick pages

### 17.7 Accessibility
- Keyboard navigable search, forms, and clip modal (including prev/next via arrow keys)
- Visible focus states
- Semantic buttons
- Alt text / labels where appropriate

---

## 18. Performance Expectations

### 18.1 Trick page
- Fast loading, avoid N+1 queries
- Paginate clips (20 per batch, infinite scroll)

### 18.2 Search
- Autocomplete ≤ 200ms perceived latency
- Server-side search, not client-side dataset

### 18.3 Video
- Public bucket allows CDN caching
- Only one video plays at a time (no multiple simultaneous loads)
- Thumbnails for list view to avoid loading video data until modal opens

### 18.4 Ranking queries
- Add views or denormalized aggregates if queries become slow
- Do not prematurely optimize

---

## 19. Database Constraints Summary

- Trick names unique
- Trick slugs unique
- Normalized trick names unique
- Normalized aliases globally unique
- Clip must have 1–3 linked tricks (application layer)
- Vote value must be -1 or 1
- One favorite per user per clip
- One vote per user per clip
- One clip-trick link per clip/trick pair
- Username unique, 3–20 chars, alphanumeric + underscores

---

## 20. Suggested SQL Views

### 20.1 Clip score view
Returns each clip with aggregated score (sum of votes), like count, and dislike count.

### 20.2 Trick weekly score view
Returns each trick with last-7-days vote sum and upload count for homepage ranking.

### 20.3 Trick page query
Given a trick slug:
- Fetch trick info
- Fetch attached clips with scores (like count, dislike count, net score)
- Support sort by: Top (score desc, created_at desc), Newest (created_at desc), Rising (last 72 hours, score > 0, score desc)
- Paginate with cursor-based or offset pagination

### 20.4 Search query
Given normalized input:
- Match tricks on canonical names and aliases (prefix + fuzzy)
- Return distinct trick results ranked by match quality

---

## 21. SEO / Metadata

### 21.1 Trick pages
- Title: `<trick name> Study Clips — TrickDB`
- Description: `Community-ranked study clips for <trick name>`
- Open Graph metadata for sharing

### 21.2 Public indexing
- Allow public trick pages to be indexed
- Name-based slugs for clean URLs
- Old slugs redirect on trick rename

---

## 22. Storage Architecture

### 22.1 Supabase Storage bucket
- **Public** bucket named `clips`
- UUID-based flat paths: `clips/{uuid}.{ext}`
- Thumbnails stored in `thumbnails/{uuid}.jpg`
- URLs are not guessable but publicly accessible
- CDN-cacheable

### 22.2 Cleanup
- When clip status is set to `removed`, consider deleting the storage file
- When clip is `hidden`, file remains but clip is excluded from queries

---

## 23. Route Structure

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Homepage with search + top tricks |
| `/tricks` | Public | Browse all tricks alphabetically |
| `/tricks/[slug]` | Public | Trick page with ranked clips |
| `/tricks/[slug]?clip=[id]` | Public | Deep link to specific clip modal |
| `/upload` | Auth required | Upload flow |
| `/favorites` | Auth required | Private favorites list |
| `/auth/login` | Public | Sign in |
| `/auth/signup` | Public | Sign up |
| `/admin/tricks` | Admin | Manage tricks |
| `/admin/aliases` | Admin | Manage aliases |
| `/admin/reports` | Admin | Review reports |
| `/admin/requests` | Admin | Review trick requests |
| `/admin/clips` | Admin | Moderate clips |

---

## 24. Non-Goals / What to Avoid

Do not drift into building a generic social media clone. Avoid:
- Followers / following
- Profile-first architecture
- Comment threads
- Direct messaging
- General feed ranking unrelated to trick pages
- Creator monetization
- Advanced notification systems
- AI-heavy systems
- User-generated trick creation
- Combo-specific trick entries (combos are tagged to constituent tricks)
- Captions (removed from spec)

---

## 25. Implementation Priorities

### Phase 1 — Skeleton + Schema
- Project setup (Next.js + TypeScript + Tailwind)
- Supabase project setup
- Auth wiring (email + Google OAuth)
- Database schema + migrations
- RLS policies
- Storage bucket setup
- Basic trick seed data

### Phase 2 — Core Upload and Trick Pages
- Upload page with preview player
- Video storage upload + thumbnail generation
- Clip creation with trick association
- Performer name field
- Trick pages showing clips in modal
- Clip modal with speed controls and navigation

### Phase 3 — Search and Ranking
- Trick search with aliases (autocomplete dropdown)
- Fuzzy matching for zero results
- Clip score aggregation
- Three sort options (Top, Newest, Rising)
- Homepage top tricks this week (with cold-start fallback)
- Browse all tricks page

### Phase 4 — User Interactions
- Voting (toggle, split counts)
- Favorites (soft warning on duplicates per trick)
- Reporting (predefined categories + notes)
- Trick request form + admin queue

### Phase 5 — Moderation and Polish
- Admin pages for tricks, aliases, reports, requests, clips
- Hidden/removed clip handling
- Downvote collapse threshold
- Mobile polish
- Validation polish
- Username prompt flow
- Infinite scroll pagination

---

## 26. Future Considerations (Post-V1)

These are explicitly out of scope for v1 but noted for future planning:
- Video trim UI in upload flow
- Trick categories / difficulty tiers / prerequisite graph
- Combo trick entries as canonical tricks
- Account deletion (with content anonymization)
- Notifications (in-app and/or email)
- Wilson score or decay-based hot ranking
- Server-side video duration validation
- Performer entities (normalized, searchable, with performer pages)
- Trusted users / moderator role
- Strike system and account suspension
- Automated NSFW screening
- Upload rate limiting
- Custom thumbnail selection
- Onboarding flow

---

## 27. Key Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Trick tagging | 1–3 tags, nudge toward 1 | Trick dictionary, not combo showcase |
| Captions | Removed | Unnecessary for trick dictionary |
| Performer field | Free-text, optional | Uploader ≠ performer; shows "Unknown" if blank |
| Vote toggle | Click same vote to remove | Standard toggle UX |
| Vote display | Split like/dislike counts | Users can gauge controversy |
| Collapse threshold | Score ≤ -5, hardcoded | Keep quality visible, hide noise |
| Trick categories | None in v1 | Flat list, add later |
| Clip player | Modal with prev/next | One-at-a-time focused study |
| Playback speed | 0.25x, 0.5x, 1x, 2x | Essential for study tool |
| Search | Autocomplete dropdown | Fast, modern, direct to trick page |
| Zero results | Fuzzy suggestions + request link | Connects to trick request flow |
| Sort options | Top, Newest, Rising | Rising = last 72h, score > 0 |
| Homepage | Grid of 8–12 trick cards with thumbnails | Visual, browsable |
| Cold start | Fallback to upload count | Always shows something |
| Pagination | Infinite scroll, 20 per batch | Natural browsing |
| Auth | Email + Google OAuth | Balances simplicity and friction |
| Usernames | Prompted on first action | Reduces signup friction |
| Thumbnails | Auto-generated from video | Consistent, abuse-proof |
| Storage | Public bucket, UUID flat paths | Simple, CDN-cacheable |
| Admin | is_admin boolean, /admin routes | Simplest for v1 |
| Reports | 7 predefined categories + optional notes | Structured for triage |
| Trick requests | In-app form + admin queue | Crowdsource gaps safely |
| Upload limit | None in v1 | Maximize early content |
| Favorites nudge | Soft warning on 2nd per trick | Encourage focused study list |
| Notifications | None in v1 | Ship fast |
| Account deletion | Deferred | Ship fast |
| Trim UI | V2 | Preview only in v1 |
| Visual style | Light + clean | Modern, accessible, good video contrast |
| Brand name | TrickDB (placeholder) | Swappable |
| Mobile | Responsive vertical list | Consistent cross-device |
| Onboarding | None | UI should be self-explanatory |
| Deep links | Query param on trick page URL | Shareable clip links |
| Browse all | /tricks alphabetical | Discovery beyond search |
