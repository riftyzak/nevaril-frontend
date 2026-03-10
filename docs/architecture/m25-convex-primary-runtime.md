# M25: Convex as Primary Runtime

M25 flips Nevaril app data runtime from mock-first to Convex-first for normal product flow.

This milestone is intentionally narrow:
- Convex becomes the default app runtime when app-data env vars are unset.
- Mock stays in the repo as an explicit fallback/dev fixture mode.
- There is no silent fallback-to-mock when Convex configuration is missing or broken.
- `AUTH_SOURCE` remains `mock` in M25.

Historical M16-M24 docs describe the rollout phase where `APP_DATA_SOURCE=mock` was the safe default. M25 supersedes that default policy for the current runtime.

For current E2E bootstrap rules in `next dev` and `next build + next start`, see `docs/architecture/m26-e2e-bootstrap-hardening.md`.

## Runtime Policy

App-data mode resolution now works like this:
- `NEXT_PUBLIC_APP_DATA_SOURCE`
- then `APP_DATA_SOURCE`
- else default to `convex`

Rules:
- `convex` is the normal runtime mode
- `mock` is used only when both server and client envs are explicitly set to `mock`
- if `APP_DATA_SOURCE` and `NEXT_PUBLIC_APP_DATA_SOURCE` disagree, startup fails explicitly
- if runtime resolves to `convex` and `NEXT_PUBLIC_CONVEX_URL` or `CONVEX_URL` is missing, tenant/admin product routes fail explicitly
- no code path downgrades Convex mode to mock mode automatically

## Primary Convex Acceptance

Run the primary M25 verification only in Convex mode.

Prepare the dataset:

```bash
npx convex dev --once
npx convex run seed:seedBarberReadSlice
```

Required env:

```bash
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
CONVEX_URL=https://<deployment>.convex.cloud
```

Focused acceptance matrix:

| Area | Spec |
| --- | --- |
| Public booking happy path | `tests/bookings-create-convex.spec.js` |
| Manage booking flow | `tests/bookings-update-convex.spec.js` |
| Admin bookings | `tests/bookings-convex.spec.js` |
| Admin calendar | `tests/admin-calendar-convex.spec.js` |
| Waitlist | `tests/waitlist-convex.spec.js` |
| Tenant settings | `tests/tenant-settings-convex.spec.js` |
| Services | `tests/services-convex.spec.js` |

Example run:

```bash
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
CONVEX_URL=https://<deployment>.convex.cloud \
npx playwright test \
  tests/bookings-create-convex.spec.js \
  tests/bookings-update-convex.spec.js \
  tests/bookings-convex.spec.js \
  tests/admin-calendar-convex.spec.js \
  tests/waitlist-convex.spec.js \
  tests/tenant-settings-convex.spec.js \
  tests/services-convex.spec.js
```

Additional lower-level Convex reader coverage remains available in:
- `tests/convex-readers.spec.js`

## Explicit Mock Fallback / Dev Mode

Mock mode still exists for dev fixtures and fallback confidence, but it is not the primary acceptance path.

Required env:

```bash
APP_DATA_SOURCE=mock
NEXT_PUBLIC_APP_DATA_SOURCE=mock
```

Fallback/dev confidence specs:
- `tests/smoke.spec.js`
- `tests/admin-calendar.spec.js`
- `tests/tenant-settings.spec.js`

Example run:

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
npx playwright test \
  tests/smoke.spec.js \
  tests/admin-calendar.spec.js \
  tests/tenant-settings.spec.js
```

## Operational Notes

- Normal app runtime now expects Convex configuration.
- If Convex URL is missing, fix the config or explicitly force mock mode.
- Historical note: M25 kept auth on the mock adapter. Current backend-auth staging rules now live in `docs/architecture/m27-real-auth-foundation.md`.
