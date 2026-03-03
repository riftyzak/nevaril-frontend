"use client"

import { QRCodeSVG } from "qrcode.react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AppLocale } from "@/i18n/locales"
import { useServices } from "@/lib/query/hooks/use-services"
import type { TenantSource } from "@/lib/tenant/resolveTenant"
import { publicTenantAbsoluteUrl } from "@/lib/tenant/tenant-url"

interface EmbedPanelProps {
  locale: AppLocale
  tenantSlug: string
  source: TenantSource | "path" | "subdomain"
  host: string
  protocol: "http" | "https"
  t: {
    title: string
    description: string
    bookingEntry: string
    serviceLink: string
    chooseService: string
    copyUrl: string
    copied: string
    widgetTitle: string
    widgetDescription: string
    primary: string
    radius: string
    logoUrl: string
    iframeSnippet: string
    copySnippet: string
  }
}

export function EmbedPanel({
  locale,
  tenantSlug,
  source,
  host,
  protocol,
  t,
}: Readonly<EmbedPanelProps>) {
  const servicesQuery = useServices(tenantSlug)
  const [serviceId, setServiceId] = useState("")
  const [primary, setPrimary] = useState("")
  const [radius, setRadius] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  const baseBookingUrl = useMemo(
    () =>
      publicTenantAbsoluteUrl({
        locale,
        tenantSlug,
        source,
        host,
        protocol,
        path: "/book",
      }),
    [host, locale, protocol, source, tenantSlug]
  )

  const serviceDeepLink = useMemo(() => {
    if (!serviceId) return ""
    const params = new URLSearchParams({ prefill: "1" })
    const base = publicTenantAbsoluteUrl({
      locale,
      tenantSlug,
      source,
      host,
      protocol,
      path: `/book/${serviceId}`,
    })
    return `${base}?${params.toString()}`
  }, [host, locale, protocol, serviceId, source, tenantSlug])

  const widgetSrc = useMemo(() => {
    const params = new URLSearchParams({ widget: "1" })
    if (primary.trim()) params.set("primary", primary.trim())
    if (radius.trim()) params.set("radius", radius.trim())
    if (logoUrl.trim()) params.set("logoUrl", logoUrl.trim())
    const base = publicTenantAbsoluteUrl({
      locale,
      tenantSlug,
      source,
      host,
      protocol,
      path: "/book",
    })
    return `${base}?${params.toString()}`
  }, [host, locale, logoUrl, primary, protocol, radius, source, tenantSlug])

  const snippet = `<iframe src="${widgetSrc}" width="100%" height="720" frameBorder="0" loading="lazy"></iframe>`

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value)
    toast.success(t.copied)
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <p className="text-sm font-medium">{t.bookingEntry}</p>
            <Input value={baseBookingUrl} readOnly />
            <Button type="button" variant="outline" onClick={() => void copyText(baseBookingUrl)}>
              {t.copyUrl}
            </Button>
          </div>
          <div className="flex justify-center rounded-md border border-border p-4">
            <QRCodeSVG value={baseBookingUrl} size={180} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.serviceLink}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <Label htmlFor="embed-service">{t.chooseService}</Label>
            <select
              id="embed-service"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">-</option>
              {(servicesQuery.data ?? []).map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <Input value={serviceDeepLink} readOnly />
            <Button type="button" variant="outline" disabled={!serviceDeepLink} onClick={() => void copyText(serviceDeepLink)}>
              {t.copyUrl}
            </Button>
          </div>
          <div className="flex justify-center rounded-md border border-border p-4">
            {serviceDeepLink ? <QRCodeSVG value={serviceDeepLink} size={180} /> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.widgetTitle}</CardTitle>
          <CardDescription>{t.widgetDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="embed-primary">{t.primary}</Label>
              <Input id="embed-primary" value={primary} onChange={(event) => setPrimary(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="embed-radius">{t.radius}</Label>
              <Input id="embed-radius" value={radius} onChange={(event) => setRadius(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="embed-logo">{t.logoUrl}</Label>
              <Input id="embed-logo" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} />
            </div>
          </div>
          <Label htmlFor="embed-snippet">{t.iframeSnippet}</Label>
          <textarea
            id="embed-snippet"
            value={snippet}
            readOnly
            className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-xs"
          />
          <Button type="button" onClick={() => void copyText(snippet)}>
            {t.copySnippet}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
