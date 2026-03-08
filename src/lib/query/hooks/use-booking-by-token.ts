"use client"

import { useQuery } from "@tanstack/react-query"

import { getBookingByToken } from "@/lib/app/client"
import { unwrapResult } from "@/lib/query/hooks/utils"
import { queryKeys } from "@/lib/query/keys"

export function useBookingByToken(bookingToken: string, tenantSlug?: string) {
  return useQuery({
    queryKey: queryKeys.bookingToken(tenantSlug ?? "", bookingToken),
    queryFn: async () => unwrapResult(await getBookingByToken(bookingToken, tenantSlug)),
    enabled: Boolean(bookingToken),
  })
}
