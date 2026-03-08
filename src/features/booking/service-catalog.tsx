"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { type AppLocale } from "@/i18n/locales"
import { useGtm } from "@/lib/gtm/useGtm"
import { useServices } from "@/lib/query/hooks/use-services"
import { tenantUrl } from "@/lib/tenant/tenant-url"

interface ServiceCatalogProps {
  locale: AppLocale
  tenantSlug: string
  uiQuery?: string
  t: {
    searchPlaceholder: string
    loading: string
    loadFailed: string
    empty: string
    openService: string
    categoryLabel: string
    durationUnit: string
  }
}

export function ServiceCatalog({ locale, tenantSlug, uiQuery, t }: Readonly<ServiceCatalogProps>) {
  const [query, setQuery] = useState("")
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { pushEvent, pushEventOnce } = useGtm()
  const servicesQuery = useServices(tenantSlug)
  const searchParamsString = searchParams?.toString?.() ?? ""

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    const all = servicesQuery.data ?? []
    if (!value) return all

    return all.filter((service) =>
      `${service.name} ${service.category} ${service.description}`.toLowerCase().includes(value)
    )
  }, [query, servicesQuery.data])

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, typeof filtered>>((acc, service) => {
      if (!acc[service.category]) acc[service.category] = []
      acc[service.category].push(service)
      return acc
    }, {})
  }, [filtered])

  useEffect(() => {
    pushEventOnce(
      "view_form",
      {
        tenantSlug,
      },
      `view_form:${pathname}:${searchParamsString}`
    )
  }, [pathname, pushEventOnce, searchParamsString, tenantSlug])

  return (
    <div className="grid gap-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchPlaceholder}
      />

      {servicesQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">{t.loading}</CardContent>
        </Card>
      ) : null}

      {servicesQuery.isError ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{t.loadFailed}</CardContent>
        </Card>
      ) : null}

      {!servicesQuery.isLoading && !servicesQuery.isError && filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">{t.empty}</CardContent>
        </Card>
      ) : null}

      {Object.entries(grouped).map(([category, services]) => (
        <section key={category} className="grid gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.categoryLabel}: {category}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <Card key={service.id} data-testid={`service-card-${service.id}`}>
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex flex-wrap gap-1">
                    {service.durationOptions.map((variant) => (
                      <Badge key={variant} variant="outline">
                        {variant} {t.durationUnit}
                      </Badge>
                    ))}
                  </div>
                  <Link
                    href={`${tenantUrl({ locale, tenantSlug, path: `/book/${service.id}` })}?variant=60${
                      uiQuery ? `&${uiQuery}` : ""
                    }`}
                    data-testid={`service-open-${service.id}`}
                    onClick={() => {
                      pushEvent("select_service", {
                        tenantSlug,
                        serviceId: service.id,
                      })
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t.openService}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
