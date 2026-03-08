"use client"

import { useQuery } from "@tanstack/react-query"

import { getService } from "@/lib/app/client"
import { queryKeys } from "@/lib/query/keys"
import { unwrapResult } from "@/lib/query/hooks/utils"

export function useService(tenantSlug: string, serviceId: string) {
  return useQuery({
    queryKey: queryKeys.service(tenantSlug, serviceId),
    queryFn: async () => unwrapResult(await getService(tenantSlug, serviceId)),
    enabled: Boolean(tenantSlug && serviceId),
  })
}
