# M17 First Live Convex Readers

## Goal
M17 proves one real end-to-end Convex read slice without moving any write-heavy flows. The migrated slice is intentionally narrow:

- tenant config
- services list
- service detail
- staff list

`APP_DATA_SOURCE=mock` remains the safe default.

## Mode switches
- `APP_DATA_SOURCE=mock|convex`
- `NEXT_PUBLIC_APP_DATA_SOURCE=mock|convex`
- `NEXT_PUBLIC_CONVEX_URL=<deployment url>`
- `CONVEX_URL=<deployment url>`

Use `convex` mode only when the deployment contains the parity dataset described below.

## What is live on Convex in M17
- `tenantSettings:get`
- `services:list`
- `services:get`
- `staff:list`

These are implemented in:
- `convex/tenantSettings.ts`
- `convex/services.ts`
- `convex/staff.ts`
- `src/lib/app/convex-adapter.ts`

## What stays mock-only after M17
- all write paths
- bookings mutations
- waitlist mutations
- calendar mutations
- auth product flow
- any non-migrated adapter contract

The Convex adapter does not fall back to mock. Unsupported calls fail explicitly.

## Barber parity dataset
The first live slice must contain one tenant with functionally equivalent public/admin reader data.

Reference fixture:
- `docs/fixtures/convex-barber-read-slice.json`

Required visible parity:
- tenant slug: `barber`
- tenant name: `Brass Barber`
- timezone: `Europe/Prague`
- `staffSelectionEnabled: true`
- logo URL matches the mock-visible default
- services:
  - `svc-cut` / `Haircut`
  - `svc-beard` / `Beard Trim`
- staff:
  - `st-owner` / `Martin Novak`
  - `st-1` / `Tomas Kral`

Functional equivalence is enough for M17. Fields not read by the migrated UI do not need perfect parity yet.

## Seed / dev strategy
M17 does not add a full seed pipeline. Use one of these temporary approaches:

1. Insert the barber parity dataset manually into the prepared Convex deployment.
2. Load the fixture from `docs/fixtures/convex-barber-read-slice.json` with a one-off internal script or Convex dashboard workflow.

The important constraint is repeatability of the visible reader slice, not a production-grade import system.

## Verification
### Mock mode
Run the normal suite with defaults:

```bash
NEXT_PUBLIC_E2E=1 npm run test:e2e
```

### Convex mode
Run only the migrated reader checks:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
npx playwright test tests/convex-readers.spec.js
```

Recommended additional build check:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
npm run build
```

## Expected Convex-mode coverage
The focused spec validates:
- booking entry page shows the barber brand
- booking entry page shows the service catalog
- service detail page shows the requested service
- staff selector shows the barber staff
- admin staff page shows the barber staff list

## Failure behavior
If a migrated Convex reader is missing or the deployment URL is not configured:
- adapter calls fail explicitly
- server readers do not silently degrade on internal errors
- UI shows an error state for the affected reader instead of rendering an empty placeholder
