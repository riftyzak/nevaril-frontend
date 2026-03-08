import { queryGeneric } from "convex/server"
import { v } from "convex/values"

import { getTenantById, getTenantBySlug, mapBooking } from "./_helpers"

export const list = queryGeneric({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) return []

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_tenant_id_start_at", (query) => query.eq("tenantId", tenant._id))
      .collect()

    return bookings.map((booking) => mapBooking(args.tenantSlug, booking))
  },
})

export const getById = queryGeneric({
  args: {
    tenantSlug: v.string(),
    bookingId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) return null

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_tenant_id_booking_id", (query) => query.eq("tenantId", tenant._id))
      .collect()
    const booking = bookings.find((item) => item.bookingId === args.bookingId) ?? null

    return booking ? mapBooking(args.tenantSlug, booking) : null
  },
})

export const getByToken = queryGeneric({
  args: {
    bookingToken: v.string(),
    tenantSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bookingByToken = await ctx.db
      .query("bookings")
      .withIndex("by_booking_token", (query) => query.eq("bookingToken", args.bookingToken))
      .unique()
    const booking =
      bookingByToken ??
      (await ctx.db
        .query("bookings")
        .withIndex("by_manage_token", (query) => query.eq("manageToken", args.bookingToken))
        .unique())
    if (!booking) return null

    if (args.tenantSlug) {
      const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
      if (!tenant || tenant._id !== booking.tenantId) {
        return null
      }
      return mapBooking(args.tenantSlug, booking)
    }

    const tenant = await getTenantById(ctx.db, String(booking.tenantId))
    if (!tenant) return null

    return mapBooking(String(tenant.slug), booking)
  },
})
