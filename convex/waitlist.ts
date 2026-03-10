import type { GenericDataModel, GenericMutationCtx } from "convex/server"
import { mutationGeneric, queryGeneric } from "convex/server"
import { type GenericId, v } from "convex/values"

import type {
  ApiError,
  ApiResult,
  AssignWaitlistToSlotInput,
  CreateWaitlistEntryInput,
  WaitlistEntry,
} from "../src/lib/api/types"
import { createBookingRecord } from "./bookings"
import { getTenantBySlug, mapWaitlistEntry } from "./_helpers"

type MutationCtx = GenericMutationCtx<GenericDataModel>

interface WaitlistEntryRecord {
  _id: GenericId<"waitlistEntries">
  entryId: string
  serviceId: string
  customerName: string
  email: string
  phone: string
  note: string
  preferredDate: string
  preferredTimeLabel: string
  status: WaitlistEntry["status"]
  assignedBookingId: string | null
  createdAt: string
  updatedAt: string
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

function fail<T>(error: ApiError): ApiResult<T> {
  return { ok: false, error }
}

function apiError(
  code: ApiError["code"],
  message: string,
  status: number,
  details?: Record<string, unknown>
): ApiError {
  return { code, message, status, details }
}

function nowIso() {
  return new Date().toISOString()
}

function makeWaitlistId() {
  return `wl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function requireNonEmpty(field: string, value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return apiError("VALIDATION", `Waitlist ${field} is required`, 400, { field })
  }
  return normalized
}

const createArgs = {
  tenantSlug: v.string(),
  serviceId: v.string(),
  customerName: v.string(),
  email: v.string(),
  phone: v.string(),
  note: v.optional(v.string()),
  preferredDate: v.string(),
  preferredTimeLabel: v.string(),
}

const assignArgs = {
  tenantSlug: v.string(),
  waitlistId: v.string(),
  expectedUpdatedAt: v.string(),
  serviceId: v.string(),
  startAt: v.string(),
  duration: v.union(v.literal(30), v.literal(60), v.literal(90)),
  staffId: v.optional(v.string()),
}

async function getTenantWaitlistEntry(
  ctx: MutationCtx,
  tenantId: GenericId<"tenants">,
  waitlistId: string
) {
  const entries = (await ctx.db
    .query("waitlistEntries")
    .withIndex("by_tenant_id_entry_id", (query) => query.eq("tenantId", tenantId))
    .collect()) as unknown as WaitlistEntryRecord[]

  return entries.find((entry) => entry.entryId === waitlistId) ?? null
}

export const list = queryGeneric({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) return []

    const entries = (await ctx.db
      .query("waitlistEntries")
      .withIndex("by_tenant_id_created_at", (query) => query.eq("tenantId", tenant._id))
      .collect()) as unknown as WaitlistEntryRecord[]

    return entries
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((entry) => mapWaitlistEntry(args.tenantSlug, entry))
  },
})

export const create = mutationGeneric({
  args: createArgs,
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) {
      return fail(apiError("NOT_FOUND", `Tenant '${args.tenantSlug}' was not found in Convex`, 404))
    }

    const tenantId = tenant._id as GenericId<"tenants">
    const services = await ctx.db
      .query("services")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenantId))
      .collect()
    const service = services.find((item) => item.serviceId === args.serviceId) ?? null
    if (!service) {
      return fail(apiError("NOT_FOUND", `Service '${args.serviceId}' was not found in Convex`, 404))
    }

    const customerName = requireNonEmpty("customerName", args.customerName)
    if (typeof customerName !== "string") return fail(customerName)
    const email = requireNonEmpty("email", args.email)
    if (typeof email !== "string") return fail(email)
    const phone = requireNonEmpty("phone", args.phone)
    if (typeof phone !== "string") return fail(phone)
    const preferredDate = requireNonEmpty("preferredDate", args.preferredDate)
    if (typeof preferredDate !== "string") return fail(preferredDate)
    const preferredTimeLabel = requireNonEmpty("preferredTimeLabel", args.preferredTimeLabel)
    if (typeof preferredTimeLabel !== "string") return fail(preferredTimeLabel)

    const timestamp = nowIso()
    const entryId = makeWaitlistId()
    const note = args.note?.trim() ?? ""

    await ctx.db.insert("waitlistEntries", {
      tenantId,
      entryId,
      serviceId: args.serviceId,
      customerName,
      email,
      phone,
      note,
      preferredDate,
      preferredTimeLabel,
      status: "new",
      assignedBookingId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    return ok({
      id: entryId,
      tenantSlug: args.tenantSlug,
      serviceId: args.serviceId,
      customerName,
      email,
      phone,
      note,
      preferredDate,
      preferredTimeLabel,
      status: "new",
      assignedBookingId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  },
})

export const assign = mutationGeneric({
  args: assignArgs,
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) {
      return fail(apiError("NOT_FOUND", `Tenant '${args.tenantSlug}' was not found in Convex`, 404))
    }

    const tenantId = tenant._id as GenericId<"tenants">
    const entry = await getTenantWaitlistEntry(ctx, tenantId, args.waitlistId)
    if (!entry) {
      return fail(apiError("NOT_FOUND", `Waitlist '${args.waitlistId}' was not found in Convex`, 404))
    }

    if (entry.updatedAt !== args.expectedUpdatedAt) {
      return fail(
        apiError("CONFLICT", "Waitlist entry was modified by another request", 409, {
          expectedUpdatedAt: args.expectedUpdatedAt,
          actualUpdatedAt: entry.updatedAt,
        })
      )
    }

    if (entry.serviceId !== args.serviceId) {
      return fail(
        apiError("VALIDATION", "Assigned service must match waitlist service", 400, {
          waitlistServiceId: entry.serviceId,
          requestedServiceId: args.serviceId,
        })
      )
    }

    const bookingResult = await createBookingRecord(ctx, {
      tenantSlug: args.tenantSlug,
      serviceId: args.serviceId,
      serviceVariant: args.duration,
      staffId: args.staffId,
      customerId: `wl-${entry.entryId}`,
      customerName: entry.customerName,
      customerEmail: entry.email,
      customerPhone: entry.phone,
      customFieldValues: entry.note ? { note: entry.note } : {},
      startAt: args.startAt,
    })
    if (!bookingResult.ok) {
      return bookingResult
    }

    const updatedAt = nowIso()
    await ctx.db.patch(entry._id, {
      status: "assigned",
      assignedBookingId: bookingResult.data.id,
      updatedAt,
    })

    return ok({
      ...mapWaitlistEntry(args.tenantSlug, entry),
      status: "assigned",
      assignedBookingId: bookingResult.data.id,
      updatedAt,
    } satisfies WaitlistEntry)
  },
})
