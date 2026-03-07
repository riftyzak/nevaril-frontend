import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import { type AppLocale } from "@/i18n/locales"
import { BookingSummary } from "@/features/booking/booking-summary"
import { DetailsForm } from "@/features/booking/details-form"
import { BookingProgress } from "@/features/booking/progress"
import { createUiSearchParams, parseBookingState } from "@/features/booking/state"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function DetailsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string; serviceId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { locale, tenantSlug, serviceId } = await params
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
            current="details"
            labels={{
              service: t("progress.service"),
              slot: t("progress.slot"),
              details: t("progress.details"),
              confirm: t("progress.confirm"),
            }}
          />

          {!state.startAt ? (
            <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
              <p>{t("details.missingSlot")}</p>
              <Link
                href={`${tenantUrl({ locale, tenantSlug, path: `/book/${serviceId}/slot` })}?variant=${state.variant}${
                  uiQuery ? `&${uiQuery}` : ""
                }`}
                className="mt-1 inline-block underline-offset-4 hover:underline"
              >
                {t("details.backToSlot")}
              </Link>
            </div>
          ) : (
            <DetailsForm
              locale={locale}
              tenantSlug={tenantSlug}
              serviceId={serviceId}
              variant={state.variant}
              staffId={state.staffId}
              startAt={state.startAt}
              date={state.date}
              uiQuery={uiQuery}
              t={{
                back: t("details.back"),
                title: t("details.title"),
                description: t("details.description"),
                name: t("details.name"),
                email: t("details.email"),
                phone: t("details.phone"),
                submit: t("details.submit"),
                slotConflict: t("details.slotConflict"),
                slotConflictAction: t("details.slotConflictAction"),
                submitError: t("details.submitError"),
                requiredField: t("details.requiredField"),
                customFieldPrefix: t("details.customFieldPrefix"),
                submitting: t("details.submitting"),
              }}
            />
          )}
        </div>
        <BookingSummary
          tenantSlug={tenantSlug}
          serviceId={serviceId}
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
