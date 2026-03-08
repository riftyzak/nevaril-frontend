# M16 Convex Foundation

## Goal
M16 establishes the first stable boundary between the UI and the data/auth implementations so Nevaril can migrate from mock storage to a Convex-first backend without a big-bang rewrite.

## Current switches
- `APP_DATA_SOURCE=mock|convex`
- `AUTH_SOURCE=mock|convex`
- default for both is `mock`

## What changed in M16
### Data boundary
- UI-facing data calls now go through `src/lib/app/client.ts`
- adapter selection lives in:
  - `src/lib/app/source.ts`
  - `src/lib/app/adapter.ts`
- adapters:
  - `src/lib/app/mock-adapter.ts`
  - `src/lib/app/convex-adapter.ts`

### Convex scaffold
- Convex contract registry:
  - `src/lib/app/convex-contracts.ts`
- Convex domain scaffold:
  - `convex/schema.ts`
  - `convex/tenants.ts`
  - `convex/users.ts`
  - `convex/memberships.ts`
  - `convex/staff.ts`
  - `convex/customers.ts`
  - `convex/services.ts`
  - `convex/bookings.ts`
  - `convex/waitlist.ts`
  - `convex/calendarEvents.ts`
  - `convex/notificationTemplates.ts`
  - `convex/tenantSettings.ts`

### Auth/session boundary
- auth source selection:
  - `src/lib/auth/source.ts`
- auth adapter boundary:
  - `src/lib/auth/adapter.ts`
  - `src/lib/auth/mock-auth-adapter.ts`
- session resolution:
  - `src/lib/auth/session.ts`
- route protection now depends on resolved tenant-aware memberships, not direct cookie parsing.

### Safe reader migrations
- tenant config/timezone/booking server readers are centralized in `src/lib/app/server.ts`
- admin route entrypoints and auth readers use that helper layer

## What remains mock-only after M16
- `src/lib/api/index.ts` remains the behavioral mock repository implementation
- `src/lib/mock/storage.ts` remains the storage engine for dev/demo mode
- write-heavy flows still execute through the mock adapter even though the UI now calls the app boundary
- Playwright reset and the dev menu still rely on the mock auth/session behavior, but through the auth boundary or dev wrapper

## What is prepared for Convex after M16
- stable app data contracts
- stable auth/session contracts
- tenant-aware session model with memberships and auth method metadata
- Convex function naming conventions and schema-ready table definitions
- a stub Convex adapter that can be implemented incrementally behind the existing UI

## Naming conventions
- queries: `domain:verb`
- mutations: `domain:verb`
- examples:
  - `tenants:getBySlug`
  - `tenantSettings:get`
  - `tenantSettings:update`
  - `bookings:list`
  - `bookings:create`
  - `calendarEvents:update`
  - `auth:resolveSession`

## Migration order after M16
1. Implement Convex query handlers for tenant config, services, staff, and basic bookings reads.
2. Add a real Convex auth adapter for magic-link session resolution.
3. Flip isolated read paths to `APP_DATA_SOURCE=convex` in targeted environments.
4. Migrate write paths domain-by-domain behind the same adapter contracts.
5. Remove legacy direct mock usage once Convex parity is reached.

## Guardrails
- Keep `APP_DATA_SOURCE=mock` by default until Convex reader parity exists for the target slice.
- Do not import `@/lib/mock/storage` from product UI components.
- Do not import `@/lib/api` from product UI components.
- Treat `src/lib/api/index.ts` as a legacy implementation detail of the mock adapter.
