import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import { Confirmation } from "@/features/booking/confirmation"
import { BookingSummary } from "@/features/booking/booking-summary"
import { BookingProgress } from "@/features/booking/progress"
import { createUiSearchParams, parseBookingState } from "@/features/booking/state"
import { type AppLocale } from "@/i18n/locales"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function ConfirmationPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { locale, tenantSlug } = await params
  const query = await searchParams
  const tokenParam = query.token
  const serviceParam = query.serviceId
  const modeParam = query.mode
  const bookingIdParam = query.bookingId
  const startAtParam = query.startAt
  const dateParam = query.date
  const variantParam = query.variant
  const staffIdParam = query.staffId
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam
  const serviceId = Array.isArray(serviceParam) ? serviceParam[0] : serviceParam
  const mode = (Array.isArray(modeParam) ? modeParam[0] : modeParam) === "manage" ? "manage" : "create"
  const bookingId = Array.isArray(bookingIdParam) ? bookingIdParam[0] : bookingIdParam
  const startAt = Array.isArray(startAtParam) ? startAtParam[0] : startAtParam
  const date = Array.isArray(dateParam) ? dateParam[0] : dateParam
  const variant = Array.isArray(variantParam) ? variantParam[0] : variantParam
  const staffId = Array.isArray(staffIdParam) ? staffIdParam[0] : staffIdParam
  const state = parseBookingState(query)
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
            current="confirm"
            labels={{
              service: t("progress.service"),
              slot: t("progress.slot"),
              details: t("progress.details"),
              confirm: t("progress.confirm"),
            }}
          />
          <Confirmation
            locale={locale}
            tenantSlug={tenantSlug}
            token={token}
            serviceId={serviceId}
            mode={mode}
            bookingId={bookingId}
            startAt={startAt}
            date={date}
            variant={variant}
            staffId={staffId}
            uiQuery={uiQuery}
            t={{
              missingToken: t("confirm.missingToken"),
              loading: t("confirm.loading"),
              notFound: t("confirm.notFound"),
              title: t("confirm.title"),
              description: t("confirm.description"),
              service: t("confirm.service"),
              variant: t("confirm.variant"),
              durationUnit: t("durationUnit"),
              staff: t("confirm.staff"),
              date: t("confirm.date"),
              customer: t("confirm.customer"),
              addToCalendar: t("confirm.addToCalendar"),
              newBooking: t("confirm.newBooking"),
              noStaff: t("common.noStaff"),
              manageBooking: t("confirm.manageBooking"),
              manageTitle: t("confirm.manageTitle"),
              manageDescription: t("confirm.manageDescription"),
              originalTime: t("confirm.originalTime"),
              selectedTime: t("confirm.selectedTime"),
              confirmReschedule: t("confirm.confirmReschedule"),
              rescheduleSuccess: t("confirm.rescheduleSuccess"),
              rescheduleConflict: t("confirm.rescheduleConflict"),
              reschedulePolicyBlocked: t("confirm.reschedulePolicyBlocked"),
              rescheduleSubmitError: t("confirm.rescheduleSubmitError"),
              backToSlots: t("confirm.backToSlots"),
              submitting: t("confirm.submitting"),
            }}
          />
        </div>
        <BookingSummary
          tenantSlug={tenantSlug}
          serviceId={serviceId ?? undefined}
          variant={variant ?? undefined}
          staffId={staffId ?? undefined}
          date={date ?? undefined}
          startAt={startAt ?? undefined}
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
