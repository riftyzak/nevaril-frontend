import Link from "next/link"
import type { ReactNode } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"

function LogoPlaceholder() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-8 rounded-lg bg-primary/20 ring-1 ring-border" />
      <div>
        <p className="text-sm font-semibold">Nevaril</p>
        <p className="text-xs text-muted-foreground">Tenant logo placeholder</p>
      </div>
    </div>
  )
}

export function PublicShell({
  children,
  localeSlot,
}: Readonly<{
  children: ReactNode
  localeSlot?: ReactNode
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg">
            <LogoPlaceholder />
          </Link>
          <div className="flex items-center gap-2">
            {localeSlot ?? <Badge variant="outline">CZ</Badge>}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>Booking shell v1</span>
          <span>All features are mock in this stage</span>
        </div>
      </footer>
    </div>
  )
}
