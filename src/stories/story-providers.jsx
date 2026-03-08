"use client"

import { useEffect } from "react"

import { QueryProvider } from "@/lib/query/query-provider"
import { resetMockData, writeMockDevSettings } from "@/lib/dev/mock-controls"
import { TenantProvider } from "@/lib/tenant/tenant-provider"

export function StoryProviders({ children, theme = "light", tenantSlug = "barber" }) {
  useEffect(() => {
    resetMockData()
    writeMockDevSettings({ latencyMs: 0, errorRatePct: 0 })
  }, [])

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <TenantProvider value={{ tenantSlug, locale: "cs", source: "path" }}>
        <QueryProvider>
          <div className="min-h-screen bg-background p-4 text-foreground">{children}</div>
        </QueryProvider>
      </TenantProvider>
    </div>
  )
}
