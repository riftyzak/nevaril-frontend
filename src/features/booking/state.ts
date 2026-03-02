import type { ServiceVariant } from "@/lib/api/types"

export interface BookingState {
  variant: ServiceVariant
  staffId?: string
  date?: string
  startAt?: string
  mode: "create" | "manage"
  token?: string
  bookingId?: string
}

export function parseVariant(value?: string): ServiceVariant {
  if (value === "30" || value === "60" || value === "90") {
    return Number(value) as ServiceVariant
  }
  return 60
}

export function parseBookingState(searchParams: Record<string, string | string[] | undefined>): BookingState {
  const variantRaw = searchParams.variant
  const staffIdRaw = searchParams.staffId
  const dateRaw = searchParams.date
  const startAtRaw = searchParams.startAt
  const modeRaw = searchParams.mode
  const tokenRaw = searchParams.token
  const bookingIdRaw = searchParams.bookingId

  const variant = parseVariant(Array.isArray(variantRaw) ? variantRaw[0] : variantRaw)
  const staffId = Array.isArray(staffIdRaw) ? staffIdRaw[0] : staffIdRaw
  const date = Array.isArray(dateRaw) ? dateRaw[0] : dateRaw
  const startAt = Array.isArray(startAtRaw) ? startAtRaw[0] : startAtRaw
  const modeValue = Array.isArray(modeRaw) ? modeRaw[0] : modeRaw
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw
  const bookingId = Array.isArray(bookingIdRaw) ? bookingIdRaw[0] : bookingIdRaw
  const mode = modeValue === "manage" ? "manage" : "create"

  return {
    variant,
    staffId: staffId || undefined,
    date: date || undefined,
    startAt: startAt || undefined,
    mode,
    token: token || undefined,
    bookingId: bookingId || undefined,
  }
}

export function createSearchParams(state: BookingState) {
  const params = new URLSearchParams()
  params.set("variant", String(state.variant))
  if (state.staffId) params.set("staffId", state.staffId)
  if (state.date) params.set("date", state.date)
  if (state.startAt) params.set("startAt", state.startAt)
  if (state.mode === "manage") params.set("mode", "manage")
  if (state.token) params.set("token", state.token)
  if (state.bookingId) params.set("bookingId", state.bookingId)
  return params.toString()
}
