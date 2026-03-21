# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains Ascensios — a world-class productivity PWA.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/ascensios)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`)
- **UI**: Shadcn/ui components, Recharts
- **Animation**: Framer Motion
- **Build**: Vite (frontend), esbuild (backend)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── ascensios/         # Ascensios PWA — main app at /
│   │   ├── src/
│   │   │   ├── pages/     # 9 pages: Dashboard, Schedule, Studies, Learning, Habits, Progress, FreeTime, Community, Settings
│   │   │   ├── components/
│   │   │   │   ├── layout/AppLayout.tsx   # Sidebar (desktop) + bottom nav (mobile)
│   │   │   │   └── ui/                   # Shadcn components
│   │   │   ├── hooks/use-local-data.ts   # localStorage CRUD via React Query
│   │   │   ├── lib/
│   │   │   │   ├── schema.ts             # Zod types for all data
│   │   │   │   └── mock-data.ts          # Demo seed data
│   │   │   ├── App.tsx                  # Router with all 9 routes
│   │   │   └── index.css                # Jira-inspired design tokens (dark/light)
│   │   └── public/
│   │       ├── manifest.json            # PWA manifest
│   │       ├── sw.js                    # Service worker for offline/caching
│   │       └── favicon.svg              # Ascensios triangle logo
│   └── api-server/        # Express backend (unused by Ascensios currently)
├── lib/                   # Shared libs (api-spec, api-client-react, api-zod, db)
└── scripts/               # Utility scripts
```

## Ascensios App

### Pages
- **Dashboard** (/) — Greeting, AI Briefing card, Quick Stats (4 cards), Up Next schedule, Daily Habits checklist, floating + button
- **Schedule** (/schedule) — Full 7-day weekly grid with color-coded activity blocks, Auto-Schedule button
- **Studies** (/studies) — Course tracker with progress bars, deadline countdowns, donut chart
- **Learning** (/learning) — Skill goals with AI roadmap, hours logged, streak counters
- **Habits** (/habits) — Daily check-in with Done button, 7-day heatmap, streak milestones
- **Progress** (/progress) — Line chart (productive hours), pie chart (time allocation), Ascensios Score, AI Weekly Insight
- **Free Time** (/freetime) — AI suggestions, stacked bar chart, daily free hour breakdown
- **Community** (/community) — Study partners list, social goals tracker
- **Settings** (/settings) — Name, Gemini API key, dark/light mode, sleep target, notifications

### Data
- All data persisted to localStorage under `ascensios_*` keys
- Keys: `ascensios_settings`, `ascensios_blocks`, `ascensios_courses`, `ascensios_learningGoals`, `ascensios_habits`, `ascensios_friends`
- Demo data auto-seeded on first launch

### Design System
- Primary: Jira Blue (#0052CC) — `--primary`
- Accent: Jira Green (#36B37E) — `--success`
- Dark base: #161B22 — `--background` in dark mode
- Font: -apple-system, BlinkMacSystemFont, Segoe UI (system font stack)
- 8px grid spacing, flat design, minimal shadows

### PWA
- manifest.json with theme_color #0052CC
- sw.js: cache-first for offline support, push notification handler
- beforeinstallprompt captured for "Install PWA" sidebar button

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
