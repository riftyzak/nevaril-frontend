# Nevaril Frontend (Next.js App Router)

Frontend-first multi-tenant booking SaaS demo for small businesses and rentals.

## Stack

- Next.js App Router + TypeScript + TailwindCSS + shadcn/ui
- TanStack Query + app adapter boundary with Convex primary runtime
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

Normal runtime expects Convex:

```bash
APP_DATA_SOURCE=convex
NEXT_PUBLIC_APP_DATA_SOURCE=convex
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
CONVEX_URL=https://<deployment>.convex.cloud
AUTH_SOURCE=mock
NEXT_PUBLIC_AUTH_SOURCE=mock
```

If Convex is not configured locally, use explicit fallback/dev mode instead of relying on any automatic downgrade:

```bash
APP_DATA_SOURCE=mock
NEXT_PUBLIC_APP_DATA_SOURCE=mock
AUTH_SOURCE=mock
NEXT_PUBLIC_AUTH_SOURCE=mock
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

## Runtime Modes

App-data runtime resolution:

- `NEXT_PUBLIC_APP_DATA_SOURCE`
- then `APP_DATA_SOURCE`
- else default to `convex`

Rules:

- Convex is the normal product runtime
- mock is explicit fallback/dev mode only
- there is no silent fallback-to-mock if Convex URL is missing
- app auth is staged in M27:
  - `AUTH_SOURCE=mock` / `NEXT_PUBLIC_AUTH_SOURCE=mock` stay the safe default
  - `AUTH_SOURCE=convex` / `NEXT_PUBLIC_AUTH_SOURCE=convex` enable the seeded backend auth handoff
  - there is no silent fallback from real auth to mock auth

Primary Convex workflow:

```bash
npx convex dev --once
npx convex run seed:seedBarberReadSlice
```

E2E bootstrap policy:

- `E2E_BOOTSTRAP=1` is the preferred runtime flag for `?__e2e=reset`
- `NEXT_PUBLIC_E2E=1` remains a compatibility alias, but build/start no longer depends on it
- Convex-primary build/start can build normally and only needs `E2E_BOOTSTRAP=1` at `next start` time
- explicit mock build/start must use `APP_DATA_SOURCE=mock` and `NEXT_PUBLIC_APP_DATA_SOURCE=mock` at both build and start time

Focused acceptance in Convex-primary mode:

```bash
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
CONVEX_URL=https://<deployment>.convex.cloud \
npx playwright test \
  tests/e2e-bootstrap.spec.js \
  tests/bookings-create-convex.spec.js \
  tests/bookings-update-convex.spec.js \
  tests/bookings-convex.spec.js \
  tests/admin-calendar-convex.spec.js \
  tests/waitlist-convex.spec.js \
  tests/tenant-settings-convex.spec.js \
  tests/services-convex.spec.js
```

Explicit mock fallback/dev workflow:

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
npx playwright test \
  tests/smoke.spec.js \
  tests/admin-calendar.spec.js \
  tests/tenant-settings.spec.js
```

Architecture reference:

- [`docs/architecture/m25-convex-primary-runtime.md`](docs/architecture/m25-convex-primary-runtime.md)
- [`docs/architecture/m26-e2e-bootstrap-hardening.md`](docs/architecture/m26-e2e-bootstrap-hardening.md)
- [`docs/architecture/m27-real-auth-foundation.md`](docs/architecture/m27-real-auth-foundation.md)

## Auth Modes

M27 introduces the first backend-backed auth/session foundation behind explicit real-auth mode.

Safe default:

```bash
AUTH_SOURCE=mock
NEXT_PUBLIC_AUTH_SOURCE=mock
```

Real backend auth mode:

```bash
AUTH_SOURCE=convex
NEXT_PUBLIC_AUTH_SOURCE=convex
```

Seeded Convex auth workflow:

```bash
npx convex dev --once
npx convex run seed:seedBarberReadSlice
```

Then start the app in Convex app-data mode plus Convex auth mode and open:

```text
/cs/auth/sign-in?tenantSlug=barber
```

Seeded identities:

- `martin.novak@barber.test` for owner access
- `tomas.kral@barber.test` for staff access

Focused real-auth verification:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
AUTH_SOURCE=convex \
NEXT_PUBLIC_AUTH_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
CONVEX_URL=https://<deployment>.convex.cloud \
npx playwright test tests/auth-convex.spec.js
```

Explicit mock-auth fallback/dev mode remains available:

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
AUTH_SOURCE=mock \
NEXT_PUBLIC_AUTH_SOURCE=mock \
npx playwright test tests/smoke.spec.js
```

## Mock Fallback DB and Seed Governance

Mock persistence is local-first, tenant-scoped, and used only in explicit fallback/dev mode:

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

Mock fallback smoke spec: [`tests/smoke.spec.js`](tests/smoke.spec.js)

Scenarios:

- booking happy path
- manage reschedule
- owner service edit persistence
- waitlist create + assign
- RBAC redirect (staff -> owner-only route)

Deterministic test reset in test env:

- Start app with `E2E_BOOTSTRAP=1`
- Visit any public page with `?__e2e=reset`
- Optional session overrides:
  - `__role=owner|staff`
  - `__staff=st-1`

Example:

```text
/cs/t/barber/book?__e2e=reset&__role=staff&__staff=st-1
```

This reset path is handled in `DevMenu` only when runtime E2E bootstrap is enabled.

Primary Convex acceptance and fallback-mode commands are documented in:

- [`docs/architecture/m25-convex-primary-runtime.md`](docs/architecture/m25-convex-primary-runtime.md)
- [`docs/architecture/m26-e2e-bootstrap-hardening.md`](docs/architecture/m26-e2e-bootstrap-hardening.md)
- [`docs/architecture/m27-real-auth-foundation.md`](docs/architecture/m27-real-auth-foundation.md)

## Runtime Wiring

Mock API contracts live in:

- [`src/lib/api/types.ts`](src/lib/api/types.ts)
- [`src/lib/api/index.ts`](src/lib/api/index.ts)

Current runtime direction:

1. Convex is the default app runtime via the app adapter boundary.
2. Mock adapter remains available only for explicit fallback/dev mode.
3. Preserve TanStack Query hooks and query keys to keep UI churn low.
