import { headers } from "next/headers"
import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import { ManageBooking } from "@/features/booking/manage-booking"
import { type AppLocale } from "@/i18n/locales"
import { getTenantSlugFromBookingToken } from "@/lib/booking/manage-token"
import { type TenantSource } from "@/lib/tenant/resolveTenant"
import { TenantProvider } from "@/lib/tenant/tenant-provider"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function ManageBookingPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; bookingToken: string }>
}>) {
  const { locale, bookingToken } = await params
  const requestHeaders = await headers()

  const tenantSlug =
    getTenantSlugFromBookingToken(bookingToken) ??
    requestHeaders.get("x-tenant-slug") ??
    "barber"
  const source = (requestHeaders.get("x-tenant-source") ?? "path") as TenantSource
  const t = await getTranslations({ locale, namespace: "booking.manage" })

  return (
    <TenantProvider value={{ tenantSlug, locale, source }}>
      <PublicShell homeHref={tenantUrl({ locale, tenantSlug })} locale={locale} tenantSlug={tenantSlug}>
        <ManageBooking
          locale={locale}
          bookingToken={bookingToken}
          tenantSlugHint={tenantSlug}
          t={{
            loading: t("loading"),
            notFound: t("notFound"),
            title: t("title"),
            description: t("description"),
            policyBanner: t("policyBanner"),
            policyBlocked: t("policyBlocked"),
            service: t("service"),
            variant: t("variant"),
            durationUnit: t("durationUnit"),
            staff: t("staff"),
            date: t("date"),
            customer: t("customer"),
            status: t("status"),
            reschedule: t("reschedule"),
            cancel: t("cancel"),
            canceledState: t("canceledState"),
            noStaff: t("noStaff"),
            cancelDialogTitle: t("cancelDialogTitle"),
            cancelDialogDescription: t("cancelDialogDescription"),
            close: t("close"),
            confirmCancel: t("confirmCancel"),
            cancelSuccess: t("cancelSuccess"),
            cancelConflict: t("cancelConflict"),
            cancelForbidden: t("cancelForbidden"),
            cancelError: t("cancelError"),
          }}
        />
      </PublicShell>
    </TenantProvider>
  )
}
