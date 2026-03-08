"use client"

import { useQuery } from "@tanstack/react-query"

import { getBookingById } from "@/lib/app/client"
import { unwrapResult } from "@/lib/query/hooks/utils"
import { queryKeys } from "@/lib/query/keys"

export function useBooking(tenantSlug: string, bookingId: string) {
  return useQuery({
    queryKey: queryKeys.booking(tenantSlug, bookingId),
    queryFn: async () => unwrapResult(await getBookingById(tenantSlug, bookingId)),
    enabled: Boolean(tenantSlug && bookingId),
  })
}
