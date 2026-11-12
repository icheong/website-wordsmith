# WordSmith Studio - Full Feature Implementation Plan

## 1. Project Overview
**WordSmith Studio** is a minimalist, distraction-free web application designed for primary school students to practice sentence expansion and writing craftsmanship using a hybrid paper-to-digital workflow. 

- **Target Domain:** `wordsmith.utilifygrid.com`
- **Hosting:** Cloudflare Pages
- **Database & Auth:** Supabase (PostgreSQL & Supabase Auth)
- **Frontend Framework:** React (Vite) + Tailwind CSS

---

## 2. Core Feature Modules

### Module A: The Static Prompt Library
- Hand-curated, multi-category prompt library (Sensory, Perspective-shifting, Atmosphere).
- Zero AI-dependency; loads instantly from a structured local JSON file.

### Module B: The Primary Sentence Workshop (Micro-Drills)
- **Expand-a-Sentence Ladder:** Step-by-step guided expansion (Skeleton $\rightarrow$ Setting $\rightarrow$ Detail $\rightarrow$ Action/Consequence).
- **Paragraph Pillars:** Visual color-coded blocks for Topic Sentence (Pillar), Supporting Details (Beams), and Closing (Anchor).

### Module C: The Split-Screen "Lightbox" & Webcam Workspace
- **Left Pane:** Webcam capture utility to snap physical notebook pages, rendering them cleanly on a digital lightbox.
- **Right Pane:** Distraction-free text editor to type up and refine work.
- **Parent Annotation Overlay:** Click-to-pin sticky notes on the scanned image for non-destructive feedback.

---

## 3. Database Schema (Supabase)

### Tables
1. **`profiles`**
   - `id` (uuid, primary key, references `auth.users`)
   - `role` (text: 'child' or 'parent')
   - `display_name` (text)
   - `created_at` (timestamp)

2. **`submissions`**
   - `id` (uuid, primary key)
   - `user_id` (uuid, references `profiles.id`)
   - `module_type` (text: 'sentence_ladder', 'paragraph_builder', 'free_write')
   - `image_url` (text - Supabase Storage bucket link for scanned page)
   - `typed_text` (text)
   - `status` (text: 'draft', 'submitted', 'reviewed')
   - `created_at` (timestamp)

3. **`annotations`**
   - `id` (uuid, primary key)
   - `submission_id` (uuid, references `submissions.id`)
   - `x_coord` (numeric)
   - `y_coord` (numeric)
   - `comment_text` (text)
   - `author_id` (uuid, references `profiles.id`)
   - `created_at` (timestamp)

---

## 4. Step-by-Step Implementation Roadmap

### Phase 1: Project Setup & Authentication
- [x] Initialize Vite + React project with Tailwind CSS.
- [x] Configure Supabase client credentials & auth sessions for two kids + parent.

### Phase 2: Feature Modules (Prompts & Sentence Builder)
- [x] Build the Static Prompt Library component.
- [x] Build the Step-by-Step Sentence-Expansion Ladder UI.

### Phase 3: The Split-Screen Lightbox & Webcam Capture
- [x] Build responsive split-screen layout.
- [x] Integrate browser Media API for snapshot capture and Supabase Storage upload.

### Phase 4: Parent Annotation Layer
- [x] Implement click-to-pin coordinate mapping on the image viewer.
- [x] Connect annotations table in Supabase for persistent feedback.

### Phase 5: Deployment
- [ ] Build production assets and configure Cloudflare Pages deployment to `wordsmith.utilifygrid.com`.