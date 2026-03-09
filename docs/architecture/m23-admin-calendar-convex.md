# M23 Admin Calendar + Calendar Events on Convex

## Goal
M23 migrates only the admin calendar event read/write slice to the real Convex deployment:

- `calendarEvents:list`
- `calendarEvents:create`
- `calendarEvents:update`
- `calendarEvents:delete`

`APP_DATA_SOURCE=mock` remains the safe default.

## Scope
- live Convex reads and writes for admin calendar `blocked` and `time_off` events
- admin calendar week view composition in Convex mode using:
  - existing `bookings:list` for booking items
  - new `calendarEvents:list` for non-booking items
- persisted reload parity for event create, update and delete
- owner/staff scope parity with the current admin calendar UI

## Out of scope
- waitlist assignment
- broader availability engine changes
- public booking flow redesign
- new calendar UX or drag-and-drop
- voucher, loyalty or notifications writes
- auth product flow

## Convex data shape
The new `calendarEvents` table stores:

- `tenantId`
- `eventId`
- `staffId`
- `type`
- `title`
- `startAt`
- `endAt`
- `note`
- `createdAt`
- `updatedAt`

Indexes added:

- `by_tenant_id_start_at`
- `by_tenant_id_staff_id_start_at`
- `by_tenant_id_event_id`

## Behavior
- tenant lookup is required for every query and mutation
- update/delete keep optimistic concurrency via `expectedUpdatedAt`
- create/update validate ISO datetimes and enforce `endAt > startAt`
- overlap conflicts are intentionally not added for blocked/time_off events because current mock behavior allows them
- no fallback-to-mock exists inside the Convex adapter

## Barber parity dataset
Reference fixture:

- `docs/fixtures/convex-barber-calendar-slice.json`

The seeded dataset includes:

- one confirmed booking for `st-1`
- one rescheduled booking for `st-owner`
- one `blocked` event for `st-1`
- one `time_off` event for `st-owner`

The committed seed lives in `convex/seed.ts` and is intended to be idempotent for the `barber` tenant.

## Verification
### Mock mode

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
NEXT_PUBLIC_E2E=1 \
npx playwright test tests/admin-calendar.spec.js
```

### Convex mode

Seed the barber parity slice first:

```bash
npx convex run seed:seedBarberReadSlice
```

Then run the focused smoke:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
CONVEX_URL=https://<deployment>.convex.cloud \
npx playwright test tests/admin-calendar-convex.spec.js
```

The focused Convex smoke validates:

- owner sees seeded booking and calendar event items in the week view
- owner can create blocked/time_off events and reload sees persisted values
- owner can update and delete a calendar event with reload parity
- staff remains restricted to own-scope calendar data
