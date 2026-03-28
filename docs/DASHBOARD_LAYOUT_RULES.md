# Dashboard Layout Rules — KoreField Academy

## Overview

Consistent layout patterns across all portal dashboards ensure a cohesive user experience regardless of role.

## Universal Layout Structure

Every portal follows the same shell:

```
┌──────────────────────────────────────────────────────────┐
│ Top Bar: Logo | Portal Name | Search | Notifications | Profile │
├──────────┬───────────────────────────────────────────────┤
│          │                                               │
│ Sidebar  │  Main Content Area                            │
│ Nav      │                                               │
│          │  ┌─────────────────────────────────────────┐  │
│ • Home   │  │  Page Header + Breadcrumbs              │  │
│ • Item 1 │  ├─────────────────────────────────────────┤  │
│ • Item 2 │  │                                         │  │
│ • Item 3 │  │  Content (cards, tables, charts, forms) │  │
│ • Item 4 │  │                                         │  │
│          │  └─────────────────────────────────────────┘  │
└──────────┴───────────────────────────────────────────────┘
```

## Navigation Rules

- Primary functions accessible within 2 navigation actions from dashboard home
- Sidebar navigation: collapsible on tablet, hidden on mobile (hamburger menu)
- Breadcrumbs on all pages deeper than dashboard home
- Active nav item visually highlighted

## Card Patterns

### Metric Card (KPI)
```
┌─────────────────────┐
│ Label               │
│ 1,234    ▲ 12%      │
│ vs last period       │
└─────────────────────┘
```
Used for: revenue totals, enrollment counts, completion rates, active users

### Progress Card
```
┌─────────────────────┐
│ Track Name          │
│ ████████░░░░ 67%    │
│ Module 4 of 6       │
└─────────────────────┘
```
Used for: learner progress, AI Foundation School modules, pod deliverables

### List Card
```
┌─────────────────────┐
│ Grading Queue    (5)│
│ • Submission 1  2h  │
│ • Submission 2  1d  │
│ • Submission 3  3d  │
└─────────────────────┘
```
Used for: grading queues, upcoming labs, alerts, notifications

## Table Patterns

- Sortable columns (click header to sort)
- Filterable (search/filter bar above table)
- Paginated (25 rows default, configurable)
- Row actions (view, edit, delete) as icon buttons on right
- Empty state: illustration + message + action button

## Chart Patterns

- Line charts for trends over time (revenue, enrollment, scores)
- Bar charts for comparisons (by track, by region, by level)
- Heatmaps for geographic data (enrollment density, revenue by region)
- Donut charts for distribution (payment plan split, role distribution)
- All charts lazy-loaded with skeleton placeholders

## Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| Desktop (1024px+) | Full sidebar + main content |
| Tablet (768px–1023px) | Collapsed sidebar (icons only) + main content |
| Mobile (320px–767px) | Hidden sidebar (hamburger) + full-width content |

## Loading States

- Skeleton screens for initial page load (not spinners)
- Progressive content loading: text before media, metrics before charts
- Fallback representations for media-heavy content

## Empty States

- Friendly illustration + descriptive message
- Action button when applicable ("Create your first...", "Enroll in a track")
- Never show blank white space

## Error States

- Inline error messages for form validation
- Toast notifications for transient errors
- Full-page error state for critical failures (with retry button)
- Never show raw error codes or stack traces to users
