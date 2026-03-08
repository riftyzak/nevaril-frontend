import { mutationGeneric, queryGeneric } from "convex/server"
import { type GenericId, v } from "convex/values"

import type { ApiError, ApiResult, TenantConfig, UpdateTenantConfigInput } from "../src/lib/api/types"
import { normalizeTenantConfigPatch } from "../src/lib/tenant-settings/normalize"
import { getTenantBySlug, mapTenantConfig } from "./_helpers"

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

function fail<T>(error: ApiError): ApiResult<T> {
  return { ok: false, error }
}

function apiError(code: ApiError["code"], message: string, status: number, details?: Record<string, unknown>): ApiError {
  return { code, message, status, details }
}

function nowIso() {
  return new Date().toISOString()
}

const tenantConfigPatchValidator = v.object({
  tenantName: v.optional(v.string()),
  logoUrl: v.optional(v.string()),
  staffSelectionEnabled: v.optional(v.boolean()),
  cancellationPolicyText: v.optional(v.string()),
  cancellationPolicyHours: v.optional(v.number()),
  customFields: v.optional(
    v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        type: v.union(v.literal("text"), v.literal("textarea")),
        required: v.boolean(),
        placeholder: v.optional(v.string()),
      })
    )
  ),
  customersVisibility: v.optional(v.union(v.literal("own"), v.literal("all_readonly"))),
  customerReadMode: v.optional(v.union(v.literal("served-only"), v.literal("all-readonly"))),
  embedDefaults: v.optional(
    v.object({
      widgetPrimary: v.optional(v.string()),
      widgetRadius: v.optional(v.string()),
      defaultServiceId: v.optional(v.union(v.string(), v.null())),
    })
  ),
})

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

export const update = mutationGeneric({
  args: {
    tenantSlug: v.string(),
    expectedUpdatedAt: v.string(),
    patch: tenantConfigPatchValidator,
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) {
      return fail(
        apiError("NOT_FOUND", `Tenant '${args.tenantSlug}' was not found in Convex`, 404)
      )
    }

    const settings = await ctx.db
      .query("tenantSettings")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenant._id))
      .unique()

    if (!settings) {
      return fail(
        apiError("NOT_FOUND", `Tenant settings for '${args.tenantSlug}' were not found in Convex`, 404)
      )
    }

    if (settings.updatedAt !== args.expectedUpdatedAt) {
      return fail(
        apiError("CONFLICT", "Tenant config was modified by another request", 409, {
          expectedUpdatedAt: args.expectedUpdatedAt,
          actualUpdatedAt: settings.updatedAt,
        })
      )
    }

    const currentConfig = mapTenantConfig({
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

    const normalized = normalizeTenantConfigPatch(
      currentConfig,
      args.patch as UpdateTenantConfigInput["patch"]
    )
    const updatedAt = nowIso()

    await ctx.db.patch(settings._id as GenericId<"tenantSettings">, {
      logoUrl: normalized.logoUrl,
      staffSelectionEnabled: normalized.staffSelectionEnabled,
      cancellationPolicyText: normalized.cancellationPolicyText,
      cancellationPolicyHours: normalized.cancellationPolicyHours,
      customFields: normalized.customFields,
      customerReadMode: normalized.customerReadMode,
      customersVisibility: normalized.customersVisibility,
      embedDefaults: normalized.embedDefaults,
      updatedAt,
    })

    if (normalized.tenantName !== tenant.name) {
      await ctx.db.patch(tenant._id as GenericId<"tenants">, {
        name: normalized.tenantName,
        updatedAt,
      })
    }

    return ok({
      ...currentConfig,
      ...normalized,
      updatedAt,
    })
  },
})
