import { getTenantConfig, listBookings } from "@/lib/app/client"
import type { Booking, TenantConfig } from "@/lib/api/types"

export async function getTenantConfigOrNull(tenantSlug: string): Promise<TenantConfig | null> {
  const result = await getTenantConfig(tenantSlug)
  return result.ok ? result.data : null
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
