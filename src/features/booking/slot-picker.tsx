"use client"

import Link from "next/link"
import { addDays, format } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type AppLocale } from "@/i18n/locales"
import { getAvailability } from "@/lib/api"
import { type AvailabilitySlot, type ServiceVariant } from "@/lib/api/types"
import { useGtm } from "@/lib/gtm/useGtm"
import { useService } from "@/lib/query/hooks/use-service"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"
import { localePath, tenantUrl } from "@/lib/tenant/tenant-url"

interface SlotPickerProps {
  locale: AppLocale
  tenantSlug: string
  serviceId: string
  variant: ServiceVariant
  staffId?: string
  initialDate: string
  uiQuery?: string
  mode?: "create" | "manage"
  bookingToken?: string
  bookingId?: string
  originalStartAt?: string
  t: {
    loading: string
    noSlots: string
    back: string
    title: string
    description: string
    chooseDate: string
    selectedVariant: string
    durationUnit: string
    continue: string
    busy: string
    manageBanner: string
    originalSlot: string
    manageContinue: string
  }
}

function toDateInput(date: Date) {
  return format(date, "yyyy-MM-dd")
}

export function SlotPicker({
  locale,
  tenantSlug,
  serviceId,
  variant,
  staffId,
  initialDate,
  uiQuery,
  mode = "create",
  bookingToken,
  bookingId,
  originalStartAt,
  t,
}: Readonly<SlotPickerProps>) {
  const tenantConfigQuery = useTenantConfig(tenantSlug)
  const serviceQuery = useService(tenantSlug, serviceId)
  const [date, setDate] = useState(initialDate)
  const { pushEvent } = useGtm()

  const availabilityQuery = useQuery({
    queryKey: ["availability", tenantSlug, serviceId, variant, staffId ?? "any", date],
    queryFn: async () => {
      const result = await getAvailability({
        tenantSlug,
        serviceId,
        serviceVariant: variant,
        staffId,
        date,
      })
      if (!result.ok) {
        throw new Error(`${result.error.code}: ${result.error.message}`)
      }
      return result.data
    },
  })

  const timezone = tenantConfigQuery.data?.timezone ?? "Europe/Prague"

  const days = useMemo(() => {
    const base = new Date(`${date}T00:00:00`)
    return Array.from({ length: 7 }, (_, index) => {
      const next = addDays(base, index)
      return toDateInput(next)
    })
  }, [date])

  const slots = availabilityQuery.data ?? []
  const isManageMode = mode === "manage" && Boolean(bookingToken && bookingId)
  const backHref =
    isManageMode && bookingToken
      ? localePath({ locale, path: `/m/${bookingToken}` })
      : `${tenantUrl({ locale, tenantSlug, path: `/book/${serviceId}` })}?variant=${variant}${
          staffId ? `&staffId=${staffId}` : ""
        }${uiQuery ? `&${uiQuery}` : ""}`

  return (
    <div className="grid gap-4">
      <Link href={backHref} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        {t.back}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isManageMode && originalStartAt ? (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{t.manageBanner}</p>
              <p className="mt-1 text-muted-foreground">
                {t.originalSlot}:{" "}
                {formatInTimeZone(new Date(originalStartAt), timezone, "yyyy-MM-dd HH:mm")}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {t.selectedVariant}: {variant} {t.durationUnit}
            </Badge>
            {serviceQuery.data ? <Badge variant="outline">{serviceQuery.data.name}</Badge> : null}
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">{t.chooseDate}</p>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <Button
                  key={day}
                  type="button"
                  size="sm"
                  variant={day === date ? "default" : "outline"}
                  onClick={() => setDate(day)}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>

          {availabilityQuery.isLoading ? (
            <div className="grid gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : null}

          {!availabilityQuery.isLoading && slots.length === 0 ? (
            <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
              {t.noSlots}
            </div>
          ) : null}

          {!availabilityQuery.isLoading ? (
            <div className="grid gap-2">
              {slots.map((slot: AvailabilitySlot) => {
                const label = formatInTimeZone(new Date(slot.startAt), timezone, "HH:mm")
                const detailsHref = `${tenantUrl({
                  locale,
                  tenantSlug,
                  path: `/book/${serviceId}/details`,
                })}?variant=${variant}${staffId ? `&staffId=${staffId}` : ""}&date=${date}&startAt=${encodeURIComponent(
                  slot.startAt
                )}${uiQuery ? `&${uiQuery}` : ""}`
                const manageHref = `${tenantUrl({
                  locale,
                  tenantSlug,
                  path: "/book/confirmation",
                })}?mode=manage&token=${encodeURIComponent(String(bookingToken ?? ""))}&bookingId=${encodeURIComponent(
                  String(bookingId ?? "")
                )}&serviceId=${encodeURIComponent(serviceId)}&variant=${variant}${
                  staffId ? `&staffId=${encodeURIComponent(staffId)}` : ""
                }&startAt=${encodeURIComponent(slot.startAt)}&date=${encodeURIComponent(date)}${
                  uiQuery ? `&${uiQuery}` : ""
                }`
                const href = isManageMode ? manageHref : detailsHref

                if (slot.status !== "available") {
                  return (
                    <div
                      key={slot.id}
                      className="flex h-10 items-center justify-between rounded-md border border-border px-3 text-sm text-muted-foreground"
                    >
                      <span>{label}</span>
                      <span>{t.busy}</span>
                    </div>
                  )
                }

                return (
                  <Link
                    key={slot.id}
                    href={href}
                    onClick={() => {
                      pushEvent("select_slot", {
                        tenantSlug,
                        serviceId,
                        staffId: slot.staffId ?? staffId ?? null,
                        startAt: slot.startAt,
                        duration: variant,
                      })
                    }}
                    className="flex h-10 items-center justify-between rounded-md border border-border px-3 text-sm hover:bg-muted"
                  >
                    <span>{label}</span>
                    <span>{isManageMode ? t.manageContinue : t.continue}</span>
                  </Link>
                )
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
