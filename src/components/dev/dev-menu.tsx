"use client"

import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseSessionCookieValue, SESSION_COOKIE_NAME, serializeSessionCookieValue } from "@/lib/auth/session-cookie"
import { updateTenantPlan } from "@/lib/app/client"
import type { TenantPlan } from "@/lib/api/types"
import { readMockDevSettings, resetMockData, writeMockDevSettings } from "@/lib/dev/mock-controls"
import { useTenant } from "@/lib/tenant/tenant-provider"
import { useServices } from "@/lib/query/hooks/use-services"
import { useStaff } from "@/lib/query/hooks/use-staff"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"

export function DevMenu({
  e2eBootstrapEnabled = false,
}: Readonly<{
  e2eBootstrapEnabled?: boolean
}>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { tenantSlug, locale } = useTenant()
  const { data: tenantConfig } = useTenantConfig(tenantSlug)
  const { data: services } = useServices(tenantSlug)
  const { data: staff } = useStaff(tenantSlug)

  const [open, setOpen] = useState(false)
  const [latencyMs, setLatencyMs] = useState(() => readMockDevSettings().latencyMs)
  const [errorRatePct, setErrorRatePct] = useState(() => readMockDevSettings().errorRatePct)
  const [planOverride, setPlanOverride] = useState<TenantPlan | null>(null)
  const plan = planOverride ?? tenantConfig?.plan ?? "business"
  const initialSession =
    typeof document === "undefined"
      ? null
      : parseSessionCookieValue(
          document.cookie
            .split("; ")
            .find((item) => item.startsWith(`${SESSION_COOKIE_NAME}=`))
            ?.split("=")[1] ?? null
        )
  const [role, setRole] = useState<"owner" | "staff">(initialSession?.role ?? "owner")
  const [staffId, setStaffId] = useState(initialSession?.staffId ?? "st-1")
  const e2eAppliedRef = useRef(false)

  function applySettings() {
    const next = writeMockDevSettings({ latencyMs, errorRatePct })
    setLatencyMs(next.latencyMs)
    setErrorRatePct(next.errorRatePct)
    void queryClient.invalidateQueries()
  }

  function handleResetSeed() {
    resetMockData()
    void queryClient.invalidateQueries()
  }

  function applySession() {
    const payload = serializeSessionCookieValue({
      role,
      tenantSlug,
      staffId: role === "staff" ? staffId : null,
    })
    document.cookie = `${SESSION_COOKIE_NAME}=${payload}; path=/; max-age=2592000; samesite=lax`
    router.refresh()
  }

  useEffect(() => {
    if (!e2eBootstrapEnabled) return
    if (e2eAppliedRef.current) return
    if (searchParams.get("__e2e") !== "reset") return

    e2eAppliedRef.current = true
    resetMockData()
    writeMockDevSettings({ latencyMs: 0, errorRatePct: 0 })
    const nextRole = searchParams.get("__role") === "staff" ? "staff" : "owner"
    const nextStaffId = searchParams.get("__staff") ?? "st-1"

    const payload = serializeSessionCookieValue({
      role: nextRole,
      tenantSlug,
      staffId: nextRole === "staff" ? nextStaffId : null,
    })
    document.cookie = `${SESSION_COOKIE_NAME}=${payload}; path=/; max-age=2592000; samesite=lax`

    void queryClient.invalidateQueries().then(() => {
      const next = new URLSearchParams(searchParams.toString())
      next.delete("__e2e")
      next.delete("__role")
      next.delete("__staff")
      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
      router.refresh()
    })
  }, [e2eBootstrapEnabled, pathname, queryClient, router, searchParams, tenantSlug])

  async function applyPlan() {
    if (!tenantConfig) return
    const result = await updateTenantPlan({
      tenantSlug,
      expectedUpdatedAt: tenantConfig.updatedAt,
      plan,
    })
    if (result.ok) {
      await queryClient.invalidateQueries()
      router.refresh()
    }
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
          <label className="grid gap-1">
            <span>Plan</span>
            <select
              value={plan}
              onChange={(event) => setPlanOverride(event.target.value as TenantPlan)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="starter">starter</option>
              <option value="lite">lite</option>
              <option value="business">business</option>
              <option value="ultimate">ultimate</option>
            </select>
          </label>
          <p>
            Services: <span className="font-medium text-foreground">{services?.length ?? 0}</span>
          </p>
          <label className="grid gap-1">
            <span>Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as "owner" | "staff")}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="owner">owner</option>
              <option value="staff">staff</option>
            </select>
          </label>
          {role === "staff" ? (
            <label className="grid gap-1">
              <span>Staff</span>
              <select
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {(staff ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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
            <Button type="button" size="xs" className="flex-1" onClick={applySession}>
              Apply Role
            </Button>
            <Button type="button" size="xs" className="flex-1" onClick={() => void applyPlan()}>
              Apply Plan
            </Button>
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
