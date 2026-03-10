import { queryGeneric } from "convex/server"
import { type GenericId, v } from "convex/values"

import { getTenantBySlug } from "./_helpers"

function mapMembership(membership: {
  _id: GenericId<"tenantMemberships">
  tenantId: GenericId<"tenants">
  userId: GenericId<"users">
  role: "owner" | "staff"
  staffId: string | null
  status: "active" | "invited" | "disabled"
  createdAt: string
  updatedAt: string
}) {
  return {
    id: membership._id,
    tenantId: membership.tenantId,
    userId: membership.userId,
    role: membership.role,
    staffId: membership.staffId,
    status: membership.status,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
  }
}

export const listForUser = queryGeneric({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_user_id", (query) => query.eq("userId", args.userId as GenericId<"users">))
      .collect()

    return memberships.map(mapMembership)
  },
})

export const getForTenant = queryGeneric({
  args: { userId: v.string(), tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) {
      return null
    }

    const memberships = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenant._id as GenericId<"tenants">))
      .collect()
    const membership =
      memberships.find((item) => item.userId === (args.userId as GenericId<"users">)) ?? null

    return membership ? mapMembership(membership) : null
  },
})
