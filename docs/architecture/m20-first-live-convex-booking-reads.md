# M20 First Live Convex Booking Reads

## Goal
M20 adds the next smallest live Convex slice by moving only booking read paths to the real Convex deployment:

- `bookings:list`
- `bookings:getById`
- `bookings:getByToken`

`APP_DATA_SOURCE=mock` remains the safe default.

## In scope
- admin bookings list reads live Convex booking data
- admin booking detail reads live Convex booking data
- manage route reads live Convex booking data by token
- confirmation/manage reader keeps reading existing booking data by token
- reader-side service/staff composition stays in the app layer

## Out of scope
- `createBooking`
- `updateBooking` / reschedule
- `cancelBooking`
- availability writes
- waitlist assignment
- calendar writes
- auth product flow
- pricing or plan redesign
- GTM/storybook broad changes

In `APP_DATA_SOURCE=convex`, non-migrated booking mutations remain explicitly unsupported. The Convex adapter does not fall back to mock.

## Convex data shape
The booking read slice stores enough parity to satisfy the current `Booking` type and current UI readers:

- `bookingId` mapped back to app `id`
- `tenantId` scoped to the tenant slug used by the reader
- `serviceId`
- `serviceVariant`
- `staffId`
- `customerId`
- `customerName`
- `customerEmail`
- `customerPhone`
- `customFieldValues`
- `startAt`
- `endAt`
- `timezone`
- `status`
- `bookingToken`
- `manageToken`
- `createdAt`
- `updatedAt`

Indexes added for the migrated reads:

- `by_tenant_id_start_at`
- `by_tenant_id_booking_id`
- `by_booking_token`
- `by_manage_token`

## Barber parity dataset
Reference fixture:

- `docs/fixtures/convex-barber-booking-read-slice.json`

Seeded barber booking read parity must include:

- one confirmed booking for `st-1`
- one rescheduled booking for `st-owner`
- at least one token-backed manage route booking

The committed seed lives in `convex/seed.ts` and is intended to be idempotent for the `barber` tenant.

## Verification
### Mock mode
Safe-default verification:

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
NEXT_PUBLIC_E2E=1 \
npx playwright test
```

### Convex mode
Before the focused smoke, seed the deployment with the barber read slice.

Focused booking smoke:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
CONVEX_URL=https://<deployment>.convex.cloud \
npx playwright test tests/bookings-convex.spec.js
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

- owner sees booking rows in admin bookings list
- owner sees booking detail by booking ID
- manage page loads booking by token
- staff bookings scope remains consistent with current UI semantics
