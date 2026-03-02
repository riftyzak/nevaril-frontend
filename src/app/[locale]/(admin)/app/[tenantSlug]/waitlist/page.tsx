import { getTranslations } from "next-intl/server"

import { AdminShell } from "@/components/layout/admin-shell"
import { type AppLocale } from "@/i18n/locales"
import { AdminWaitlistInbox } from "@/features/waitlist/admin-waitlist-inbox"
import { getAdminPageContext } from "@/lib/auth/admin-page"

export default async function AdminWaitlistPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  const t = await getTranslations({ locale, namespace: "waitlist.admin" })
  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "bookings",
    ability: "view",
  })

  return (
    <AdminShell
      locale={locale}
      navItems={navItems}
      session={session}
      tenantSettings={tenantSettings}
    >
      <AdminWaitlistInbox
        tenantSlug={tenantSlug}
        t={{
          title: t("title"),
          description: t("description"),
          filterService: t("filterService"),
          filterStatus: t("filterStatus"),
          allServices: t("allServices"),
          allStatuses: t("allStatuses"),
          statusNew: t("statusNew"),
          statusAssigned: t("statusAssigned"),
          statusCancelled: t("statusCancelled"),
          empty: t("empty"),
          colCustomer: t("colCustomer"),
          colService: t("colService"),
          colPreferred: t("colPreferred"),
          colCreated: t("colCreated"),
          colStatus: t("colStatus"),
          colAction: t("colAction"),
          assignAction: t("assignAction"),
          assignedLabel: t("assignedLabel"),
          openAssignTitle: t("openAssignTitle"),
          openAssignDescription: t("openAssignDescription"),
          staff: t("staff"),
          anyStaff: t("anyStaff"),
          date: t("date"),
          duration: t("duration"),
          minutesUnit: t("minutesUnit"),
          availableSlots: t("availableSlots"),
          noSlots: t("noSlots"),
          slotLoading: t("slotLoading"),
          selectSlot: t("selectSlot"),
          close: t("close"),
          confirm: t("confirm"),
          confirmLoading: t("confirmLoading"),
          successToast: t("successToast"),
          wouldSendTitle: t("wouldSendTitle"),
          wouldSendEmail: t("wouldSendEmail"),
          wouldSendSms: t("wouldSendSms"),
          assignError: t("assignError"),
        }}
      />
    </AdminShell>
  )
}
