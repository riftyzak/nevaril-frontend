# M19 First Live Convex Service Writes

## Goal
M19 adds one more live Convex write slice without widening into booking-heavy mutations. The only migrated write is `services:update`.

## Scope
- live Convex write for admin service edit
- persisted reload parity for admin services detail/list
- public read parity for updated service name and description

Everything else stays unchanged:
- service create
- bookings writes
- waitlist writes
- calendar writes
- vouchers, loyalty, notifications writes
- auth product flow

## Contracts
- query: `services:list`
- query: `services:get`
- mutation: `services:update`
- app contract:
  - `UpdateServiceInput.patch` now supports
    - `name`
    - `description`
    - `category`
    - `priceCents`
    - `durationOptions`
    - `active`

## Shared normalization
Service write normalization is shared between mock and Convex in:

- `src/lib/services/normalize.ts`

This keeps parity for:
- trimmed `name`
- trimmed `description`
- trimmed `category`
- non-negative integer `priceCents`
- normalized `durationOptions`
- `active`

## Convex behavior
- service lookup stays tenant-scoped
- optimistic concurrency uses `expectedUpdatedAt`
- no fallback-to-mock exists inside the Convex adapter
- service create is intentionally out of scope for M19

## Verification
### Mock mode
Run the safe-default suite explicitly in mock mode even if local env files prefer Convex:

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
NEXT_PUBLIC_E2E=1 \
npx playwright test
```

### Convex mode
Run only the focused service smoke:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
CONVEX_URL=https://<deployment>.convex.cloud \
npx playwright test tests/services-convex.spec.js
```

The focused Convex smoke verifies:
- owner edit succeeds
- admin detail reload shows persisted values
- admin services list shows persisted values
- public service detail reads the updated name and description
- staff remains view-only in the admin services flow
