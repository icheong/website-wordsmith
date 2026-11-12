You are an expert full-stack engineer. Your task is to build a minimalist, distraction-free web application called "WordSmith Studio" hosted at wordsmith.utilifygrid.com, strictly following the specifications and architecture outlined in the accompanying `IMPLEMENTATION_PLAN.md` file.

### Core Directive:
Read and execute the build plan step-by-step from `IMPLEMENTATION_PLAN.md`. Ensure that every module described in the plan is fully implemented:
1. **The Static Prompt Library** (JSON-driven, zero AI dependency).
2. **The Sentence-Expansion Workshop** (Step-by-step micro-drills for primary school sentence building).
3. **The Split-Screen "Lightbox" Workspace** (Webcam snapshot tool on the left, clean craft editor on the right).
4. **The Parent Annotation Overlay** (Click-to-pin coordinate comments on scanned images).
5. **Supabase Integration** (Auth for 2 kids + 1 parent, PostgreSQL database tables for submissions and annotations, and Supabase Storage for scanned notebook images).

### Tech Stack Constraints:
- Frontend: React (Vite) with Tailwind CSS. Maintain an ultra-clean, modern, distraction-free "writing studio" aesthetic—absolutely no noisy gamification, cartoon avatars, or distracting point systems.
- Backend/Auth/DB: Supabase.

### Instructions for Code Generation:
- Provide the complete folder structure and modular code files corresponding to the phases in `IMPLEMENTATION_PLAN.md`.
- Write clean, production-ready code with clear comments.
- Do not skip any features listed in the feature modules or database schema sections.