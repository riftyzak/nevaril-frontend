import { queryGeneric } from "convex/server"
import { v } from "convex/values"

import { getTenantBySlug, mapStaff } from "./_helpers"

export const list = queryGeneric({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) return []

    const staff = await ctx.db
      .query("staffProfiles")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenant._id))
      .collect()

    return staff
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((member) => mapStaff(args.tenantSlug, member))
  },
})
