import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import { type AppLocale } from "@/i18n/locales"
import { DetailsForm } from "@/features/booking/details-form"
import { BookingProgress } from "@/features/booking/progress"
import { parseBookingState } from "@/features/booking/state"
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
  const t = await getTranslations({ locale, namespace: "booking" })

  return (
    <PublicShell homeHref={tenantUrl({ locale, tenantSlug })} locale={locale}>
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
            href={`${tenantUrl({ locale, tenantSlug, path: `/book/${serviceId}/slot` })}?variant=${state.variant}`}
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
            durationUnit: t("durationUnit"),
            summaryTitle: t("details.summaryTitle"),
            summaryService: t("details.summaryService"),
            summaryVariant: t("details.summaryVariant"),
            summaryStaff: t("details.summaryStaff"),
            summaryDate: t("details.summaryDate"),
            submitting: t("details.submitting"),
            noStaff: t("common.noStaff"),
          }}
        />
      )}
    </PublicShell>
  )
}
