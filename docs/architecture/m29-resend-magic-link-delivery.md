# M29: Resend Delivery and Auth Hardening

M29 replaces the M28 preview-link handoff with real outbound magic-link email delivery.

This milestone is intentionally narrow:
- Convex auth remains opt-in via `AUTH_SOURCE=convex`.
- `AUTH_SOURCE=mock` stays the safe default after M29.
- outbound delivery targets Resend
- a `memory` provider exists only for local/dev/e2e verification
- signup, invites, OAuth, and password auth remain out of scope

## What Changed

Magic-link delivery now runs through a server-only email boundary.

Providers:
- `resend`
- `memory`

Magic-link hardening now includes:
- hashed stored tokens
- resend cooldown
- single-use enforcement
- more specific verify failure states

The sign-in page at:

```text
/cs/auth/sign-in?tenantSlug=barber
```

now sends email instead of exposing a preview link in the page itself.

## Runtime Policy

Safe default after M29:

```bash
AUTH_SOURCE=mock
NEXT_PUBLIC_AUTH_SOURCE=mock
```

Convex auth mode:

```bash
AUTH_SOURCE=convex
NEXT_PUBLIC_AUTH_SOURCE=convex
AUTH_EMAIL_PROVIDER=resend|memory
AUTH_EMAIL_FROM=<sender@example.com>
RESEND_API_KEY=<key when provider=resend>
```

Rules:
- real auth does not downgrade to mock if delivery or verification fails
- `AUTH_EMAIL_PROVIDER=memory` is for local/dev/e2e only
- protected admin routes still redirect missing or invalid sessions to `/[locale]/auth/sign-in`

## Verification Matrix

Focused acceptance:

| Area | Verification |
| --- | --- |
| Owner email sign-in | `tests/auth-convex.spec.js` owner flow via outbox email |
| Staff permission scoping | `tests/auth-convex.spec.js` staff flow |
| Invalid link handling | `tests/auth-convex.spec.js` invalid token flow |
| Cooldown behavior | `tests/auth-convex.spec.js` repeat request cooldown flow |
| Sign-out regression | `tests/auth-convex.spec.js` sign-out flow |

## Operational Notes

- M29 is the first outbound email milestone, but not the default-auth flip milestone.
- A later milestone can make Convex auth the default only after M29 is stable in real delivery environments.
