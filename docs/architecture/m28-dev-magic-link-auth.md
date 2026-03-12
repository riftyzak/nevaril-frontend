# M28: Dev-Complete Convex Magic-Link Auth

M28 replaces the seeded backend sign-in chooser from M27 with a real email-first magic-link flow for local/dev/e2e use.

This milestone is intentionally narrow:
- Convex remains the primary backend-auth runtime when `AUTH_SOURCE=convex`.
- `AUTH_SOURCE=mock` stays the safe default after M28.
- Magic-link delivery is exposed as an in-app preview link instead of outbound email.
- OAuth, password auth, signup, and invite acceptance remain out of scope.

## What Changed

Convex auth now has a two-step magic-link flow:
- `auth:beginMagicLink`
- `auth:completeMagicLink`

New backend data:
- `authMagicLinks`

Magic links are:
- tenant-aware
- time-limited
- single-use

The sign-in page at:

```text
/cs/auth/sign-in?tenantSlug=barber
```

now accepts an email address and returns a dev-preview verification link.

The verification handoff is completed at:

```text
/cs/auth/verify?token=...
```

Failures redirect to:

```text
/cs/auth/verify/error
```

## Runtime Policy

Safe default after M28:

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
- real auth does not downgrade to mock if link verification fails
- missing or invalid Convex sessions still redirect protected admin routes to `/[locale]/auth/sign-in`
- mock auth remains the explicit fallback/dev/e2e mode

## Verification Matrix

Prepare backend data first:

```bash
npx convex dev --once
npx convex run seed:seedBarberReadSlice
```

Focused acceptance:

| Area | Verification |
| --- | --- |
| Owner sign-in via email-first flow | `tests/auth-convex.spec.js` owner magic-link flow |
| Staff permission scoping | `tests/auth-convex.spec.js` staff magic-link flow |
| Invalid or expired link handling | `tests/auth-convex.spec.js` invalid token flow |
| Sign-out and protected-route redirect | `tests/auth-convex.spec.js` sign-out flow |

## Operational Notes

- M28 replaces the seeded identity buttons from M27.
- The preview link is intentional scaffolding for local/dev/e2e until a later delivery milestone adds real email sending.
- A future milestone can still flip `AUTH_SOURCE` default, but M28 does not do that.
