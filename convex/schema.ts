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

  users: defineTable({
    primaryEmail: v.string(),
    fullName: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_primary_email", ["primaryEmail"]),

  tenantMemberships: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("staff")),
    staffId: v.union(v.string(), v.null()),
    status: v.union(v.literal("active"), v.literal("invited"), v.literal("disabled")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user_id", ["userId"])
    .index("by_tenant_id", ["tenantId"])
    .index("by_tenant_id_user_id", ["tenantId", "userId"]),

  authSessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(),
    activeTenantSlug: v.union(v.string(), v.null()),
    authMethod: v.union(v.literal("magic_link"), v.literal("google_oauth"), v.literal("password")),
    expiresAt: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_session_token", ["sessionToken"])
    .index("by_user_id", ["userId"]),

  authMagicLinks: defineTable({
    userId: v.id("users"),
    email: v.string(),
    tenantSlug: v.union(v.string(), v.null()),
    verificationToken: v.string(),
    expiresAt: v.string(),
    consumedAt: v.union(v.string(), v.null()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_verification_token", ["verificationToken"])
    .index("by_user_id", ["userId"]),

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

  calendarEvents: defineTable({
    tenantId: v.id("tenants"),
    eventId: v.string(),
    staffId: v.union(v.string(), v.null()),
    type: v.union(v.literal("blocked"), v.literal("time_off")),
    title: v.string(),
    startAt: v.string(),
    endAt: v.string(),
    note: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_tenant_id_start_at", ["tenantId", "startAt"])
    .index("by_tenant_id_staff_id_start_at", ["tenantId", "staffId", "startAt"])
    .index("by_tenant_id_event_id", ["tenantId", "eventId"]),

  waitlistEntries: defineTable({
    tenantId: v.id("tenants"),
    entryId: v.string(),
    serviceId: v.string(),
    customerName: v.string(),
    email: v.string(),
    phone: v.string(),
    note: v.string(),
    preferredDate: v.string(),
    preferredTimeLabel: v.string(),
    status: v.union(v.literal("new"), v.literal("assigned"), v.literal("cancelled")),
    assignedBookingId: v.union(v.string(), v.null()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_tenant_id_created_at", ["tenantId", "createdAt"])
    .index("by_tenant_id_entry_id", ["tenantId", "entryId"]),
})
