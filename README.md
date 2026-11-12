# WordSmith Studio

A minimalist, distraction-free web application for primary school students to
practice sentence expansion and writing craftsmanship through a hybrid
paper-to-digital workflow: scan the notebook page, refine it in a clean editor,
and let a parent pin feedback directly onto the scan.

**Target domain:** `wordsmith.utilifygrid.com` (Cloudflare Pages)

## Features

| Module | What it does |
| --- | --- |
| **A. Static Prompt Library** | 24 hand-curated prompts across Sensory / Perspective / Atmosphere collections, loaded from local JSON — zero AI dependency. Clicking a prompt makes it the active writing task and opens the Workspace. |
| **B. Sentence Workshop** | *Expand-a-Sentence Ladder* (Skeleton → Setting → Detail → Action/Consequence) and *Paragraph Pillars* (colour-coded Pillar / Beams / Anchor). Both autosave and hand their draft to the split-screen editor. |
| **C. Split-screen Lightbox Workspace** | Left pane: webcam capture (or file upload) of the physical notebook page, uploaded to Supabase Storage and shown on a zoomable lightbox. Right pane: ruled, serif, distraction-free editor with prompt banner, autosave and submit. |
| **Parent Annotation Overlay** | Click the scan to pin a numbered sticky note (stored as percentage coordinates). Children read the pins; only the parent can create them. |
| **Review flow** | Child submits (`draft → submitted`); parent reviews in a dedicated tab, pins notes, then marks it `reviewed` (or reopens it as a draft). |
| **Supabase** | Email/password auth for the seeded family accounts (2 kids + 1 parent), PostgreSQL tables with row-level security, and Storage for scans. |

Design language: warm paper background, near-black ink, one muted ink-blue
accent, generous whitespace — **no gamification, avatars or points**.

## Tech stack

- **React 19 + Vite 8** (frontend)
- **Tailwind CSS v4** (styling, `src/index.css` theme tokens)
- **Supabase** — Auth, PostgreSQL, Storage
- No router: a single tabbed app shell (`Prompts · Sentence Workshop · Workspace · Reviews`)

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure Supabase

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
(Supabase Dashboard → Project Settings → API).

Then run **`supabase/schema.sql`** in the Supabase SQL editor
(Dashboard → SQL Editor → New query). It creates:

- `profiles`, `submissions`, `annotations` (with RLS policies)
- a trigger that auto-creates a profile for each auth user
- the public `notebook-scans` storage bucket with scoped policies

### 3. Seed the three accounts (login only — no public sign-up)

Supabase Dashboard → **Authentication → Users → Add user**, and set the
**User metadata** JSON:

| Account | Metadata |
| --- | --- |
| Parent | `{ "role": "parent", "display_name": "Mum" }` |
| Child 1 | `{ "role": "child", "display_name": "Mia" }` |
| Child 2 | `{ "role": "child", "display_name": "Leo" }` |

If you created users without metadata, back-fill (see the cheat sheet at the
bottom of `schema.sql`):

```sql
update public.profiles
set role = 'parent', display_name = 'Mum'
where id = (select id from auth.users where email = 'you@example.com');
```

### 4. Run

```bash
npm run dev      # http://localhost:5173
npm run build    # production bundle → dist/
npm run lint     # oxlint
```

## Folder structure

```
├── supabase/schema.sql          # tables, RLS, auth trigger, storage bucket
├── src/
│   ├── App.jsx                  # providers + login/shell switch
│   ├── index.css                # Tailwind theme (warm-paper tokens)
│   ├── data/prompts.json        # Module A — static prompt library
│   ├── lib/
│   │   ├── supabase.js          # configured client (null until .env set)
│   │   └── format.js            # word count, dates, status metadata
│   ├── context/
│   │   ├── AuthContext.jsx      # session + profile + role
│   │   ├── StudioContext.jsx    # tabs, open submission, autosave queue
│   │   └── ToastContext.jsx     # transient feedback
│   ├── components/
│   │   ├── Shell.jsx            # tabbed app shell (top bar + routing)
│   │   ├── workshop/            # SentenceLadder, ParagraphPillars
│   │   └── workspace/           # Lightbox, WebcamCapture, AnnotationLayer, Editor
│   └── pages/
│       ├── LoginPage.jsx
│       ├── PromptLibrary.jsx    # Module A
│       ├── WorkshopPage.jsx     # Module B
│       ├── WorkspacePage.jsx    # Module C (split screen)
│       └── ReviewsPage.jsx      # parent review queue
```

## Data model

- **`profiles`** — `id`, `role` (`child` | `parent`), `display_name`
- **`submissions`** — `user_id`, `module_type` (`sentence_ladder` |
  `paragraph_builder` | `free_write`), `image_url`, `typed_text`, `status`
  (`draft` | `submitted` | `reviewed`), plus documented extensions:
  `title`, `prompt_text`, `module_data` (jsonb drill state), `updated_at`
- **`annotations`** — `submission_id`, `x_coord` / `y_coord` (0–100 % of the
  scanned image), `comment_text`, `author_id`

Row-level security: owners CRUD their own rows; the parent can read/update all
submissions and is the only role allowed to insert annotations.

## Deployment (Cloudflare Pages)

1. Push the repository to GitHub/GitLab.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Add the custom domain `wordsmith.utilifygrid.com` under
   **Custom domains** (DNS on the same Cloudflare account).
