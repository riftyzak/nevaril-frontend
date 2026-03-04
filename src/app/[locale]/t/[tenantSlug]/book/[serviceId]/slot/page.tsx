import { formatInTimeZone } from "date-fns-tz"
import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import { type AppLocale } from "@/i18n/locales"
import { BookingSummary } from "@/features/booking/booking-summary"
import { BookingProgress } from "@/features/booking/progress"
import { createUiSearchParams, parseBookingState } from "@/features/booking/state"
import { SlotPicker } from "@/features/booking/slot-picker"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function SlotPage({
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

  const initialDate = state.date ?? formatInTimeZone(new Date(), "Europe/Prague", "yyyy-MM-dd")

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
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <BookingProgress
            current="slot"
            labels={{
              service: t("progress.service"),
              slot: t("progress.slot"),
              details: t("progress.details"),
              confirm: t("progress.confirm"),
            }}
          />
          <SlotPicker
            locale={locale}
            tenantSlug={tenantSlug}
            serviceId={serviceId}
            variant={state.variant}
            staffId={state.staffId}
            initialDate={initialDate}
            uiQuery={uiQuery}
            mode={state.mode}
            bookingToken={state.token}
            bookingId={state.bookingId}
            originalStartAt={state.mode === "manage" ? state.startAt : undefined}
            t={{
              loading: t("slot.loading"),
              noSlots: t("slot.noSlots"),
              back: t("slot.back"),
              title: t("slot.title"),
              description: t("slot.description"),
              chooseDate: t("slot.chooseDate"),
              selectedVariant: t("slot.selectedVariant"),
              durationUnit: t("durationUnit"),
              continue: t("slot.continue"),
              busy: t("slot.busy"),
              blocked: t("slot.blocked"),
              timeOff: t("slot.timeOff"),
              available: t("slot.available"),
              statusLegend: t("slot.statusLegend"),
              today: t("slot.today"),
              previousWeek: t("slot.previousWeek"),
              nextWeek: t("slot.nextWeek"),
              loadingError: t("slot.loadingError"),
              retry: t("slot.retry"),
              manageBanner: t("slot.manageBanner"),
              originalSlot: t("slot.originalSlot"),
              manageContinue: t("slot.manageContinue"),
            }}
          />
        </div>
        <BookingSummary
          tenantSlug={tenantSlug}
          serviceId={serviceId}
          variant={state.variant}
          staffId={state.staffId}
          date={state.date ?? initialDate}
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
