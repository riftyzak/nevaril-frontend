# M26: E2E Bootstrap Hardening for Convex-Primary Builds

M26 removes the fragile compile-time dependency on `NEXT_PUBLIC_E2E` for test bootstrap.

## Bootstrap Policy

E2E bootstrap is now runtime-gated:

- preferred flag: `E2E_BOOTSTRAP=1`
- compatibility alias: `NEXT_PUBLIC_E2E=1`

`E2E_BOOTSTRAP` is evaluated at runtime in the server-rendered shells and passed into `DevMenu`. The existing `?__e2e=reset` semantics stay the same.

This means:

- `next dev` only needs `E2E_BOOTSTRAP=1` at runtime
- `next build` does not need any E2E bootstrap flag
- `next start` needs `E2E_BOOTSTRAP=1` at runtime if tests depend on `?__e2e=reset`

## Convex-Primary E2E

Dev mode:

```bash
set -a; source .env.local; set +a
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
E2E_BOOTSTRAP=1 \
npm run dev
```

Build/start mode:

```bash
npm run build
set -a; source .env.local; set +a
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
E2E_BOOTSTRAP=1 \
npm run start -- --port 4200
```

Focused verification:

```bash
set -a; source .env.local; set +a
APP_DATA_SOURCE=convex \
NEXT_PUBLIC_APP_DATA_SOURCE=convex \
npx playwright test \
  tests/e2e-bootstrap.spec.js \
  tests/bookings-create-convex.spec.js \
  tests/bookings-convex.spec.js
```

## Explicit Mock Fallback E2E

Mock fallback still works, but because `NEXT_PUBLIC_APP_DATA_SOURCE` is a public env, build/start mock mode must be explicit at both phases.

Build:

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
npm run build
```

Start:

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
E2E_BOOTSTRAP=1 \
npm run start -- --port 4200
```

Focused verification:

```bash
APP_DATA_SOURCE=mock \
NEXT_PUBLIC_APP_DATA_SOURCE=mock \
npx playwright test \
  tests/e2e-bootstrap.spec.js \
  tests/smoke.spec.js --grep "booking happy path"
```

## Regression Proof

The new `tests/e2e-bootstrap.spec.js` is the direct proof for the M25 failure:

- before M26, build/start could leave `__e2e=reset` in the URL because the bundle was not compiled with `NEXT_PUBLIC_E2E=1`
- after M26, build/start reset works with runtime `E2E_BOOTSTRAP=1` and the query param clears correctly
