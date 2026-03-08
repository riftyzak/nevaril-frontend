import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import { type AppLocale } from "@/i18n/locales"
import { BookingSummary } from "@/features/booking/booking-summary"
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
      tenantSlug={tenantSlug}
      widgetMode={state.widget}
      themeOverrides={{
        primary: state.primary,
        radius: state.radius,
        logoUrl: state.logoUrl,
      }}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
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
              loadFailed: t("catalog.loadFailed"),
              empty: t("catalog.empty"),
              openService: t("catalog.openService"),
              categoryLabel: t("catalog.categoryLabel"),
              durationUnit: t("durationUnit"),
            }}
          />
        </div>
        <BookingSummary
          tenantSlug={tenantSlug}
          variant={state.variant}
          staffId={state.staffId}
          date={state.date}
          startAt={state.startAt}
          className="h-fit lg:sticky lg:top-4"
          t={{
            title: t("summary.title"),
            service: t("summary.service"),
            variant: t("summary.variant"),
            staff: t("summary.staff"),
            date: t("summary.date"),
            price: t("summary.price"),
            priceValue: t("summary.priceValue"),
            durationUnit: t("durationUnit"),
            notSelected: t("summary.notSelected"),
            noStaff: t("common.noStaff"),
          }}
        />
      </div>
    </PublicShell>
  )
}
