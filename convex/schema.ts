import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  tenants: defineTable({
    slug: v.string(),
    name: v.string(),
    timezone: v.string(),
    localeDefault: v.union(v.literal("cs"), v.literal("sk"), v.literal("en")),
    currency: v.string(),
    plan: v.union(
      v.literal("starter"),
      v.literal("lite"),
      v.literal("business"),
      v.literal("ultimate")
    ),
    updatedAt: v.string(),
  }).index("by_slug", ["slug"]),

  tenantSettings: defineTable({
    tenantId: v.id("tenants"),
    logoUrl: v.optional(v.string()),
    staffSelectionEnabled: v.boolean(),
    cancellationPolicyText: v.string(),
    cancellationPolicyHours: v.number(),
    customFields: v.array(v.any()),
    customerReadMode: v.union(v.literal("served-only"), v.literal("all-readonly")),
    customersVisibility: v.union(v.literal("own"), v.literal("all_readonly")),
    embedDefaults: v.object({
      widgetPrimary: v.optional(v.string()),
      widgetRadius: v.optional(v.string()),
      defaultServiceId: v.optional(v.union(v.string(), v.null())),
    }),
    updatedAt: v.string(),
  }).index("by_tenant_id", ["tenantId"]),

  services: defineTable({
    tenantId: v.id("tenants"),
    serviceId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    priceCents: v.number(),
    durationOptions: v.array(v.union(v.literal(30), v.literal(60), v.literal(90))),
    active: v.boolean(),
    displayOrder: v.number(),
    updatedAt: v.string(),
  })
    .index("by_tenant_id", ["tenantId"])
    .index("by_tenant_id_service_id", ["tenantId", "serviceId"]),

  staffProfiles: defineTable({
    tenantId: v.id("tenants"),
    staffId: v.string(),
    fullName: v.string(),
    role: v.union(v.literal("owner"), v.literal("staff")),
    active: v.boolean(),
    availabilityNote: v.string(),
    timeOffNote: v.string(),
    displayOrder: v.number(),
    updatedAt: v.string(),
  })
    .index("by_tenant_id", ["tenantId"])
    .index("by_tenant_id_staff_id", ["tenantId", "staffId"]),

  bookings: defineTable({
    tenantId: v.id("tenants"),
    bookingId: v.string(),
    serviceId: v.string(),
    serviceVariant: v.union(v.literal(30), v.literal(60), v.literal(90)),
    staffId: v.union(v.string(), v.null()),
    customerId: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    customFieldValues: v.record(v.string(), v.string()),
    startAt: v.string(),
    endAt: v.string(),
    timezone: v.string(),
    status: v.union(
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("rescheduled"),
      v.literal("completed")
    ),
    bookingToken: v.string(),
    manageToken: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_tenant_id", ["tenantId"])
    .index("by_tenant_id_start_at", ["tenantId", "startAt"])
    .index("by_tenant_id_booking_id", ["tenantId", "bookingId"])
    .index("by_booking_token", ["bookingToken"])
    .index("by_manage_token", ["manageToken"]),
})
