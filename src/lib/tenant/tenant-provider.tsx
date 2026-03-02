"use client"

import { createContext, useContext, type ReactNode } from "react"

import { type Locale, type TenantSource } from "@/lib/tenant/resolveTenant"

export interface TenantContextValue {
  tenantSlug: string
  locale: Locale
  source: TenantSource
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({
  value,
  children,
}: Readonly<{
  value: TenantContextValue
  children: ReactNode
}>) {
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider")
  }
  return context
}
