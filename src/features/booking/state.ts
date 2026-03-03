import { getWidgetThemeOverrides } from "@/lib/theme/widget-theme"
import type { ServiceVariant } from "@/lib/api/types"

export interface BookingState {
  variant: ServiceVariant
  staffId?: string
  date?: string
  startAt?: string
  mode: "create" | "manage"
  token?: string
  bookingId?: string
  widget: boolean
  primary?: string
  radius?: string
  logoUrl?: string
  prefill?: string
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
  const widgetRaw = searchParams.widget
  const primaryRaw = searchParams.primary
  const radiusRaw = searchParams.radius
  const logoUrlRaw = searchParams.logoUrl
  const prefillRaw = searchParams.prefill

  const variant = parseVariant(Array.isArray(variantRaw) ? variantRaw[0] : variantRaw)
  const staffId = Array.isArray(staffIdRaw) ? staffIdRaw[0] : staffIdRaw
  const date = Array.isArray(dateRaw) ? dateRaw[0] : dateRaw
  const startAt = Array.isArray(startAtRaw) ? startAtRaw[0] : startAtRaw
  const modeValue = Array.isArray(modeRaw) ? modeRaw[0] : modeRaw
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw
  const bookingId = Array.isArray(bookingIdRaw) ? bookingIdRaw[0] : bookingIdRaw
  const widgetValue = Array.isArray(widgetRaw) ? widgetRaw[0] : widgetRaw
  const primaryValue = Array.isArray(primaryRaw) ? primaryRaw[0] : primaryRaw
  const radiusValue = Array.isArray(radiusRaw) ? radiusRaw[0] : radiusRaw
  const logoUrlValue = Array.isArray(logoUrlRaw) ? logoUrlRaw[0] : logoUrlRaw
  const prefill = Array.isArray(prefillRaw) ? prefillRaw[0] : prefillRaw
  const mode = modeValue === "manage" ? "manage" : "create"
  const widget = widgetValue === "1"
  const theme = getWidgetThemeOverrides({
    primary: primaryValue,
    radius: radiusValue,
    logoUrl: logoUrlValue,
  })

  return {
    variant,
    staffId: staffId || undefined,
    date: date || undefined,
    startAt: startAt || undefined,
    mode,
    token: token || undefined,
    bookingId: bookingId || undefined,
    widget,
    primary: theme.primary,
    radius: theme.radius,
    logoUrl: theme.logoUrl,
    prefill: prefill || undefined,
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
  if (state.widget) params.set("widget", "1")
  if (state.primary) params.set("primary", state.primary)
  if (state.radius) params.set("radius", state.radius.replace("px", ""))
  if (state.logoUrl) params.set("logoUrl", state.logoUrl)
  if (state.prefill) params.set("prefill", state.prefill)
  return params.toString()
}

export function createUiSearchParams(state: BookingState) {
  const params = new URLSearchParams()
  if (state.widget) params.set("widget", "1")
  if (state.primary) params.set("primary", state.primary)
  if (state.radius) params.set("radius", state.radius.replace("px", ""))
  if (state.logoUrl) params.set("logoUrl", state.logoUrl)
  if (state.prefill) params.set("prefill", state.prefill)
  return params.toString()
}
