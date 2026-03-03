"use client"

import Link from "next/link"
import { useMemo } from "react"
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
import { Label } from "@/components/ui/label"
import { type AppLocale } from "@/i18n/locales"
import { type ServiceVariant } from "@/lib/api/types"
import { useGtm } from "@/lib/gtm/useGtm"
import { useService } from "@/lib/query/hooks/use-service"
import { useStaff } from "@/lib/query/hooks/use-staff"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"
import { tenantUrl } from "@/lib/tenant/tenant-url"

interface ServiceDetailProps {
  locale: AppLocale
  tenantSlug: string
  serviceId: string
  initialVariant: ServiceVariant
  initialStaffId?: string
  uiQuery?: string
  t: {
    loading: string
    notFound: string
    backToCatalog: string
    chooseVariant: string
    chooseStaff: string
    anyStaff: string
    continueToSlots: string
    photosPlaceholder: string
    durationUnit: string
  }
}

function setParam(pathname: string, searchParams: URLSearchParams, key: string, value?: string) {
  const next = new URLSearchParams(searchParams.toString())
  if (!value) {
    next.delete(key)
  } else {
    next.set(key, value)
  }
  const query = next.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function ServiceDetail({
  locale,
  tenantSlug,
  serviceId,
  initialVariant,
  initialStaffId,
  uiQuery,
  t,
}: Readonly<ServiceDetailProps>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { pushEvent } = useGtm()

  const serviceQuery = useService(tenantSlug, serviceId)
  const staffQuery = useStaff(tenantSlug)
  const configQuery = useTenantConfig(tenantSlug)

  const variant = useMemo(() => {
    const fromQuery = searchParams.get("variant")
    if (fromQuery === "30" || fromQuery === "60" || fromQuery === "90") {
      return Number(fromQuery) as ServiceVariant
    }
    return initialVariant
  }, [initialVariant, searchParams])

  const staffId = searchParams.get("staffId") ?? initialStaffId

  if (serviceQuery.isLoading || configQuery.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t.loading}</CardContent>
      </Card>
    )
  }

  if (!serviceQuery.data) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t.notFound}</CardContent>
      </Card>
    )
  }

  const service = serviceQuery.data
  const canSelectStaff = configQuery.data?.staffSelectionEnabled

  const slotPath = tenantUrl({
    locale,
    tenantSlug,
    path: `/book/${serviceId}/slot`,
  })
  const slotParams = new URLSearchParams()
  slotParams.set("variant", String(variant))
  if (staffId) slotParams.set("staffId", staffId)
  const slotHref = `${slotPath}?${slotParams.toString()}`
  const slotHrefWithUi = `${slotHref}${uiQuery ? `&${uiQuery}` : ""}`

  return (
    <div className="grid gap-4">
      <Link
        href={`${tenantUrl({ locale, tenantSlug, path: "/book" })}${uiQuery ? `?${uiQuery}` : ""}`}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {t.backToCatalog}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{service.name}</CardTitle>
          <CardDescription>{service.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {t.photosPlaceholder}
          </div>

          <div className="grid gap-2">
            <Label>{t.chooseVariant}</Label>
            <div className="flex flex-wrap gap-2">
              {service.durationOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  data-testid={`variant-option-${option}`}
                  variant={option === variant ? "default" : "outline"}
                  onClick={() =>
                    router.replace(setParam(pathname, new URLSearchParams(searchParams), "variant", String(option)))
                  }
                >
                  {option} {t.durationUnit}
                </Button>
              ))}
            </div>
          </div>

          {canSelectStaff ? (
            <div className="grid gap-2">
              <Label htmlFor="staff-select">{t.chooseStaff}</Label>
              <select
                id="staff-select"
                data-testid="staff-select"
                value={staffId ?? ""}
                onChange={(event) => {
                  const selectedStaffId = event.target.value || undefined
                  if (selectedStaffId) {
                    pushEvent("select_staff", {
                      tenantSlug,
                      serviceId,
                      staffId: selectedStaffId,
                    })
                  }
                  router.replace(
                    setParam(pathname, new URLSearchParams(searchParams), "staffId", selectedStaffId)
                  )
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t.anyStaff}</option>
                {(staffQuery.data ?? []).map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Badge variant="outline">{t.anyStaff}</Badge>
          )}

          <Link
            href={slotHrefWithUi}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.continueToSlots}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
