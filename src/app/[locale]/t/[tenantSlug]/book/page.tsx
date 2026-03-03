import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import { type AppLocale } from "@/i18n/locales"
import { BookingProgress } from "@/features/booking/progress"
import { ServiceCatalog } from "@/features/booking/service-catalog"
import { createUiSearchParams, parseBookingState } from "@/features/booking/state"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function BookingCatalogPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { locale, tenantSlug } = await params
  const state = parseBookingState(await searchParams)
  const uiQuery = createUiSearchParams(state)
  const t = await getTranslations({ locale, namespace: "booking" })

  return (
    <PublicShell
      homeHref={tenantUrl({ locale, tenantSlug })}
      locale={locale}
      widgetMode={state.widget}
      themeOverrides={{
        primary: state.primary,
        radius: state.radius,
        logoUrl: state.logoUrl,
      }}
    >
      <BookingProgress
        current="service"
        labels={{
          service: t("progress.service"),
          slot: t("progress.slot"),
          details: t("progress.details"),
          confirm: t("progress.confirm"),
        }}
      />
      <ServiceCatalog
        locale={locale}
        tenantSlug={tenantSlug}
        uiQuery={uiQuery}
        t={{
          searchPlaceholder: t("catalog.searchPlaceholder"),
          loading: t("catalog.loading"),
          empty: t("catalog.empty"),
          openService: t("catalog.openService"),
          categoryLabel: t("catalog.categoryLabel"),
          durationUnit: t("durationUnit"),
        }}
      />
    </PublicShell>
  )
}
