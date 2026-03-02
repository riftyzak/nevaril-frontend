"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getDevSettings, resetSeed, setDevSettings } from "@/lib/mock/storage"
import { useTenant } from "@/lib/tenant/tenant-provider"
import { useServices } from "@/lib/query/hooks/use-services"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"

export function DevMenu() {
  const queryClient = useQueryClient()
  const { tenantSlug, locale } = useTenant()
  const { data: tenantConfig } = useTenantConfig(tenantSlug)
  const { data: services } = useServices(tenantSlug)

  const [open, setOpen] = useState(false)
  const [latencyMs, setLatencyMs] = useState(() => getDevSettings().latencyMs)
  const [errorRatePct, setErrorRatePct] = useState(() => getDevSettings().errorRatePct)

  function applySettings() {
    const next = setDevSettings({ latencyMs, errorRatePct })
    setLatencyMs(next.latencyMs)
    setErrorRatePct(next.errorRatePct)
    void queryClient.invalidateQueries()
  }

  function handleResetSeed() {
    resetSeed()
    void queryClient.invalidateQueries()
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 w-[300px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Dev Menu</p>
        <Button type="button" variant="outline" size="xs" onClick={() => setOpen((prev) => !prev)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>

      {open ? (
        <div className="grid gap-2 text-xs text-muted-foreground">
          <p>
            Tenant: <span className="font-medium text-foreground">{tenantSlug}</span>
          </p>
          <p>
            Locale: <span className="font-medium text-foreground">{locale}</span>
          </p>
          <p>
            Config: <span className="font-medium text-foreground">{tenantConfig?.tenantName ?? "loading..."}</span>
          </p>
          <p>
            Services: <span className="font-medium text-foreground">{services?.length ?? 0}</span>
          </p>
          <label className="grid gap-1">
            <span>Latency (ms)</span>
            <Input
              type="number"
              min={0}
              value={latencyMs}
              onChange={(event) => setLatencyMs(Number(event.target.value || 0))}
            />
          </label>
          <label className="grid gap-1">
            <span>Error rate (%)</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={errorRatePct}
              onChange={(event) => setErrorRatePct(Number(event.target.value || 0))}
            />
          </label>
          <div className="mt-1 flex gap-2">
            <Button type="button" size="xs" className="flex-1" onClick={applySettings}>
              Apply
            </Button>
            <Button type="button" size="xs" variant="outline" className="flex-1" onClick={handleResetSeed}>
              Reset seed
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
