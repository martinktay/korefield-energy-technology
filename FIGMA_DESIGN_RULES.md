# KoreField Academy — Figma Design System Rules

These rules guide the translation of Figma designs into production-ready code for the KoreField Academy frontend. They must be followed for every Figma-driven implementation task.

## Figma MCP Integration — Required Flow

1. Run `get_design_context` first to fetch the structured representation for the exact node(s)
2. If the response is too large or truncated, run `get_metadata` to get the high-level node map, then re-fetch only the required node(s) with `get_design_context`
3. Run `get_screenshot` for a visual reference of the node variant being implemented
4. Only after you have both `get_design_context` and `get_screenshot`, download any assets needed and start implementation
5. Translate the output (typically React + Tailwind) into this project's conventions, styles, and framework
6. Validate against the Figma screenshot for 1:1 look and behavior before marking complete

## Tech Stack

- Next.js 14+ (App Router) with TypeScript
- Tailwind CSS for all styling (no CSS Modules, no styled-components)
- React Query (`@tanstack/react-query`) for server state
- Zustand for client-side UI state (stores in `src/stores/`)
- Path alias: `@/` maps to `src/`

## Project Structure

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── (portals)/          # Portal route groups
│   │   ├── learner/        # /learner/* (dashboard, lessons, pods, payments, certificates, profile, progress, tracks, foundation)
│   │   ├── instructor/     # /instructor/* (dashboard, cohorts, grading, content, schedule, assessor, messages, profile)
│   │   ├── admin/          # /admin/* (dashboard, users, enrollments, curriculum, payments, certificates, messages, profile)
│   │   ├── super-admin/    # /super-admin/* (dashboard, revenue, enrollment, academic, platform, ai, market, messages, profile)
│   │   └── corporate/      # /corporate/* (dashboard, learners, billing, profile)
│   ├── pricing/            # Public pricing page
│   └── globals.css         # Tailwind base + shadcn CSS variables
├── components/
│   ├── layout/             # NavigationShell, TopBar (with notifications + avatar), Sidebar
│   ├── feedback/           # LoadingState, EmptyState, ErrorState
│   ├── ui/                 # shadcn/ui: Button, Badge, Card, Separator, Sonner (Toaster)
│   ├── profile/            # ProfilePage (shared across all portals)
│   ├── messaging/          # MessagingPage (staff), PodChat (learners with emoji/reactions)
│   └── content/            # AssessmentBuilder (MCQ, coding, drag-drop question types)
├── lib/
│   ├── api.ts              # Shared apiFetch<T>() client
│   ├── utils.ts            # cn() utility (clsx + tailwind-merge)
│   └── pyodide-runner.ts   # Client-side Python execution via Pyodide WASM
├── providers/
│   └── query-provider.tsx  # React Query provider (staleTime: 60s, retry: 1)
└── stores/
    └── ui-store.ts         # Zustand store for sidebar state
```

## Component Rules

- IMPORTANT: Always check `src/components/` for existing components before creating new ones
- Layout components: `src/components/layout/` — NavigationShell, TopBar, Sidebar
- Feedback components: `src/components/feedback/` — LoadingState, EmptyState, ErrorState
- New shared UI components go in `src/components/<category>/` with a barrel `index.ts`
- Page components go in `src/app/(portals)/<portal>/` following Next.js App Router conventions
- Use named exports for components (not default), except for page components which use `export default`
- Components use PascalCase filenames in kebab-case files (e.g., `loading-state.tsx` exports `LoadingState`)
- All components must accept appropriate ARIA attributes for accessibility
- Use `"use client"` directive only when the component needs interactivity (hooks, event handlers, browser APIs)

## Design Tokens — Color Palette

IMPORTANT: Never hardcode hex colors. Always use Tailwind classes referencing these tokens defined in `tailwind.config.ts`:

| Token | Usage |
|-------|-------|
| `brand-50` to `brand-950` | Primary brand blues — buttons, links, active states, focus rings |
| `accent-50` to `accent-950` | Success/positive greens — completion indicators, CTAs |
| `surface-0` to `surface-950` | Neutral grays — backgrounds, text, borders, cards |
| `status-success` | `#16a34a` — success messages, completed states |
| `status-warning` | `#d97706` — warnings, attention needed |
| `status-error` | `#dc2626` — errors, destructive actions |
| `status-info` | `#2563eb` — informational messages |
| `learning-completed` | `#16a34a` — completed modules/lessons |
| `learning-in-progress` | `#2563eb` — active learning items |
| `learning-locked` | `#94a3b8` — locked/unavailable content |
| `learning-upcoming` | `#e2e8f0` — future scheduled items |

Common patterns:
- Page background: `bg-surface-50`
- Card background: `bg-surface-0`
- Primary text: `text-surface-900`
- Secondary text: `text-surface-500` or `text-surface-600`
- Borders: `border-surface-200`
- Active nav item: `bg-brand-50 text-brand-700`
- Primary button: `bg-brand-600 text-white hover:bg-brand-700`

## Design Tokens — Typography

IMPORTANT: Use the custom font size utilities, not raw Tailwind sizes:

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-display-lg` | 3rem / 700 | Bold | Hero headings |
| `text-display-sm` | 2.25rem / 700 | Bold | Section heroes |
| `text-heading-lg` | 1.5rem / 600 | Semibold | Page titles (h1) |
| `text-heading-sm` | 1.25rem / 600 | Semibold | Section headings (h2), card titles |
| `text-body-lg` | 1rem / 400 | Regular | Body text (default) |
| `text-body-sm` | 0.875rem / 400 | Regular | Secondary text, nav items, table cells |
| `text-caption` | 0.75rem / 400 | Regular | Labels, timestamps, metadata |

Fonts:
- `font-sans` — Inter (primary, all UI text)
- `font-mono` — JetBrains Mono (code blocks, Monaco Editor)

## Design Tokens — Spacing & Layout

- Use Tailwind's default spacing scale plus custom values: `4.5` (1.125rem), `13` (3.25rem), `15` (3.75rem), `18` (4.5rem)
- Sidebar width: `w-sidebar` (16rem) / `w-sidebar-collapsed` (4rem)
- Card border radius: `rounded-card` (0.75rem)
- Card shadow: `shadow-card` (default) / `shadow-card-hover` (hover state)
- Page content padding: `p-4 lg:p-6`
- Section spacing: `space-y-6`
- Card internal padding: `p-4`

## Design Tokens — Breakpoints

Mobile-first responsive design. Minimum supported: 320px.

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `xs` | 320px | Minimum viewport |
| `sm` | 640px | Small tablets, landscape phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop — sidebar becomes static |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

## Card Pattern

Cards are the primary content container. Always use this pattern:

```tsx
<div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card hover:border-brand-300 hover:shadow-card-hover transition-all">
  {/* content */}
</div>
```

## Dashboard Layout Pattern

All portal pages use the NavigationShell wrapper:

```tsx
<NavigationShell portalName="Learner Dashboard" navItems={navItems} userName="Kofi Mensah" userRole="learner">
  {/* page content */}
</NavigationShell>
```

The shell provides: sticky TopBar (with notification bell + avatar dropdown with profile/settings/sign-out) + responsive Sidebar + scrollable main content area.

## Loading / Empty / Error States

IMPORTANT: Every data-driven view must handle all three states:

- Loading: Use skeleton screens (`animate-pulse` + `bg-surface-200`), not spinners. Text placeholders render before media.
- Empty: Use `<EmptyState>` from `@/components/feedback` — illustration + message + optional action. Never show blank white space.
- Error: Use `<ErrorState>` from `@/components/feedback` — friendly message + retry button. Never show raw error codes or stack traces.

## Data Fetching Pattern

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const { data, isLoading, error } = useQuery({
  queryKey: ["domain", "resource"],
  queryFn: () => apiFetch<ResponseType>("/endpoint"),
});
```

- API client: `apiFetch<T>()` from `@/lib/api` — handles base URL, JSON headers, credentials
- Query keys: `["domain", "resource", ...params]`
- Provide fallback data for graceful degradation when API is unavailable

## Client State Pattern

Zustand stores in `src/stores/`. Current store: `useUIStore` for sidebar state.

```tsx
import { useUIStore } from "@/stores/ui-store";
const { sidebarOpen, setSidebarOpen } = useUIStore();
```

## Asset Handling

- Icons: `lucide-react` is the icon library used across all components
- shadcn/ui components in `src/components/ui/` — Button, Badge, Card, Separator (Tailwind v3 compatible versions)
- `cn()` utility from `@/lib/utils` for conditional class merging (clsx + tailwind-merge)
- Sonner (`sonner`) for toast notifications via `<Toaster>` in root layout
- Store downloaded image assets in `public/assets/`

## Accessibility Requirements

- All interactive elements must have accessible names (`aria-label`, visible text, or `aria-labelledby`)
- Use semantic HTML: `<nav>`, `<main>`, `<section>`, `<header>`, `<ul role="list">`
- Active navigation items use `aria-current="page"`
- Loading states use `role="status"` with `aria-label`
- Error states use `role="alert"`
- Progress bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Screen-reader-only text uses `sr-only` class
- Color contrast must meet WCAG AA standards

## Naming Conventions

- Files: kebab-case (`loading-state.tsx`, `ui-store.ts`)
- Components: PascalCase (`LoadingState`, `NavigationShell`)
- Hooks/stores: camelCase with `use` prefix (`useUIStore`, `useQuery`)
- CSS classes: Tailwind utilities only — no custom CSS classes
- IDs: Domain-prefixed custom IDs (`LRN-`, `TRK-`, `CRT-`, etc.) — never auto-increment or raw UUIDs

## What NOT to Do

- Do NOT use inline styles — use Tailwind classes
- Do NOT hardcode colors, spacing, or font sizes — use design tokens
- Do NOT create CSS Modules or styled-components
- Do NOT use `npm` or `yarn` — use `pnpm`
- Do NOT show raw error codes, stack traces, or blank white space to users
- Do NOT skip loading/empty/error state handling
- Do NOT use browser `alert()` or `toast` for placeholder features — build real inline UI (dialogs, state transitions)
