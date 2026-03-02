"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { formatInTimeZone } from "date-fns-tz"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type AppLocale } from "@/i18n/locales"
import { getBookingByToken } from "@/lib/api"
import { useService } from "@/lib/query/hooks/use-service"
import { useStaff } from "@/lib/query/hooks/use-staff"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"
import { tenantUrl } from "@/lib/tenant/tenant-url"

interface ConfirmationProps {
  locale: AppLocale
  tenantSlug: string
  token?: string
  serviceId?: string
  t: {
    missingToken: string
    loading: string
    notFound: string
    title: string
    description: string
    service: string
    variant: string
    durationUnit: string
    staff: string
    date: string
    customer: string
    addToCalendar: string
    newBooking: string
    noStaff: string
  }
}

export function Confirmation({
  locale,
  tenantSlug,
  token,
  serviceId,
  t,
}: Readonly<ConfirmationProps>) {
  const tenantConfigQuery = useTenantConfig(tenantSlug)
  const staffQuery = useStaff(tenantSlug)
  const bookingQuery = useQuery({
    queryKey: ["booking-token", tenantSlug, token],
    queryFn: async () => {
      if (!token) throw new Error("MISSING_TOKEN")
      const result = await getBookingByToken(tenantSlug, token)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    enabled: Boolean(token),
  })

  const serviceQuery = useService(tenantSlug, serviceId ?? bookingQuery.data?.serviceId ?? "")

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t.missingToken}</CardContent>
      </Card>
    )
  }

  if (bookingQuery.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t.loading}</CardContent>
      </Card>
    )
  }

  if (!bookingQuery.data) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t.notFound}</CardContent>
      </Card>
    )
  }

  const booking = bookingQuery.data
  const staffName = staffQuery.data?.find((staff) => staff.id === booking.staffId)?.fullName
  const timezone = tenantConfigQuery.data?.timezone ?? booking.timezone

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <p>
          <span className="text-muted-foreground">{t.service}: </span>
          {serviceQuery.data?.name ?? booking.serviceId}
        </p>
        <p>
          <span className="text-muted-foreground">{t.variant}: </span>
          {booking.serviceVariant} {t.durationUnit}
        </p>
        <p>
          <span className="text-muted-foreground">{t.staff}: </span>
          {staffName ?? t.noStaff}
        </p>
        <p>
          <span className="text-muted-foreground">{t.date}: </span>
          {formatInTimeZone(new Date(booking.startAt), timezone, "yyyy-MM-dd HH:mm")}
        </p>
        <p>
          <span className="text-muted-foreground">{t.customer}: </span>
          {booking.customerName}
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" variant="outline">
            {t.addToCalendar}
          </Button>
          <Link
            href={tenantUrl({ locale, tenantSlug, path: "/book" })}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.newBooking}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
