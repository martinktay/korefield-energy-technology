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
- New Conversation flow: role-aware contact picker grouped by role, supports creating DMs or named group channels
- Participant management: view participants panel on group channels, add new participants from accessible contacts
- Role-based access control: Instructors can message Learners, Admins, and other Instructors; Admins and Super Admins can message everyone; Learners can message Instructors and Admins
- Online status indicators on contact avatars
- Cross-role channels: e.g. "Learner Support" channel with both Instructors and Learners

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

## Recruitment & HR (Admin Portal)
- Recruitment pipeline managed within the Admin portal under `/admin/recruitment`
- Public careers page (`/careers`) accepts applications with CV upload and ATS keyword matching
- Admin recruitment dashboard shows: pipeline KPIs (total applications, in review, shortlisted, hired), application table with ATS scores, status management (New → In Review → Shortlisted → Interview → Offer → Hired / Rejected)
- Application detail view: candidate info, ATS match score with matched/missing keywords, CV download, cover note, status history, reviewer notes
- Hiring managers (Admin, Super Admin) can change application status, add notes, and download CVs
- Notifications: Admins receive bell notifications for new applications; Super Admins see hiring pipeline metrics
- Job descriptions aligned to platform tech stack: Next.js, NestJS, LangChain, LangGraph, AWS, Prisma, Tailwind
- ATS scoring: client-side keyword extraction from uploaded CV text, matched against job-specific keyword lists

## Finance & Accounting (Super Admin Portal)
- Finance module at `/super-admin/finance` accessible by Super Admin and Finance Admin roles
- 5 tabbed sections: P&L Overview, CapEx, OpEx, Payroll & PAYE, Tax Obligations
- P&L Overview: revenue vs expenses (MTD/QTD/YTD), gross margin, net profit, burn rate, cash runway, monthly expense breakdown by category
- CapEx Tracker: one-time investments (infrastructure, equipment, software licenses) with depreciation schedules and payment status
- OpEx Tracker: recurring monthly costs (cloud hosting, SaaS, marketing, professional services) with vendor and frequency
- Payroll & PAYE: staff compensation table with gross salary, PAYE tax, pension, NHIS contributions, net pay; totals row
- Tax Obligations: corporate income tax, PAYE remittance, VAT/NHIL, withholding tax with jurisdiction, rates, due dates, and paid/upcoming status
- Backend: FinanceModule with P&L summary, payroll aggregation, and recruitment cost endpoints; RBAC restricted to SuperAdmin + FinanceAdmin
