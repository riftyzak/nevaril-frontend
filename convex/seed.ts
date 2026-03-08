import { mutation } from "./_generated/server"

const BASE_TIMESTAMP = "2026-01-10T10:00:00.000Z"

export const seedBarberReadSlice = mutation({
  args: {},
  handler: async (ctx) => {
    const tenantPayload = {
      slug: "barber",
      name: "Brass Barber",
      timezone: "Europe/Prague",
      localeDefault: "cs" as const,
      currency: "CZK",
      plan: "business" as const,
      updatedAt: BASE_TIMESTAMP,
    }

    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (query) => query.eq("slug", tenantPayload.slug))
      .unique()

    const tenantId = existingTenant
      ? (await ctx.db.patch(existingTenant._id, tenantPayload), existingTenant._id)
      : await ctx.db.insert("tenants", tenantPayload)

    const settingsPayload = {
      tenantId,
      logoUrl:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=120&q=80",
      staffSelectionEnabled: true,
      cancellationPolicyText: "Změny a zrušení přijímáme nejpozději 24h před termínem.",
      cancellationPolicyHours: 24,
      customFields: [],
      customerReadMode: "served-only" as const,
      customersVisibility: "own" as const,
      embedDefaults: {
        widgetPrimary: "#b88a44",
        widgetRadius: "18",
        defaultServiceId: "svc-cut",
      },
      updatedAt: BASE_TIMESTAMP,
    }

    const existingSettings = await ctx.db
      .query("tenantSettings")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenantId))
      .unique()

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, settingsPayload)
    } else {
      await ctx.db.insert("tenantSettings", settingsPayload)
    }

    const desiredServices = [
      {
        serviceId: "svc-cut",
        name: "Haircut",
        description: "Classic haircut with consultation and finishing.",
        category: "Cut",
        priceCents: 4200,
        durationOptions: [30, 60, 90] as (30 | 60 | 90)[],
        active: true,
        displayOrder: 1,
        updatedAt: BASE_TIMESTAMP,
      },
      {
        serviceId: "svc-beard",
        name: "Beard Trim",
        description: "Shape, trim and finish for beard maintenance.",
        category: "Beard",
        priceCents: 2500,
        durationOptions: [30, 60, 90] as (30 | 60 | 90)[],
        active: true,
        displayOrder: 2,
        updatedAt: BASE_TIMESTAMP,
      },
    ]

    const existingServices = await ctx.db
      .query("services")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenantId))
      .collect()
    const desiredServiceIds = new Set(desiredServices.map((service) => service.serviceId))

    for (const service of existingServices) {
      if (!desiredServiceIds.has(service.serviceId)) {
        await ctx.db.delete(service._id)
      }
    }

    for (const service of desiredServices) {
      const existing = existingServices.find((item) => item.serviceId === service.serviceId)
      const payload = { tenantId, ...service }
      if (existing) {
        await ctx.db.patch(existing._id, payload)
      } else {
        await ctx.db.insert("services", payload)
      }
    }

    const desiredStaff = [
      {
        staffId: "st-owner",
        fullName: "Martin Novak",
        role: "owner" as const,
        active: true,
        availabilityNote: "",
        timeOffNote: "",
        displayOrder: 1,
        updatedAt: BASE_TIMESTAMP,
      },
      {
        staffId: "st-1",
        fullName: "Tomas Kral",
        role: "staff" as const,
        active: true,
        availabilityNote: "",
        timeOffNote: "",
        displayOrder: 2,
        updatedAt: BASE_TIMESTAMP,
      },
    ]

    const existingStaff = await ctx.db
      .query("staffProfiles")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenantId))
      .collect()
    const desiredStaffIds = new Set(desiredStaff.map((staff) => staff.staffId))

    for (const staff of existingStaff) {
      if (!desiredStaffIds.has(staff.staffId)) {
        await ctx.db.delete(staff._id)
      }
    }

    for (const staff of desiredStaff) {
      const existing = existingStaff.find((item) => item.staffId === staff.staffId)
      const payload = { tenantId, ...staff }
      if (existing) {
        await ctx.db.patch(existing._id, payload)
      } else {
        await ctx.db.insert("staffProfiles", payload)
      }
    }

    const desiredBookings = [
      {
        bookingId: "bk-1",
        serviceId: "svc-cut",
        serviceVariant: 60 as const,
        staffId: "st-1",
        customerId: "cus-1",
        customerName: "Anna Novakova",
        customerEmail: "anna@example.com",
        customerPhone: "+420777000111",
        customFieldValues: {},
        startAt: "2026-01-12T09:00:00.000Z",
        endAt: "2026-01-12T10:00:00.000Z",
        timezone: "Europe/Prague",
        status: "confirmed" as const,
        bookingToken: "barber-manage-1",
        manageToken: "barber-manage-1",
        createdAt: BASE_TIMESTAMP,
        updatedAt: BASE_TIMESTAMP,
      },
      {
        bookingId: "bk-2",
        serviceId: "svc-beard",
        serviceVariant: 30 as const,
        staffId: "st-owner",
        customerId: "cus-2",
        customerName: "Marek Sramek",
        customerEmail: "marek@example.com",
        customerPhone: "+420777000222",
        customFieldValues: {},
        startAt: "2026-01-12T10:30:00.000Z",
        endAt: "2026-01-12T11:00:00.000Z",
        timezone: "Europe/Prague",
        status: "rescheduled" as const,
        bookingToken: "barber-manage-2",
        manageToken: "barber-manage-2",
        createdAt: BASE_TIMESTAMP,
        updatedAt: BASE_TIMESTAMP,
      },
    ]

    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenantId))
      .collect()
    const desiredBookingIds = new Set(desiredBookings.map((booking) => booking.bookingId))

    for (const booking of existingBookings) {
      if (!desiredBookingIds.has(booking.bookingId)) {
        await ctx.db.delete(booking._id)
      }
    }

    for (const booking of desiredBookings) {
      const existing = existingBookings.find((item) => item.bookingId === booking.bookingId)
      const payload = { tenantId, ...booking }
      if (existing) {
        await ctx.db.patch(existing._id, payload)
      } else {
        await ctx.db.insert("bookings", payload)
      }
    }

    return { ok: true, tenantSlug: "barber" }
  },
})
