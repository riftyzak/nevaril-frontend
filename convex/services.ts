import { mutationGeneric, queryGeneric } from "convex/server"
import { type GenericId, v } from "convex/values"

import type { ApiError, ApiResult, Service, UpdateServiceInput } from "../src/lib/api/types"
import { normalizeServicePatch } from "../src/lib/services/normalize"
import { getTenantBySlug, mapService } from "./_helpers"

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

const servicePatchValidator = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  priceCents: v.optional(v.number()),
  durationOptions: v.optional(
    v.array(v.union(v.literal(30), v.literal(60), v.literal(90)))
  ),
  active: v.optional(v.boolean()),
})

export const list = queryGeneric({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) return []

    const services = await ctx.db
      .query("services")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenant._id))
      .collect()

    return services
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((service) => mapService(args.tenantSlug, service))
  },
})

export const get = queryGeneric({
  args: {
    tenantSlug: v.string(),
    serviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) return null

    const services = await ctx.db
      .query("services")
      .withIndex("by_tenant_id_service_id", (query) => query.eq("tenantId", tenant._id))
      .collect()
    const service = services.find((item) => item.serviceId === args.serviceId) ?? null

    return service ? mapService(args.tenantSlug, service) : null
  },
})

export const update = mutationGeneric({
  args: {
    tenantSlug: v.string(),
    serviceId: v.string(),
    expectedUpdatedAt: v.string(),
    patch: servicePatchValidator,
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) {
      return fail(
        apiError("NOT_FOUND", `Tenant '${args.tenantSlug}' was not found in Convex`, 404)
      )
    }

    const services = await ctx.db
      .query("services")
      .withIndex("by_tenant_id_service_id", (query) => query.eq("tenantId", tenant._id))
      .collect()
    const service = services.find((item) => item.serviceId === args.serviceId) ?? null

    if (!service) {
      return fail(
        apiError("NOT_FOUND", `Service '${args.serviceId}' was not found in Convex`, 404)
      )
    }

    if (service.updatedAt !== args.expectedUpdatedAt) {
      return fail(
        apiError("CONFLICT", "Service was modified by another request", 409, {
          expectedUpdatedAt: args.expectedUpdatedAt,
          actualUpdatedAt: service.updatedAt,
        })
      )
    }

    const currentService = mapService(args.tenantSlug, {
      serviceId: service.serviceId as Service["id"],
      name: service.name as Service["name"],
      description: service.description as Service["description"],
      category: service.category as Service["category"],
      priceCents: service.priceCents as Service["priceCents"],
      durationOptions: service.durationOptions as Service["durationOptions"],
      active: service.active as Service["active"],
      updatedAt: service.updatedAt as Service["updatedAt"],
    })
    const normalized = normalizeServicePatch(
      currentService,
      args.patch as UpdateServiceInput["patch"]
    )
    const updatedAt = nowIso()

    await ctx.db.patch(service._id as GenericId<"services">, {
      ...normalized,
      updatedAt,
    })

    return ok({
      ...currentService,
      ...normalized,
      updatedAt,
    })
  },
})
