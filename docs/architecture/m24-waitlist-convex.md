# M24 Waitlist on Convex

## Goal
M24 migrates only the existing waitlist read/write slice to the real Convex deployment:

- `waitlist:list`
- `waitlist:create`
- `waitlist:assign`

`APP_DATA_SOURCE=mock` remains the safe default.

## Scope
- live Convex read for the admin waitlist inbox
- live Convex public waitlist create
- live Convex waitlist assignment that reuses shared booking-create logic
- persisted reload parity for waitlist state after create and assign

## Out of scope
- waitlist UX redesign
- broader scheduling engine changes
- pricing, analytics, vouchers, loyalty or notifications migration
- auth product flow
- GTM/storybook broad changes

## Data shape
The new internal table is `waitlistEntries` and maps back to the existing app `WaitlistEntry` type.

Stored fields:

- `tenantId`
- `entryId`
- `serviceId`
- `customerName`
- `email`
- `phone`
- `note`
- `preferredDate`
- `preferredTimeLabel`
- `status`
- `assignedBookingId`
- `createdAt`
- `updatedAt`

Indexes:

- `by_tenant_id_created_at`
- `by_tenant_id_entry_id`

## Behavior
- public app/API types stay unchanged and continue to use `preferredTimeLabel`
- admin service/status filtering stays client-side; no new filtered waitlist query is added
- `waitlist:assign` delegates booking creation to shared Convex booking-create logic instead of reimplementing booking rules
- successful assignment persists both:
  - waitlist `status = assigned`
  - `assignedBookingId = <created booking id>`
- no fallback-to-mock exists inside the Convex adapter

## Barber parity dataset
Reference fixture:

- `docs/fixtures/convex-barber-waitlist-slice.json`

Seeded data includes:

- one existing `new` waitlist entry for `svc-cut`
- compatibility with existing barber services, staff and bookings seed

The committed seed remains idempotent for the `barber` tenant.

## Verification
### Mock mode

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
NEXT_PUBLIC_E2E=1 \
npx playwright test tests/smoke.spec.js --grep "waitlist create \\+ assign to slot"
```

### Convex mode

Seed parity first:

```bash
npx convex run seed:seedBarberReadSlice
```

Then run the focused smoke:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
CONVEX_URL=https://<deployment>.convex.cloud \
npx playwright test tests/waitlist-convex.spec.js
```

The focused Convex smoke validates:

- public waitlist create succeeds
- admin waitlist inbox renders seeded Convex data
- admin assign persists assigned state after reload
- the created booking is visible through the existing bookings read slice
- staff route access stays aligned with current bookings-module semantics
