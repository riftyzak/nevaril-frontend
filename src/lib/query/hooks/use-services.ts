"use client"

import { useQuery } from "@tanstack/react-query"

import { listServices } from "@/lib/app/client"
import { queryKeys } from "@/lib/query/keys"
import { unwrapResult } from "@/lib/query/hooks/utils"

export function useServices(tenantSlug: string) {
  return useQuery({
    queryKey: queryKeys.services(tenantSlug),
    queryFn: async () => unwrapResult(await listServices(tenantSlug)),
    enabled: Boolean(tenantSlug),
  })
}
