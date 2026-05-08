# MedStock — CLAUDE.md

## Project overview
PWA for managing home medicine inventory. Tracks stock, expiry dates, and auto-generates shopping lists. Built with Next.js 14, Supabase, TailwindCSS.

## Key commands
```bash
npm run dev          # Local dev server (port 3000)
npm run build        # Production build
npm run test         # Playwright tests
npx supabase start   # Start local Supabase (Docker required)
npx supabase db push # Apply migrations to remote Supabase
```

## Architecture
- **App Router**: `app/(dashboard)/` for authenticated views, `app/login/` for auth
- **Auth**: Magic link via Supabase (`/login` → `/auth/callback`)
- **Middleware**: `middleware.ts` redirects unauthenticated users to `/login`
- **Server Components**: Dashboard and shopping pages fetch data server-side (no loading flicker)
- **Client Components**: Inventory page is client-side for real-time consume/add interactions
- **API routes**: `app/api/medications/` for CRUD, stock management, and FEFO consumption

## Business logic
Alert thresholds (`lib/alerts.ts`):
- `expired`: expiry_date < today
- `critical`: expiry_date ≤ today + 7 days
- `warning`: expiry_date ≤ today + 30 days
- `low_stock`: total_stock ≤ min_stock
- `out_of_stock`: total_stock = 0

Shopping list (`lib/shopping.ts`): auto-generated for meds with stock_status !== 'ok' OR next_expiry ≤ 15 days. Priority: urgent > this_week > recommended.

Consumption (`/api/medications/[id]/consume`): FEFO — deducts from soonest-expiring lot first.

## Database
View `v_medication_summary` is used everywhere for dashboard data — computed expiry/stock status included. Migrations in `supabase/migrations/`.

RLS is enabled on all tables — users only see their own data via `auth.uid() = user_id`.

## Environment variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

## Edge Function
`supabase/functions/daily-alerts/` — Deno function called by Supabase cron scheduler. Sends weekly email summary via Resend. Requires `CRON_SECRET` env var on the function.

## Testing
- `tests/alerts.spec.ts` — Unit tests for alert calculation logic (no browser)
- `tests/shopping.spec.ts` — Unit tests for shopping list generation
- `tests/login.spec.ts` — E2E login page tests

## Common patterns
- All Supabase calls from Server Components use `lib/supabase/server.ts`
- All client-side Supabase calls use `lib/supabase/client.ts`
- UI components in `components/ui/` (Button, Badge, Card) use `cn()` from `lib/utils.ts` for class merging
