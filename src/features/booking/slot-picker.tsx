"use client"

import Link from "next/link"
import { addDays, addWeeks, format, isToday, startOfWeek } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

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
    blocked: string
    timeOff: string
    available: string
    statusLegend: string
    today: string
    previousWeek: string
    nextWeek: string
    loadingError: string
    retry: string
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
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
  const todayDate = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd")

  const days = useMemo(() => {
    const base = new Date(`${date}T00:00:00`)
    const start = startOfWeek(base, { weekStartsOn: 1 })

    return Array.from({ length: 7 }, (_, index) => {
      const next = addDays(start, index)
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

  function setDateWithUrl(nextDate: string) {
    setDate(nextDate)
    if (!searchParams) return

    const next = new URLSearchParams(searchParams.toString())
    next.set("date", nextDate)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function visualStatus(slot: AvailabilitySlot): "available" | "busy" | "blocked" | "timeOff" {
    if (slot.status === "available") return "available"
    if (slot.status === "blocked") {
      return staffId ? "timeOff" : "blocked"
    }
    return "busy"
  }

  const weekLabel = `${days[0]} - ${days[days.length - 1]}`

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

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{t.chooseDate}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setDateWithUrl(toDateInput(addWeeks(new Date(`${date}T00:00:00`), -1)))
                  }
                >
                  {t.previousWeek}
                </Button>
                <span>{weekLabel}</span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setDateWithUrl(toDateInput(addWeeks(new Date(`${date}T00:00:00`), 1)))
                  }
                >
                  {t.nextWeek}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={date === todayDate ? "default" : "outline"}
                onClick={() => setDateWithUrl(todayDate)}
              >
                {t.today}
              </Button>
              {days.map((day) => (
                <Button
                  key={day}
                  type="button"
                  size="sm"
                  variant={day === date ? "default" : "outline"}
                  onClick={() => setDateWithUrl(day)}
                >
                  {format(new Date(`${day}T00:00:00`), "EEE dd")} {isToday(new Date(`${day}T00:00:00`)) ? "•" : ""}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">{t.statusLegend}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge>{t.available}</Badge>
              <Badge variant="secondary">{t.busy}</Badge>
              <Badge variant="outline">{t.blocked}</Badge>
              <Badge variant="outline">{t.timeOff}</Badge>
            </div>
          </div>

          {availabilityQuery.isLoading ? (
            <div className="rounded-md border border-border p-4">
              <div className="grid gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            </div>
          ) : null}

          {availabilityQuery.isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <p>{t.loadingError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void availabilityQuery.refetch()}
                className="mt-3"
              >
                {t.retry}
              </Button>
            </div>
          ) : null}

          {!availabilityQuery.isLoading && !availabilityQuery.isError && slots.length === 0 ? (
            <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
              {t.noSlots}
            </div>
          ) : null}

          {!availabilityQuery.isLoading ? (
            <div className="grid gap-2">
              {slots.map((slot: AvailabilitySlot) => {
                const label = formatInTimeZone(new Date(slot.startAt), timezone, "HH:mm")
                const status = visualStatus(slot)
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

                if (status !== "available") {
                  const statusLabel =
                    status === "busy" ? t.busy : status === "blocked" ? t.blocked : t.timeOff
                  return (
                    <div
                      key={slot.id}
                      className="flex h-10 items-center justify-between rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground"
                    >
                      <span>{label}</span>
                      <span>{statusLabel}</span>
                    </div>
                  )
                }

                return (
                  <Link
                    key={slot.id}
                    href={href}
                    data-testid={`slot-option-${slot.id}`}
                    onClick={() => {
                      pushEvent("select_slot", {
                        tenantSlug,
                        serviceId,
                        staffId: slot.staffId ?? staffId ?? null,
                        startAt: slot.startAt,
                        duration: variant,
                      })
                    }}
                    className="flex h-10 items-center justify-between rounded-md border border-border px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
