import type { GenericDataModel, GenericDatabaseReader } from "convex/server"
import type { GenericId } from "convex/values"

import type { Booking, Service, Staff, TenantConfig } from "../src/lib/api/types"

export async function getTenantBySlug(
  db: GenericDatabaseReader<GenericDataModel>,
  tenantSlug: string
) {
  return db
    .query("tenants")
    .withIndex("by_slug", (query) => query.eq("slug", tenantSlug))
    .unique()
}

export async function getTenantById(
  db: GenericDatabaseReader<GenericDataModel>,
  tenantId: string
) {
  return db.get(tenantId as GenericId<"tenants">)
}

export function mapTenantConfig(input: {
  tenant: {
    slug: string
    name: string
    timezone: string
    localeDefault: TenantConfig["localeDefault"]
    plan: TenantConfig["plan"]
    currency: string
  }
  settings: {
    logoUrl?: string
    staffSelectionEnabled: boolean
    cancellationPolicyText: string
    cancellationPolicyHours: number
    customFields: TenantConfig["customFields"]
    customerReadMode: TenantConfig["customerReadMode"]
    customersVisibility: TenantConfig["customersVisibility"]
    embedDefaults: TenantConfig["embedDefaults"]
    updatedAt: string
  }
}): TenantConfig {
  return {
    tenantSlug: input.tenant.slug,
    tenantName: input.tenant.name,
    logoUrl: input.settings.logoUrl,
    timezone: input.tenant.timezone,
    localeDefault: input.tenant.localeDefault,
    plan: input.tenant.plan,
    currency: input.tenant.currency,
    staffSelectionEnabled: input.settings.staffSelectionEnabled,
    cancellationPolicyText: input.settings.cancellationPolicyText,
    cancellationPolicyHours: input.settings.cancellationPolicyHours,
    customFields: input.settings.customFields,
    customerReadMode: input.settings.customerReadMode,
    customersVisibility: input.settings.customersVisibility,
    embedDefaults: input.settings.embedDefaults,
    updatedAt: input.settings.updatedAt,
  }
}

export function mapService(tenantSlug: string, service: {
  serviceId: string
  name: string
  description: string
  category: string
  priceCents: number
  durationOptions: Service["durationOptions"]
  active: boolean
  updatedAt: string
}): Service {
  return {
    id: service.serviceId,
    tenantSlug,
    name: service.name,
    description: service.description,
    category: service.category,
    priceCents: service.priceCents,
    durationOptions: service.durationOptions,
    active: service.active,
    updatedAt: service.updatedAt,
  }
}

export function mapStaff(tenantSlug: string, staff: {
  staffId: string
  fullName: string
  role: Staff["role"]
  active: boolean
  availabilityNote: string
  timeOffNote: string
  updatedAt: string
}): Staff {
  return {
    id: staff.staffId,
    tenantSlug,
    fullName: staff.fullName,
    role: staff.role,
    active: staff.active,
    availabilityNote: staff.availabilityNote,
    timeOffNote: staff.timeOffNote,
    updatedAt: staff.updatedAt,
  }
}

export function mapBooking(tenantSlug: string, booking: {
  bookingId: string
  serviceId: string
  serviceVariant: Booking["serviceVariant"]
  staffId: Booking["staffId"]
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customFieldValues: Booking["customFieldValues"]
  startAt: string
  endAt: string
  timezone: string
  status: Booking["status"]
  bookingToken: string
  manageToken: string
  createdAt: string
  updatedAt: string
}): Booking {
  return {
    id: booking.bookingId,
    tenantSlug,
    serviceId: booking.serviceId,
    serviceVariant: booking.serviceVariant,
    staffId: booking.staffId,
    customerId: booking.customerId,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    customFieldValues: booking.customFieldValues,
    startAt: booking.startAt,
    endAt: booking.endAt,
    timezone: booking.timezone,
    status: booking.status,
    bookingToken: booking.bookingToken,
    manageToken: booking.manageToken,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  }
}
