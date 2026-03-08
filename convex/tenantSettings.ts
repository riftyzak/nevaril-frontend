import { queryGeneric } from "convex/server"
import { v } from "convex/values"

import type { TenantConfig } from "../src/lib/api/types"
import { getTenantBySlug, mapTenantConfig } from "./_helpers"

export const get = queryGeneric({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) return null

    const settings = await ctx.db
      .query("tenantSettings")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenant._id))
      .unique()

    if (!settings) return null

    return mapTenantConfig({
      tenant: {
        slug: tenant.slug as TenantConfig["tenantSlug"],
        name: tenant.name as TenantConfig["tenantName"],
        timezone: tenant.timezone as TenantConfig["timezone"],
        localeDefault: tenant.localeDefault as TenantConfig["localeDefault"],
        plan: tenant.plan as TenantConfig["plan"],
        currency: tenant.currency as TenantConfig["currency"],
      },
      settings: {
        logoUrl: settings.logoUrl as TenantConfig["logoUrl"],
        staffSelectionEnabled: settings.staffSelectionEnabled as TenantConfig["staffSelectionEnabled"],
        cancellationPolicyText: settings.cancellationPolicyText as TenantConfig["cancellationPolicyText"],
        cancellationPolicyHours:
          settings.cancellationPolicyHours as TenantConfig["cancellationPolicyHours"],
        customFields: settings.customFields as TenantConfig["customFields"],
        customerReadMode: settings.customerReadMode as TenantConfig["customerReadMode"],
        customersVisibility: settings.customersVisibility as TenantConfig["customersVisibility"],
        embedDefaults: settings.embedDefaults as TenantConfig["embedDefaults"],
        updatedAt: settings.updatedAt as TenantConfig["updatedAt"],
      },
    })
  },
})
