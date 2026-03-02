"use client"

import { useQuery } from "@tanstack/react-query"

import { getTenantConfig } from "@/lib/api"
import { queryKeys } from "@/lib/query/keys"
import { unwrapResult } from "@/lib/query/hooks/utils"

export function useTenantConfig(tenantSlug: string) {
  return useQuery({
    queryKey: queryKeys.tenantConfig(tenantSlug),
    queryFn: async () => unwrapResult(await getTenantConfig(tenantSlug)),
    enabled: Boolean(tenantSlug),
  })
}
