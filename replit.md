# PowerPulse

A community-driven electricity status reporting mobile app. Users report outages, restorations, and transformer faults; verify community reports; view a live map; save locations; and receive notifications.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/powerpulse run dev` — run the Expo app (Expo Go or web preview)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk auth middleware
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → `@workspace/api-client-react`)
- Mobile: Expo SDK 54, expo-router, React Native
- Auth: Clerk (email+password + Google SSO)
- Maps: react-native-maps (native only; web shows a placeholder)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/` — Drizzle table definitions (users, reports, verifications, notifications, saved_locations)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/powerpulse/app/` — Expo screens (expo-router file-based routing)
- `artifacts/powerpulse/constants/colors.ts` — design tokens (dark navy theme)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks used in the mobile app
- Clerk auth proxy at `/api/__clerk` so native Expo apps can auth through the same domain
- `react-native-maps` is native-only; `map.native.tsx` has the full map, `map.tsx` is a web fallback; Metro config stubs the package on web
- Notifications are created server-side when a new report lands near a user's saved location (within 5 km)
- Verification confidence = (confirmations / total votes) × 100; `verified = true` when ≥3 confirmations and ≥70% confidence

## Product

- Dashboard: live neighbourhood power status, reliability stats, quick-report buttons, recent reports feed
- Map: live pins for active outages/restorations/transformer faults with filter chips (native only)
- Reporting: three report types (outage, restoration, transformer fault) with GPS auto-detect + reverse geocode
- Verification: community confirm/dispute voting with confidence bar on every report
- Saved Locations: users save named spots; server sends notifications when power status changes nearby
- Notifications: in-app alert feed, mark-as-read per item

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Never use `pnpm run dev` at workspace root — run individual artifacts via their workflows
- After any schema change, run `pnpm --filter @workspace/db run push` (dev) before restarting the API server
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before editing screens
- react-native-maps must stay native-only; adding any top-level import on web will break the web bundler even with the Metro stub

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk configuration and auth flows
