"use client"

import { useQuery } from "@tanstack/react-query"

import { listBookings } from "@/lib/app/client"
import { unwrapResult } from "@/lib/query/hooks/utils"
import { queryKeys } from "@/lib/query/keys"

export function useBookings(tenantSlug: string) {
  return useQuery({
    queryKey: queryKeys.bookings(tenantSlug),
    queryFn: async () => unwrapResult(await listBookings(tenantSlug)),
    enabled: Boolean(tenantSlug),
  })
}
