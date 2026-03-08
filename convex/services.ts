import { queryGeneric } from "convex/server"
import { v } from "convex/values"

import { getTenantBySlug, mapService } from "./_helpers"

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
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenant._id))
      .collect()

    const service = services.find((item) => item.serviceId === args.serviceId) ?? null

    return service ? mapService(args.tenantSlug, service) : null
  },
})
