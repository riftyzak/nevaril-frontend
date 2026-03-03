# Nevaril Frontend (Next.js App Router)

Frontend-first multi-tenant booking SaaS demo for small businesses and rentals.

## Stack

- Next.js App Router + TypeScript + TailwindCSS + shadcn/ui
- TanStack Query + local mock API
- react-hook-form + zod
- next-intl (`cs`, `sk`, `en`)
- Recharts
- date-fns + date-fns-tz
- GTM-ready event utility (`window.dataLayer` only)

## Setup

```bash
npm install
npm run dev
```

Core scripts:

```bash
npm run lint
npm run build
```

Storybook scripts:

```bash
npm run storybook
npm run build-storybook
```

Playwright scripts:

```bash
npm run test:e2e
npm run test:e2e:ui
```

## Routing Modes

Routing mode is controlled by:

```bash
NEXT_PUBLIC_TENANT_ROUTING_MODE=hybrid|path|subdomain
```

Internal canonical links use path form:

- `/{locale}/t/{tenantSlug}/...`

Supported external modes:

- Path mode: `http://localhost:3000/cs/t/barber/book`
- Subdomain mode: `http://barber.localhost:3000/cs/book`
- Hybrid mode: both work, subdomain requests rewrite to canonical internal path.

`/` is redirected to default locale `/cs`.

## Mock DB and Seed Governance

Mock persistence is local-first and tenant-scoped:

- Primary persistence: `localStorage`
- Seed/version governance: `DB_VERSION` in [`src/lib/mock/seed.ts`](src/lib/mock/seed.ts)
- Storage helpers: [`src/lib/mock/storage.ts`](src/lib/mock/storage.ts)
- Deterministic reset: `resetSeed()`

DevMenu supports:

- reset seed
- latency override (ms)
- error rate override (%)
- active tenant + locale preview
- mock role/session switching
- plan switching

## Roles and Plan Gating

Session entry point:

- [`src/lib/auth/getSession.ts`](src/lib/auth/getSession.ts)

Permissions engine:

- `can(...)` + `getModuleAccess(...)` in [`src/lib/auth/permissions.ts`](src/lib/auth/permissions.ts)
- owner vs staff scopes (including own-bookings scope by `assignedStaffId`)

Plan gating:

- features model: [`src/lib/plans/features.ts`](src/lib/plans/features.ts)
- gate check: [`src/lib/plans/gates.ts`](src/lib/plans/gates.ts)

## GTM Prepared Events

Utility:

- [`src/lib/gtm/useGtm.ts`](src/lib/gtm/useGtm.ts)

Implemented events:

- `view_form`
- `select_service`
- `select_staff`
- `select_slot`
- `submit_booking`
- `booking_confirmed`
- `open_manage_booking`
- `cancel_booking`
- `reschedule_booking`
- `start_checkout_mock`

To verify manually in browser console:

```js
window.dataLayer = []
```

Then run a flow and inspect `window.dataLayer`.

## Storybook Notes

Storybook stories are under `src/stories/` and include:

- theme tokens/typography preview
- public/admin shell mocks
- booking component stories
- guards UX stories (locked tooltip / not-authorized / locked-by-plan)

## Playwright Smoke Suite

Smoke spec: [`tests/smoke.spec.js`](tests/smoke.spec.js)

Scenarios:

- booking happy path
- manage reschedule
- owner service edit persistence
- waitlist create + assign
- RBAC redirect (staff -> owner-only route)

Deterministic test reset in test env:

- Start app with `NEXT_PUBLIC_E2E=1` (configured in `playwright.config.js`)
- Visit any public page with `?__e2e=reset`
- Optional session overrides:
  - `__role=owner|staff`
  - `__staff=st-1`

Example:

```text
/cs/t/barber/book?__e2e=reset&__role=staff&__staff=st-1
```

This reset path is handled in DevMenu logic only when `NEXT_PUBLIC_E2E=1`.

## Backend Wiring Direction

Mock API contracts live in:

- [`src/lib/api/types.ts`](src/lib/api/types.ts)
- [`src/lib/api/index.ts`](src/lib/api/index.ts)

To wire a real backend later:

1. Keep function signatures in `src/lib/api/index.ts`.
2. Replace local storage implementation with network adapters.
3. Preserve TanStack Query hooks and query keys to minimize UI churn.
