# M21 First Live Convex Booking Writes: Create Booking Only

## Goal
M21 adds the first real Convex booking write slice for public booking creation.

Live in Convex after M21:

- `bookings:create`
- minimal `bookings:getAvailability` bridge required for public slot selection

`APP_DATA_SOURCE=mock` remains the safe default.

## What is in scope
- public booking details submit flow writes to Convex
- confirmation page reads the created booking back through existing token readers
- manage route opens the created booking through existing token readers
- token generation stays compatible with current confirmation/manage routing semantics

## What stays out of scope
- `bookings:update`
- `bookings:cancel`
- reschedule flow
- admin booking edit actions
- calendar writes
- waitlist assignment
- auth product flow
- pricing/plan redesign
- GTM/storybook broad changes

In `APP_DATA_SOURCE=convex`, non-migrated booking writes remain explicitly unsupported.

## Convex behavior
- `bookings:create` validates:
  - tenant exists
  - service exists for tenant
  - optional staff exists for tenant
  - `startAt` is a valid ISO datetime
- `endAt` is computed server-side from `serviceVariant`
- `status` is always `confirmed`
- `timezone` is taken from tenant config
- `bookingToken` and `manageToken` both preserve the `"<tenantSlug>-manage-"` prefix expected by current manage-route inference
- conflict check intentionally mirrors current mock semantics:
  - only `confirmed` and `rescheduled` bookings block a slot
  - when `staffId` is present, conflicts are staff-scoped
  - when `staffId` is absent, overlap is checked across tenant bookings

## Minimal availability bridge
M21 includes a small Convex `bookings:getAvailability` bridge because public create flow cannot reach the details form without slot selection.

This is intentionally not an availability-engine redesign:

- same basic 9:00-17:00 slot generation as mock
- same busy vs available semantics needed by current slot picker
- no calendar/time-off/write migration

## Verification
### Mock mode

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
NEXT_PUBLIC_E2E=1 \
npx playwright test
```

### Convex mode

Focused booking-create smoke:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
CONVEX_URL=https://<deployment>.convex.cloud \
npx playwright test tests/bookings-create-convex.spec.js
```

Recommended additional build check:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
CONVEX_URL=https://<deployment>.convex.cloud \
npm run build
```

## Expected Convex coverage
The focused smoke validates:

- public booking happy path create succeeds
- confirmation page shows the created booking
- manage route opens the created booking by token

It does not validate reschedule/cancel/update behavior in Convex mode.
