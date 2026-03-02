import Link from "next/link"
import type { ReactNode } from "react"
import { CalendarDays, ChartColumnBig, CircleUserRound, Settings, Users } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"

const navIcons = {
  Dashboard: ChartColumnBig,
  Calendar: CalendarDays,
  Bookings: CircleUserRound,
  Customers: Users,
  Settings: Settings,
} as const

export function AdminShell({
  children,
  navItems,
}: Readonly<{
  children: ReactNode
  navItems: Array<{ href: string; label: keyof typeof navIcons }>
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-b border-border p-4 md:border-r md:border-b-0">
          <div className="mb-6 flex items-center justify-between md:block">
            <div>
              <p className="text-base font-semibold">Nevaril Admin</p>
              <p className="text-xs text-muted-foreground">Layout shell v1</p>
            </div>
            <ThemeToggle />
          </div>
          <nav aria-label="Admin navigation">
            <ul className="grid grid-cols-2 gap-2 md:grid-cols-1">
              {navItems.map((item) => {
                const Icon = navIcons[item.label]
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>
        <section className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
            <div>
              <h1 className="text-lg font-semibold">Admin Workspace</h1>
              <p className="text-xs text-muted-foreground">
                Role and permissions wiring will come in a later milestone
              </p>
            </div>
            <Badge>Owner</Badge>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </section>
      </div>
    </div>
  )
}
