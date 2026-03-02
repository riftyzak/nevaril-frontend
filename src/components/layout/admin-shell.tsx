import Link from "next/link"
import type { ReactNode } from "react"
import {
  CalendarDays,
  ChartColumnBig,
  CircleUserRound,
  ListTodo,
  Settings,
  UserCog,
  Users,
  Wrench,
} from "lucide-react"
import { getTranslations } from "next-intl/server"

import { DevMenu } from "@/components/dev/dev-menu"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { getModuleAccess } from "@/lib/auth/permissions"
import type { MockSession, PermissionModule, TenantPermissionSettings } from "@/lib/auth/types"
import { type AppLocale } from "@/i18n/locales"

const navIcons = {
  dashboard: ChartColumnBig,
  calendar: CalendarDays,
  bookings: CircleUserRound,
  customers: Users,
  services: Wrench,
  staff: UserCog,
  waitlist: ListTodo,
  settings: Settings,
} as const

type AdminNavKey = keyof typeof navIcons

export async function AdminShell({
  children,
  navItems,
  locale,
  session,
  tenantSettings,
}: Readonly<{
  children: ReactNode
  navItems: Array<{ href: string; key: AdminNavKey; module: PermissionModule }>
  locale: AppLocale
  session: MockSession
  tenantSettings: TenantPermissionSettings
}>) {
  const t = await getTranslations({ locale, namespace: "shell.admin" })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-b border-border p-4 md:border-r md:border-b-0">
          <div className="mb-6 flex items-center justify-between gap-3 md:block">
            <div>
              <p className="text-base font-semibold">{t("brandName")}</p>
              <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
            <div className="flex items-center gap-2 md:mt-3">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>
          <nav aria-label={t("navAriaLabel")}>
            <ul className="grid grid-cols-2 gap-2 md:grid-cols-1">
              {navItems.map((item) => {
                const Icon = navIcons[item.key]
                const access = getModuleAccess(session, item.module, tenantSettings)
                if (!access.visible) return null
                return (
                  <li key={item.key}>
                    {access.enabled ? (
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <Icon className="size-4" />
                        {t(`nav.${item.key}`)}
                      </Link>
                    ) : (
                      <div
                        title={access.reason ? t(`lockedReason.${access.reason}`) : undefined}
                        className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground/70"
                      >
                        <Icon className="size-4" />
                        {t(`nav.${item.key}`)}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>
        <section className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
            <div>
              <h1 className="text-lg font-semibold">{t("workspaceTitle")}</h1>
              <p className="text-xs text-muted-foreground">
                {t("workspaceSubtitle")}
              </p>
            </div>
            <Badge>{session.role === "owner" ? t("ownerBadge") : t("staffBadge")}</Badge>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </section>
      </div>
      <DevMenu />
    </div>
  )
}
