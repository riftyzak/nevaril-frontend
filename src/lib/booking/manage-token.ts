export function getTenantSlugFromBookingToken(token: string) {
  const marker = "-manage-"
  const markerIndex = token.indexOf(marker)
  if (markerIndex <= 0) return null
  return token.slice(0, markerIndex)
}
