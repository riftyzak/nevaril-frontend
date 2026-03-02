const HOUR_MS = 60 * 60 * 1000

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

export function canModifyBooking(
  now: Date | string,
  bookingStart: Date | string,
  tenantTz: string,
  hours = 24
) {
  void tenantTz
  const nowAt = toDate(now).getTime()
  const bookingAt = toDate(bookingStart).getTime()
  return bookingAt - nowAt >= hours * HOUR_MS
}
