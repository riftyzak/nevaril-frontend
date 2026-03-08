import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference } from "convex/server"

import { convexContracts } from "@/lib/app/convex-contracts"
import type { Service, Staff, TenantConfig } from "@/lib/api/types"

const tenantSettingsGetRef = makeFunctionReference<
  "query",
  { tenantSlug: string },
  TenantConfig | null
>(convexContracts.tenantSettings.get.name)

const servicesListRef = makeFunctionReference<"query", { tenantSlug: string }, Service[]>(
  convexContracts.services.list.name
)

const servicesGetRef = makeFunctionReference<
  "query",
  { tenantSlug: string; serviceId: string },
  Service | null
>(convexContracts.services.get.name)

const staffListRef = makeFunctionReference<"query", { tenantSlug: string }, Staff[]>(
  convexContracts.staff.list.name
)

const clientCache = new Map<string, ConvexHttpClient>()

export function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL) for APP_DATA_SOURCE=convex."
    )
  }
  return url
}

function getConvexClient() {
  const url = getConvexUrl()
  const existing = clientCache.get(url)
  if (existing) return existing

  const client = new ConvexHttpClient(url)
  clientCache.set(url, client)
  return client
}

export async function queryConvexTenantConfig(tenantSlug: string) {
  return getConvexClient().query(tenantSettingsGetRef, { tenantSlug })
}

export async function queryConvexServices(tenantSlug: string) {
  return getConvexClient().query(servicesListRef, { tenantSlug })
}

export async function queryConvexService(tenantSlug: string, serviceId: string) {
  return getConvexClient().query(servicesGetRef, { tenantSlug, serviceId })
}

export async function queryConvexStaff(tenantSlug: string) {
  return getConvexClient().query(staffListRef, { tenantSlug })
}
