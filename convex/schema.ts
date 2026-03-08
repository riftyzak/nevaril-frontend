export type ConvexFieldType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "string[]"
  | "timestamp"
  | "nullable:string"
  | "nullable:id"

export interface ConvexIndexDefinition {
  name: string
  fields: string[]
}

export interface ConvexTableDefinition {
  table: string
  fields: Record<string, ConvexFieldType>
  indexes: ConvexIndexDefinition[]
  notes?: string[]
}

export const convexSchema = {
  tenants: {
    table: "tenants",
    fields: {
      slug: "string",
      name: "string",
      timezone: "string",
      localeDefault: "string",
      currency: "string",
      plan: "string",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [{ name: "by_slug", fields: ["slug"] }],
  },
  users: {
    table: "users",
    fields: {
      primaryEmail: "string",
      fullName: "string",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [{ name: "by_primary_email", fields: ["primaryEmail"] }],
  },
  tenantMemberships: {
    table: "tenantMemberships",
    fields: {
      tenantId: "string",
      userId: "string",
      role: "string",
      staffId: "nullable:id",
      status: "string",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [
      { name: "by_tenant_user", fields: ["tenantId", "userId"] },
      { name: "by_user", fields: ["userId"] },
    ],
  },
  staffProfiles: {
    table: "staffProfiles",
    fields: {
      tenantId: "string",
      userId: "nullable:id",
      fullName: "string",
      role: "string",
      active: "boolean",
      availabilityNote: "string",
      timeOffNote: "string",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [
      { name: "by_tenant", fields: ["tenantId"] },
      { name: "by_tenant_user", fields: ["tenantId", "userId"] },
    ],
  },
  customers: {
    table: "customers",
    fields: {
      tenantId: "string",
      fullName: "string",
      email: "string",
      phone: "string",
      tags: "string[]",
      visits: "number",
      creditCents: "number",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [
      { name: "by_tenant", fields: ["tenantId"] },
      { name: "by_tenant_email", fields: ["tenantId", "email"] },
    ],
  },
  services: {
    table: "services",
    fields: {
      tenantId: "string",
      name: "string",
      description: "string",
      category: "string",
      priceCents: "number",
      durationOptions: "json",
      active: "boolean",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [{ name: "by_tenant", fields: ["tenantId"] }],
  },
  bookings: {
    table: "bookings",
    fields: {
      tenantId: "string",
      serviceId: "string",
      staffId: "nullable:id",
      customerId: "string",
      status: "string",
      startAt: "timestamp",
      endAt: "timestamp",
      timezone: "string",
      bookingToken: "string",
      manageToken: "string",
      customFieldValues: "json",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [
      { name: "by_tenant_start", fields: ["tenantId", "startAt"] },
      { name: "by_booking_token", fields: ["bookingToken"] },
      { name: "by_manage_token", fields: ["manageToken"] },
      { name: "by_staff_start", fields: ["staffId", "startAt"] },
    ],
  },
  waitlistEntries: {
    table: "waitlistEntries",
    fields: {
      tenantId: "string",
      serviceId: "string",
      customerName: "string",
      email: "string",
      phone: "string",
      note: "string",
      preferredDate: "string",
      preferredTimeLabel: "string",
      status: "string",
      assignedBookingId: "nullable:id",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [
      { name: "by_tenant_status", fields: ["tenantId", "status"] },
      { name: "by_assigned_booking", fields: ["assignedBookingId"] },
    ],
  },
  calendarEvents: {
    table: "calendarEvents",
    fields: {
      tenantId: "string",
      staffId: "nullable:id",
      type: "string",
      title: "string",
      note: "string",
      startAt: "timestamp",
      endAt: "timestamp",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [
      { name: "by_tenant_start", fields: ["tenantId", "startAt"] },
      { name: "by_staff_start", fields: ["staffId", "startAt"] },
    ],
  },
  notificationTemplates: {
    table: "notificationTemplates",
    fields: {
      tenantId: "string",
      sms: "string",
      email: "string",
      updatedAt: "timestamp",
    },
    indexes: [{ name: "by_tenant", fields: ["tenantId"] }],
  },
  tenantSettings: {
    table: "tenantSettings",
    fields: {
      tenantId: "string",
      logoUrl: "string",
      staffSelectionEnabled: "boolean",
      cancellationPolicyText: "string",
      cancellationPolicyHours: "number",
      customFields: "json",
      customersVisibility: "string",
      customerReadMode: "string",
      embedDefaults: "json",
      updatedAt: "timestamp",
    },
    indexes: [{ name: "by_tenant", fields: ["tenantId"] }],
  },
  authIdentities: {
    table: "authIdentities",
    fields: {
      userId: "string",
      provider: "string",
      providerSubject: "string",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [{ name: "by_provider_subject", fields: ["provider", "providerSubject"] }],
    notes: ["Prepared for magic link first, Google OAuth second, password optional later."],
  },
  authSessions: {
    table: "authSessions",
    fields: {
      userId: "string",
      activeTenantSlug: "nullable:string",
      expiresAt: "timestamp",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
    indexes: [
      { name: "by_user", fields: ["userId"] },
      { name: "by_active_tenant_slug", fields: ["activeTenantSlug"] },
    ],
  },
} satisfies Record<string, ConvexTableDefinition>
