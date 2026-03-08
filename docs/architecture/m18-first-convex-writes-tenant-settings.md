# M18 First Live Convex Writes - Tenant Settings

## Goal
M18 introduces the first real Convex write path without expanding into booking-heavy mutations. The only migrated write is `tenantSettings:update`.

## Scope
- live Convex read/write for tenant settings
- owner-only tenant settings save flow
- embed defaults persistence through tenant settings

Everything else stays unchanged:
- bookings writes
- waitlist writes
- calendar writes
- vouchers, loyalty, notifications writes
- auth product flow

## Contracts
- query: `tenantSettings:get`
- mutation: `tenantSettings:update`
- client contract stays:
  - `UpdateTenantConfigInput`
  - `ApiResult<TenantConfig>`

## Shared normalization
Tenant settings write normalization is shared between mock and Convex in:

- `src/lib/tenant-settings/normalize.ts`

This keeps parity for:
- `tenantName`
- `logoUrl`
- `staffSelectionEnabled`
- `cancellationPolicyText`
- `cancellationPolicyHours`
- `customFields`
- `customersVisibility`
- derived `customerReadMode`
- `embedDefaults`

## Convex storage behavior
- `tenantName` persists on the `tenants` table
- the remaining editable tenant settings persist on `tenantSettings`
- optimistic concurrency still uses `expectedUpdatedAt` against `tenantSettings.updatedAt`
- no fallback-to-mock exists inside the Convex adapter

## Verification
### Mock mode
Run the normal suite explicitly in mock mode even if local env files prefer Convex:

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
NEXT_PUBLIC_E2E=1 \
npm run test:e2e
```

### Convex mode
Run only the focused tenant settings smoke:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
npx playwright test tests/tenant-settings-convex.spec.js
```

The focused Convex smoke verifies:
- owner save succeeds
- reload shows persisted values
- `/embed` reads updated defaults
- public booking reads updated tenant branding and staff-selection behavior
- custom field persistence is verified on tenant settings reload
- staff remains blocked from the tenant settings route
