import { getBookingById, getTenantConfig, listBookings } from "@/lib/app/client"
import type { Booking, TenantConfig } from "@/lib/api/types"

export async function getTenantConfigOrNull(tenantSlug: string): Promise<TenantConfig | null> {
  const result = await getTenantConfig(tenantSlug)
  if (result.ok) return result.data
  if (result.error.code === "NOT_FOUND") return null
  throw new Error(`${result.error.code}: ${result.error.message}`)
}

export async function getTenantTimezone(
  tenantSlug: string,
  fallback = "Europe/Prague"
): Promise<string> {
  const config = await getTenantConfigOrNull(tenantSlug)
  return config?.timezone ?? fallback
}

export async function listTenantBookings(
  tenantSlug: string
): Promise<Booking[]> {
  const result = await listBookings(tenantSlug)
  return result.ok ? result.data : []
}

export async function getTenantBookingByIdOrNull(
  tenantSlug: string,
  bookingId: string
): Promise<Booking | null> {
  const result = await getBookingById(tenantSlug, bookingId)
  if (result.ok) return result.data
  if (result.error.code === "NOT_FOUND") return null
  throw new Error(`${result.error.code}: ${result.error.message}`)
}
