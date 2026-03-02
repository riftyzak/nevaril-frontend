"use client"

import { useQuery } from "@tanstack/react-query"

import { listStaff } from "@/lib/api"
import { queryKeys } from "@/lib/query/keys"
import { unwrapResult } from "@/lib/query/hooks/utils"

export function useStaff(tenantSlug: string) {
  return useQuery({
    queryKey: queryKeys.staff(tenantSlug),
    queryFn: async () => unwrapResult(await listStaff(tenantSlug)),
    enabled: Boolean(tenantSlug),
  })
}
