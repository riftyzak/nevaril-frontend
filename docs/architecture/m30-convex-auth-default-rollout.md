# M30: Convex Auth as the Default Runtime

M30 flips the repo-wide auth default from `mock` to `convex`.

This milestone is operational, not product-expansion work:
- Convex auth is now the normal runtime path.
- mock auth remains available only through explicit env selection.
- real auth must fail clearly when required config is missing.
- signup, invites, OAuth, and password auth remain out of scope.

## Runtime Policy

Default auth resolution now lands on Convex auth:

```bash
AUTH_SOURCE=convex
NEXT_PUBLIC_AUTH_SOURCE=convex
```

Explicit mock fallback/dev/e2e mode remains:

```bash
AUTH_SOURCE=mock
NEXT_PUBLIC_AUTH_SOURCE=mock
```

Convex auth requires:

```bash
AUTH_EMAIL_PROVIDER=resend|memory
AUTH_EMAIL_FROM=<sender@example.com>
RESEND_API_KEY=<required when provider=resend>
```

Rules:
- there is no silent downgrade from Convex auth to mock auth
- `AUTH_EMAIL_PROVIDER=memory` is local/dev/e2e only
- `AUTH_EMAIL_PROVIDER=resend` is the canonical product delivery path
- Convex auth expects Convex app-data mode and a configured Convex URL

## Test Harness Policy

Playwright default-auth coverage now starts the app in Convex auth mode unless tests explicitly override it.

The auth e2e harness uses:
- `AUTH_EMAIL_PROVIDER=memory`
- `AUTH_EMAIL_FROM=test@nevaril.local`
- `E2E_BOOTSTRAP=1`

Explicit mock-mode tests must opt in with both mock auth envs.

## Verification Matrix

Focused acceptance:

| Area | Verification |
| --- | --- |
| Default unauthenticated redirect | protected admin route lands on Convex sign-in without auth override |
| Convex sign-in flow | `tests/auth-convex.spec.js` with `AUTH_EMAIL_PROVIDER=memory` |
| Sign-out regression | `tests/auth-convex.spec.js` sign-out flow |
| Explicit mock fallback | `tests/smoke.spec.js` with mock auth envs |
| Runtime config failures | startup validation for mismatched auth envs and missing email config |

## Operational Notes

- M30 makes Convex auth the canonical setup in docs, examples, and the test harness.
- mock auth remains in the repo to support fallback/dev/e2e workflows.
- A later milestone can build account lifecycle work on top of the Convex-default runtime.
