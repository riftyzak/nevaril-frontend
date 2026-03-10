# M27: Real Auth Foundation on Backend

M27 removes mock auth as the only architecture assumption without forcing a broad auth UX rollout.

This milestone is intentionally narrow:
- Convex remains the primary app-data runtime.
- `AUTH_SOURCE=mock` stays the safe default for now.
- `AUTH_SOURCE=convex` enables backend-backed session resolution through Convex.
- mock auth remains available only as explicit fallback/dev/e2e mode.
- there is no silent fallback from real auth to mock auth.

## What Changed

Backend auth/session foundation now includes:
- `users`
- `tenantMemberships`
- `authSessions`

Seeded backend auth data is added to the existing barber seed:
- owner: `martin.novak@barber.test`
- staff: `tomas.kral@barber.test`

Real session resolution now reads a dedicated cookie:
- `nevaril_auth_session`

Admin guards still consume the same `AppSession` shape, but that shape can now come from:
- mock auth when `AUTH_SOURCE=mock`
- Convex-backed session lookup when `AUTH_SOURCE=convex`

## Runtime Policy

Safe default in M27:

```bash
AUTH_SOURCE=mock
NEXT_PUBLIC_AUTH_SOURCE=mock
```

Real backend auth mode:

```bash
AUTH_SOURCE=convex
NEXT_PUBLIC_AUTH_SOURCE=convex
```

Rules:
- set both auth envs together
- real auth does not downgrade to mock if the real session cookie is missing or invalid
- admin route guards redirect missing/expired Convex auth sessions to `/[locale]/auth/sign-in`
- tenant membership denial still goes to `/[locale]/not-authorized`

## Minimal Sign-In Handoff

M27 adds a temporary seeded handoff page instead of a polished auth UX:

```text
/cs/auth/sign-in?tenantSlug=barber
```

This page:
- works only when `AUTH_SOURCE=convex`
- creates a backend auth session via Convex
- sets the `nevaril_auth_session` cookie
- redirects back into the existing admin flow

Minimal sign-out is available at:

```text
/cs/auth/sign-out
```

## Verification Matrix

Prepare backend data first:

```bash
npx convex dev --once
npx convex run seed:seedBarberReadSlice
```

### Real Auth Mode

Required env:

```bash
APP_DATA_SOURCE=convex
NEXT_PUBLIC_APP_DATA_SOURCE=convex
AUTH_SOURCE=convex
NEXT_PUBLIC_AUTH_SOURCE=convex
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
CONVEX_URL=https://<deployment>.convex.cloud
```

Focused acceptance:

| Area | Verification |
| --- | --- |
| Backend session resolves from Convex | `tests/auth-convex.spec.js` owner handoff sets `nevaril_auth_session` |
| Owner admin access | `tests/auth-convex.spec.js` owner reaches `/cs/app/barber/tenant-settings` |
| Staff permission scoping | `tests/auth-convex.spec.js` staff is redirected to `/cs/not-authorized` on owner-only route |
| Existing Convex product core remains usable | run selected Convex product specs after signing in or with explicit test bootstrap |

Example run:

```bash
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
AUTH_SOURCE=convex \
NEXT_PUBLIC_AUTH_SOURCE=convex \
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
CONVEX_URL=https://<deployment>.convex.cloud \
npx playwright test tests/auth-convex.spec.js
```

### Explicit Mock Fallback / Dev / E2E

Required env:

```bash
APP_DATA_SOURCE=mock
NEXT_PUBLIC_APP_DATA_SOURCE=mock
AUTH_SOURCE=mock
NEXT_PUBLIC_AUTH_SOURCE=mock
```

Focused fallback confidence:
- `tests/smoke.spec.js`
- existing `?__e2e=reset` bootstrap
- mock session cookie flow remains unchanged

Example run:

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
AUTH_SOURCE=mock \
NEXT_PUBLIC_AUTH_SOURCE=mock \
npx playwright test tests/smoke.spec.js
```

## Operational Notes

- M27 does not add magic-link delivery, OAuth, password auth, or account management UX.
- The seeded sign-in page is temporary scaffolding for backend session resolution.
- A future milestone can flip `AUTH_SOURCE` default only after the real auth flow is safe enough to replace the mock default.
