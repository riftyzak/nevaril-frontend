# M22 First Live Convex Booking Mutation Completion

## Goal
M22 closes the smallest safe live Convex booking mutation slice after M21 create-booking support.

Live in Convex after M22:

- `bookings:update`
- `bookings:cancel`

`APP_DATA_SOURCE=mock` remains the safe default.

## What is in scope
- manage booking reschedule confirm flow
- manage booking cancel flow
- admin booking detail reschedule action
- admin booking detail cancel action
- mock-parity conflict and policy checks for these two mutations
- read-after-write parity through existing booking readers and query invalidation

## What stays out of scope
- waitlist assignment
- calendar writes
- advanced availability redesign
- broader admin workflow redesign
- auth product flow
- pricing or plan redesign

In `APP_DATA_SOURCE=convex`, non-migrated writes still remain explicitly unsupported. There is no fallback-to-mock inside the Convex adapter.

## Convex behavior
- `bookings:update` validates:
  - tenant exists
  - tenant settings exist
  - booking exists for tenant
  - `expectedUpdatedAt` matches current persisted booking
  - `patch.startAt` is a valid ISO datetime when rescheduling
- `bookings:cancel` reuses the same booking lookup, concurrency and policy checks
- policy enforcement mirrors current mock behavior:
  - reschedule and cancel are blocked inside `tenantSettings.cancellationPolicyHours`
  - fallback remains 24h only if that tenant value is unavailable at the app edge
- conflict enforcement mirrors current mock semantics:
  - only `confirmed` and `rescheduled` bookings block a slot
  - current booking id is ignored during reschedule
  - when `staffId` is present, conflicts are staff-scoped
  - otherwise overlap is tenant-wide
- `endAt` is recomputed server-side from the existing `serviceVariant`
- manage token and routing semantics stay unchanged

## Focused verification
### Mock mode

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
npx playwright test tests/smoke.spec.js
```

### Convex mode

Focused mutation smoke:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://curious-fly-511.eu-west-1.convex.cloud \
CONVEX_URL=https://curious-fly-511.eu-west-1.convex.cloud \
npx playwright test tests/bookings-update-convex.spec.js
```

Recommended additional reader/create regression checks:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://curious-fly-511.eu-west-1.convex.cloud \
CONVEX_URL=https://curious-fly-511.eu-west-1.convex.cloud \
npx playwright test tests/bookings-create-convex.spec.js
```

## Notes on test data
- Focused M22 mutation tests create fresh Convex bookings inside each test instead of mutating the static read-slice fixtures.
- This avoids coupling update/cancel verification to the seeded `bk-1` / `bk-2` records and keeps policy-window failures from old timestamps out of the happy path.
