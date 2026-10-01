# TheadX Client

React 19 + TypeScript + Vite + Tailwind CSS 4 frontend for the TheadX cybersecurity platform.

## Development

```bash
npm install
npm run dev      # serves on http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend at `http://localhost:3001` (see `vite.config.ts`).

## Build

```bash
npm run build    # tsc -b && vite build → dist/
npm run preview  # preview the production build
```

## Structure

- `src/pages/` — 10 top-level routes
- `src/components/ui/` — GlassCard, RiskBadge, StatCard, SecurityScoreRing, LiveBadge, ThreatTypeIcon
- `src/components/layout/` — Layout, Sidebar, Header
- `src/api/client.ts` — typed fetch wrapper (proxied to :3001 in dev)
- `src/types/index.ts` — shared types

## Real-Time Behavior

Dashboard and Threat Monitor poll `/api/dashboard/stats` and `/api/events` every 5 seconds while mounted. New ingests appear within one polling cycle.

## Error Handling

All core pages have initial-load spinners and connection-error retry gates. Background polls fail silently so transient network issues don't blank the UI.
