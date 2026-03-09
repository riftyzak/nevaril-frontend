import { addMinutes } from "date-fns"
import { fromZonedTime } from "date-fns-tz"
import { mutationGeneric, queryGeneric } from "convex/server"
import { type GenericId, v } from "convex/values"

import type {
  ApiError,
  ApiResult,
  AvailabilitySlot,
  Booking,
  CreateBookingInput,
  GetAvailabilityInput,
  ServiceVariant,
  UpdateBookingInput,
} from "../src/lib/api/types"
import { canModifyBooking } from "../src/lib/booking/policy"
import type { Doc, Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"
import { getTenantById, getTenantBySlug, mapBooking } from "./_helpers"

const TZ_DEFAULT = "Europe/Prague"

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

function computeEndAt(startAt: string, variant: ServiceVariant) {
  return addMinutes(new Date(startAt), variant).toISOString()
}

function dateTimeInTimezone(date: string, hhmm: string, timezone: string) {
  const [hour, minute] = hhmm.split(":").map(Number)
  const [year, month, day] = date.split("-").map(Number)
  const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  return fromZonedTime(localDate, timezone).toISOString()
}

function isIsoDate(value: string) {
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

function isBookingBusy(booking: {
  status: Booking["status"]
}) {
  return booking.status === "confirmed" || booking.status === "rescheduled"
}

function hasBookingConflict(
  bookings: Array<{
    bookingId: string
    startAt: string
    endAt: string
    staffId: string | null
    status: Booking["status"]
  }>,
  candidate: {
    startAt: string
    endAt: string
    staffId: string | null
    ignoreBookingId?: string
  }
) {
  return bookings.some((booking) => {
    if (!isBookingBusy(booking)) return false
    if (candidate.ignoreBookingId && booking.bookingId === candidate.ignoreBookingId) return false
    if (candidate.staffId && booking.staffId !== candidate.staffId) return false
    return booking.startAt < candidate.endAt && candidate.startAt < booking.endAt
  })
}

function createAvailabilitySlots(input: {
  tenantSlug: string
  serviceId: string
  serviceVariant: ServiceVariant
  date: string
  staffId: string | null
  timezone: string
  bookings: Array<{
    startAt: string
    endAt: string
    staffId: string | null
    status: Booking["status"]
  }>
}): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = []
  const workStart = 9 * 60
  const workEnd = 17 * 60

  for (let minutes = workStart; minutes + input.serviceVariant <= workEnd; minutes += input.serviceVariant) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0")
    const mm = String(minutes % 60).padStart(2, "0")
    const startAt = dateTimeInTimezone(input.date, `${hh}:${mm}`, input.timezone)
    const endAt = computeEndAt(startAt, input.serviceVariant)

    const overlaps = input.bookings.some((booking) => {
      if (!isBookingBusy(booking)) return false
      if (input.staffId && booking.staffId !== input.staffId) return false
      return booking.startAt < endAt && startAt < booking.endAt
    })

    slots.push({
      id: `${input.tenantSlug}-${input.date}-${hh}${mm}-${input.serviceVariant}`,
      tenantSlug: input.tenantSlug,
      serviceId: input.serviceId,
      staffId: input.staffId,
      startAt,
      endAt,
      timezone: input.timezone,
      status: overlaps ? "busy" : "available",
      updatedAt: nowIso(),
    })
  }

  return slots
}

function makeBookingId() {
  return `bk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function makeManageToken(tenantSlug: string) {
  return `${tenantSlug}-manage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const availabilityArgs = {
  tenantSlug: v.string(),
  serviceId: v.string(),
  serviceVariant: v.union(v.literal(30), v.literal(60), v.literal(90)),
  date: v.string(),
  staffId: v.optional(v.string()),
}

const createArgs = {
  tenantSlug: v.string(),
  serviceId: v.string(),
  serviceVariant: v.union(v.literal(30), v.literal(60), v.literal(90)),
  staffId: v.optional(v.string()),
  customerId: v.string(),
  customerName: v.string(),
  customerEmail: v.string(),
  customerPhone: v.string(),
  customFieldValues: v.optional(v.record(v.string(), v.string())),
  startAt: v.string(),
}

const bookingStatusValidator = v.union(
  v.literal("confirmed"),
  v.literal("cancelled"),
  v.literal("rescheduled"),
  v.literal("completed")
)

const updateArgs = {
  tenantSlug: v.string(),
  bookingId: v.string(),
  expectedUpdatedAt: v.string(),
  patch: v.object({
    startAt: v.optional(v.string()),
    endAt: v.optional(v.string()),
    staffId: v.optional(v.union(v.string(), v.null())),
    status: v.optional(bookingStatusValidator),
  }),
}

async function getTenantSettings(
  ctx: MutationCtx,
  tenantId: Id<"tenants">
) {
  return ctx.db
    .query("tenantSettings")
    .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenantId))
    .unique()
}

async function listTenantBookings(
  ctx: MutationCtx,
  tenantId: Id<"tenants">
) {
  return ctx.db
    .query("bookings")
    .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenantId))
    .collect()
}

function toApiBooking(tenantSlug: string, booking: Doc<"bookings">): Booking {
  return mapBooking(tenantSlug, booking)
}

export async function createBookingRecord(
  ctx: MutationCtx,
  args: CreateBookingInput
): Promise<ApiResult<Booking>> {
  const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
  if (!tenant) {
    return fail(apiError("NOT_FOUND", `Tenant '${args.tenantSlug}' was not found in Convex`, 404))
  }

  const tenantId = tenant._id as Id<"tenants">
  const services = await ctx.db
    .query("services")
    .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenantId))
    .collect()
  const service = services.find((item) => item.serviceId === args.serviceId) ?? null
  if (!service) {
    return fail(apiError("NOT_FOUND", `Service '${args.serviceId}' was not found in Convex`, 404))
  }

  if (!isIsoDate(args.startAt)) {
    return fail(
      apiError("VALIDATION", "Booking startAt must be a valid ISO date", 400, {
        startAt: args.startAt,
      })
    )
  }

  if (args.staffId) {
    const staffProfiles = await ctx.db
      .query("staffProfiles")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenantId))
      .collect()
    const staff = staffProfiles.find((item) => item.staffId === args.staffId) ?? null
    if (!staff) {
      return fail(apiError("NOT_FOUND", `Staff '${args.staffId}' was not found in Convex`, 404))
    }
  }

  const startAt = new Date(args.startAt).toISOString()
  const endAt = computeEndAt(startAt, args.serviceVariant)
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("by_tenant_id_start_at", (query) => query.eq("tenantId", tenantId))
    .collect()

  if (
    hasBookingConflict(bookings, {
      startAt,
      endAt,
      staffId: args.staffId ?? null,
    })
  ) {
    return fail(
      apiError("CONFLICT", "Selected slot is no longer available", 409, {
        startAt,
        staffId: args.staffId ?? null,
      })
    )
  }

  const timestamp = nowIso()
  const bookingToken = makeManageToken(args.tenantSlug)
  const bookingId = makeBookingId()

  await ctx.db.insert("bookings", {
    tenantId,
    bookingId,
    serviceId: args.serviceId,
    serviceVariant: args.serviceVariant,
    staffId: args.staffId ?? null,
    customerId: args.customerId,
    customerName: args.customerName,
    customerEmail: args.customerEmail,
    customerPhone: args.customerPhone,
    customFieldValues: args.customFieldValues ?? {},
    startAt,
    endAt,
    timezone: String(tenant.timezone ?? TZ_DEFAULT),
    status: "confirmed",
    bookingToken,
    manageToken: bookingToken,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  return ok({
    id: bookingId,
    tenantSlug: args.tenantSlug,
    serviceId: args.serviceId,
    serviceVariant: args.serviceVariant,
    staffId: args.staffId ?? null,
    customerId: args.customerId,
    customerName: args.customerName,
    customerEmail: args.customerEmail,
    customerPhone: args.customerPhone,
    customFieldValues: args.customFieldValues ?? {},
    startAt,
    endAt,
    timezone: String(tenant.timezone ?? TZ_DEFAULT),
    status: "confirmed",
    bookingToken,
    manageToken: bookingToken,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

async function updateBookingRecord(
  ctx: MutationCtx,
  args: UpdateBookingInput
): Promise<ApiResult<Booking>> {
  const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
  if (!tenant) {
    return fail(apiError("NOT_FOUND", `Tenant '${args.tenantSlug}' was not found in Convex`, 404))
  }

  const tenantId = tenant._id as Id<"tenants">
  const settings = await getTenantSettings(ctx, tenantId)
  if (!settings) {
    return fail(
      apiError("NOT_FOUND", `Tenant settings for '${args.tenantSlug}' were not found in Convex`, 404)
    )
  }

  const bookings = await listTenantBookings(ctx, tenantId)
  const booking = bookings.find((item) => item.bookingId === args.bookingId) ?? null
  if (!booking) {
    return fail(apiError("NOT_FOUND", `Booking '${args.bookingId}' was not found in Convex`, 404))
  }

  if (booking.updatedAt !== args.expectedUpdatedAt) {
    return fail(
      apiError("CONFLICT", "Booking was modified by another request", 409, {
        expectedUpdatedAt: args.expectedUpdatedAt,
        actualUpdatedAt: booking.updatedAt,
      })
    )
  }

  const isReschedule = typeof args.patch.startAt === "string"
  const isCancel = args.patch.status === "cancelled"
  const requestedStartAt = args.patch.startAt

  if (isReschedule && requestedStartAt && !isIsoDate(requestedStartAt)) {
    return fail(
      apiError("VALIDATION", "Booking startAt must be a valid ISO date", 400, {
        startAt: requestedStartAt,
      })
    )
  }

  if (
    (isReschedule || isCancel) &&
    !canModifyBooking(
      nowIso(),
      booking.startAt,
      booking.timezone,
      Number(settings.cancellationPolicyHours ?? 24)
    )
  ) {
    return fail(
      apiError("FORBIDDEN", "Booking can no longer be modified by policy window", 403, {
        bookingId: booking.bookingId,
        startAt: booking.startAt,
      })
    )
  }

  const nextStartAt =
    isReschedule && requestedStartAt ? new Date(requestedStartAt).toISOString() : booking.startAt
  const nextEndAt = isReschedule
    ? computeEndAt(nextStartAt, booking.serviceVariant)
    : booking.endAt
  const nextStaffId = args.patch.staffId === undefined ? booking.staffId : args.patch.staffId

  if (
    isReschedule &&
    hasBookingConflict(bookings, {
      startAt: nextStartAt,
      endAt: nextEndAt,
      staffId: nextStaffId,
      ignoreBookingId: booking.bookingId,
    })
  ) {
    return fail(
      apiError("CONFLICT", "Selected slot is no longer available", 409, {
        bookingId: booking.bookingId,
        startAt: nextStartAt,
      })
    )
  }

  const updatedAt = nowIso()
  const patch = {
    startAt: nextStartAt,
    endAt: nextEndAt,
    staffId: nextStaffId,
    status: args.patch.status ?? booking.status,
    updatedAt,
  }

  await ctx.db.patch(booking._id as GenericId<"bookings">, patch)

  return ok({
    ...toApiBooking(args.tenantSlug, booking),
    ...patch,
  })
}

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

export const getAvailability = queryGeneric({
  args: availabilityArgs,
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) return []

    const services = await ctx.db
      .query("services")
      .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenant._id))
      .collect()
    const service = services.find((item) => item.serviceId === args.serviceId) ?? null
    if (!service) return []

    if (args.staffId) {
      const staffProfiles = await ctx.db
        .query("staffProfiles")
        .withIndex("by_tenant_id", (query) => query.eq("tenantId", tenant._id))
        .collect()
      const staff = staffProfiles.find((item) => item.staffId === args.staffId) ?? null
      if (!staff) return []
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_tenant_id_start_at", (query) => query.eq("tenantId", tenant._id))
      .collect()

    return createAvailabilitySlots({
      tenantSlug: args.tenantSlug,
      serviceId: args.serviceId,
      serviceVariant: args.serviceVariant,
      date: args.date,
      staffId: args.staffId ?? null,
      timezone: String(tenant.timezone ?? TZ_DEFAULT),
      bookings,
    })
  },
})

export const create = mutationGeneric({
  args: createArgs,
  handler: (ctx, args) => createBookingRecord(ctx, args),
})

export const update = mutationGeneric({
  args: updateArgs,
  handler: async (ctx, args) => updateBookingRecord(ctx, args as UpdateBookingInput),
})

export const cancel = mutationGeneric({
  args: {
    tenantSlug: v.string(),
    bookingId: v.string(),
    expectedUpdatedAt: v.string(),
  },
  handler: async (ctx, args) =>
    updateBookingRecord(ctx, {
      tenantSlug: args.tenantSlug,
      bookingId: args.bookingId,
      expectedUpdatedAt: args.expectedUpdatedAt,
      patch: { status: "cancelled" },
    }),
})
