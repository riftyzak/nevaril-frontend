import { mutation } from "./_generated/server";

export const seedBarberReadSlice = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();

    const tenantPayload = {
      slug: "barber",
      name: "Brass Barber",
      timezone: "Europe/Prague",
      localeDefault: "cs" as const,
      currency: "CZK",
      plan: "business" as const,
      updatedAt: now,
    };

    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", tenantPayload.slug))
      .unique();

    const tenantId = existingTenant
      ? (await ctx.db.patch(existingTenant._id, tenantPayload), existingTenant._id)
      : await ctx.db.insert("tenants", tenantPayload);

    const existingSettings = await ctx.db
      .query("tenantSettings")
      .withIndex("by_tenant_id", (q) => q.eq("tenantId", tenantId))
      .unique();

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
      updatedAt: now,
    };

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, settingsPayload);
    } else {
      await ctx.db.insert("tenantSettings", settingsPayload);
    }

    const desiredServices = [
      {
        serviceId: "svc-cut",
        name: "Haircut",
        description: "Classic haircut with consultation and finishing.",
        category: "Cut",
        priceCents: 4200,
        durationOptions: [30, 60, 90] as const,
        active: true,
        displayOrder: 1,
        updatedAt: now,
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
        updatedAt: now,
      },
    ];

    const existingServices = await ctx.db
      .query("services")
      .withIndex("by_tenant_id", (q) => q.eq("tenantId", tenantId))
      .collect();

    const desiredServiceIds = new Set(desiredServices.map((s) => s.serviceId));

    for (const service of existingServices) {
      if (!desiredServiceIds.has(service.serviceId)) {
        await ctx.db.delete(service._id);
      }
    }

    for (const service of desiredServices) {
      const existing = existingServices.find((item) => item.serviceId === service.serviceId);
      const payload = {
        tenantId,
        serviceId: service.serviceId,
        name: service.name,
        description: service.description,
        category: service.category,
        priceCents: service.priceCents,
        durationOptions: [...service.durationOptions] as (30 | 60 | 90)[],
        active: service.active,
        displayOrder: service.displayOrder,
        updatedAt: service.updatedAt,
      };

      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("services", payload);
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
          updatedAt: now,
        },
        {
          staffId: "st-1",
          fullName: "Tomas Kral",
          role: "staff" as const,
          active: true,
          availabilityNote: "",
          timeOffNote: "",
          displayOrder: 2,
          updatedAt: now,
        },
      ];

      const existingStaff = await ctx.db
        .query("staffProfiles")
        .withIndex("by_tenant_id", (q) => q.eq("tenantId", tenantId))
        .collect();

      const desiredStaffIds = new Set(desiredStaff.map((s) => s.staffId));

      for (const staff of existingStaff) {
        if (!desiredStaffIds.has(staff.staffId)) {
          await ctx.db.delete(staff._id);
        }
      }

        for (const staff of desiredStaff) {
          const existing = existingStaff.find((item) => item.staffId === staff.staffId);
          const payload = { tenantId, ...staff };
          if (existing) {
            await ctx.db.patch(existing._id, payload);
          } else {
            await ctx.db.insert("staffProfiles", payload);
          }
        }
      }
  
      return { ok: true, tenantSlug: "barber" };
    },
  });
