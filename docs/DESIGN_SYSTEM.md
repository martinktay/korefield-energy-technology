# Design System — KoreField Academy

## Tech Stack
- Tailwind CSS for styling + shadcn/ui component primitives (Tailwind v3 compatible)
- Next.js 14+ App Router with route-based code splitting
- React Query for server state, Zustand for client state
- lucide-react for icons
- Sonner for toast notifications
- Pyodide (CPython WASM) for client-side Python execution
- Inter font (primary), JetBrains Mono (code)

## Portal Route Structure
```
/learner/       → Learner Dashboard
/instructor/    → Instructor Portal
/admin/         → Admin Portal
/super-admin/   → Super Admin Portal
/corporate/     → Corporate Portal (feature-flagged)
```

## Responsive Design
- Mobile-first approach
- Minimum supported viewport: 320px width
- Responsive sidebar navigation
- Progressive content loading: text before media

## Performance Targets
- Initial learner-facing page load within 3 seconds on 3G
- Lazy-loading for heavy components: video players, analytics charts, dashboard widgets
- Fallback representations for media-heavy content (thumbnails, placeholders)
- Progress indicators update within 60 seconds of module completion

## Visual Consistency
- Tailwind design tokens: typography, colour palette, spacing scale, iconography
- Consistent visual indicators for learning stages: completed, in-progress, locked, upcoming
- Distraction-free module content view
- Primary functions within 2 navigation actions from dashboard

## Shared Layout Components
- Navigation shell (responsive) with TopBar (notification bell + avatar dropdown + profile link)
- Responsive sidebar with per-portal nav items
- Loading states (skeleton screens)
- Empty states
- Error states
- shadcn/ui primitives: Button, Badge, Card, Separator
- Sonner toast notifications for success confirmations

## Communication
- Staff messaging (Super Admin, Instructor, Admin) — channel-based with group channels and DMs
- Pod team chat (Learners) — workplace-style channels (#general, #standup, #code-review, #help) with emoji picker and message reactions

## Profile System
- Shared ProfilePage component across all portals
- Avatar with initials fallback (role-colored) or profile image
- Optional social links: LinkedIn, GitHub, X (Twitter), Website
- Editable bio and profile photo upload

## Content Authoring
- Module creation dialog with assessment builder
- Question types: Multiple Choice (with correct answer selection), Coding Exercise (starter code + test cases), Drag & Drop matching
- Lesson types: Video (AI avatar tutorial) and Lab (interactive code editor)

## Coding Practice Environment (Pyodide + Custom Editor)
- Four execution modes: Script Mode, Notebook Mode (Jupyter-style with Code/Markdown/Magic cells), SQL Workspace (schema browser + query editor + result tables), and Terminal Mode (sandboxed Bash/Shell)
- Real Python execution via Pyodide (CPython compiled to WebAssembly) — no backend required
- Script Mode: line numbers, Python code editor, real execution output with timing
- Notebook Mode: cell type switching (Code/Markdown/Magic), per-cell Run button, inline output, add/delete/edit cells
- SQL Mode: collapsible schema browser sidebar, Run Query/Format/Export CSV toolbar, results table with row count and execution time
- Terminal Mode: macOS-style terminal with command history, welcome message, Clear button, Ctrl+L shortcut
- Languages: Python (primary via Pyodide), SQL (via sqlite3 in Pyodide), JavaScript, Bash/Shell simulation
