"use client"

import { formatInTimeZone } from "date-fns-tz"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useService } from "@/lib/query/hooks/use-service"
import { useStaff } from "@/lib/query/hooks/use-staff"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"

interface BookingSummaryProps {
  tenantSlug: string
  serviceId?: string
  variant?: string | number
  staffId?: string
  startAt?: string
  date?: string
  className?: string
  t: {
    title: string
    service: string
    variant: string
    staff: string
    date: string
    price: string
    priceValue: string
    durationUnit: string
    notSelected: string
    noStaff: string
  }
}

export function BookingSummary({
  tenantSlug,
  serviceId,
  variant,
  staffId,
  startAt,
  date,
  className,
  t,
}: Readonly<BookingSummaryProps>) {
  const serviceQuery = useService(tenantSlug, serviceId ?? "")
  const staffQuery = useStaff(tenantSlug)
  const tenantConfigQuery = useTenantConfig(tenantSlug)
  const timezone = tenantConfigQuery.data?.timezone ?? "Europe/Prague"

  const selectedStaff = staffQuery.data?.find((item) => item.id === staffId)
  const serviceLabel = serviceQuery.data?.name ?? (serviceId ? serviceId : t.notSelected)
  const variantLabel = variant ? `${variant} ${t.durationUnit}` : t.notSelected
  const staffLabel = staffId ? (selectedStaff?.fullName ?? t.noStaff) : t.noStaff
  const dateLabel = startAt
    ? formatInTimeZone(new Date(startAt), timezone, "yyyy-MM-dd HH:mm")
    : (date ?? t.notSelected)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <p>
          <span className="text-muted-foreground">{t.service}: </span>
          {serviceLabel}
        </p>
        <p>
          <span className="text-muted-foreground">{t.variant}: </span>
          {variantLabel}
        </p>
        <p>
          <span className="text-muted-foreground">{t.staff}: </span>
          {staffLabel}
        </p>
        <p>
          <span className="text-muted-foreground">{t.date}: </span>
          {dateLabel}
        </p>
        <p>
          <span className="text-muted-foreground">{t.price}: </span>
          {t.priceValue}
        </p>
      </CardContent>
    </Card>
  )
}
