export function isE2EBootstrapEnabled() {
  return process.env.E2E_BOOTSTRAP === "1" || process.env.NEXT_PUBLIC_E2E === "1"
}
