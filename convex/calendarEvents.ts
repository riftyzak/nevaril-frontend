import { mutationGeneric, queryGeneric } from "convex/server"
import { type GenericId, v } from "convex/values"

import type {
  ApiError,
  ApiResult,
  CalendarEvent,
  CalendarEventType,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "../src/lib/api/types"
import { getTenantBySlug, mapCalendarEvent } from "./_helpers"
import type { MutationCtx, QueryCtx } from "./_generated/server"

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

function isIsoDate(value: string) {
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

function overlapsRange(
  event: Pick<CalendarEvent, "startAt" | "endAt">,
  range: Pick<CreateCalendarEventInput, "startAt" | "endAt">
) {
  return event.startAt < range.endAt && range.startAt < event.endAt
}

function makeEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const calendarEventTypeValidator = v.union(v.literal("blocked"), v.literal("time_off"))

const calendarEventPatchValidator = v.object({
  staffId: v.optional(v.union(v.string(), v.null())),
  type: v.optional(calendarEventTypeValidator),
  title: v.optional(v.string()),
  startAt: v.optional(v.string()),
  endAt: v.optional(v.string()),
  note: v.optional(v.string()),
})

async function getTenantStaff(
  ctx: QueryCtx | MutationCtx,
  tenantId: GenericId<"tenants">,
  staffId: string
) {
  const staffProfiles = await ctx.db
    .query("staffProfiles")
    .withIndex("by_tenant_id_staff_id", (query) => query.eq("tenantId", tenantId))
    .collect()

  return staffProfiles.find((item) => item.staffId === staffId) ?? null
}

async function getTenantEventById(
  ctx: QueryCtx | MutationCtx,
  tenantId: GenericId<"tenants">,
  eventId: string
) {
  const calendarEvents = await ctx.db
    .query("calendarEvents")
    .withIndex("by_tenant_id_event_id", (query) => query.eq("tenantId", tenantId))
    .collect()

  return calendarEvents.find((item) => item.eventId === eventId) ?? null
}

function validateEventWindow(
  input: Pick<CalendarEvent, "startAt" | "endAt">
) {
  if (!isIsoDate(input.startAt)) {
    return apiError("VALIDATION", "Calendar event startAt must be a valid ISO date", 400, {
      startAt: input.startAt,
    })
  }

  if (!isIsoDate(input.endAt)) {
    return apiError("VALIDATION", "Calendar event endAt must be a valid ISO date", 400, {
      endAt: input.endAt,
    })
  }

  const startAt = new Date(input.startAt).toISOString()
  const endAt = new Date(input.endAt).toISOString()

  if (endAt <= startAt) {
    return apiError("VALIDATION", "Calendar event endAt must be after startAt", 400, {
      startAt,
      endAt,
    })
  }

  return { startAt, endAt }
}

export const list = queryGeneric({
  args: {
    tenantSlug: v.string(),
    startAt: v.string(),
    endAt: v.string(),
    staffId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) return []
    const tenantId = tenant._id as GenericId<"tenants">
    const staffId = args.staffId

    const indexedEvents = staffId
      ? await ctx.db
          .query("calendarEvents")
          .withIndex("by_tenant_id_staff_id_start_at", (query) => query.eq("tenantId", tenantId))
          .collect()
      : await ctx.db
          .query("calendarEvents")
          .withIndex("by_tenant_id_start_at", (query) => query.eq("tenantId", tenantId))
          .collect()

    return indexedEvents
      .filter((event) => (staffId ? event.staffId === staffId : true))
      .filter((event) => overlapsRange(event, args))
      .map((event) => mapCalendarEvent(args.tenantSlug, event))
  },
})

export const create = mutationGeneric({
  args: {
    tenantSlug: v.string(),
    staffId: v.optional(v.string()),
    type: calendarEventTypeValidator,
    title: v.string(),
    startAt: v.string(),
    endAt: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) {
      return fail(apiError("NOT_FOUND", `Tenant '${args.tenantSlug}' was not found in Convex`, 404))
    }
    const tenantId = tenant._id as GenericId<"tenants">

    if (args.staffId) {
      const staff = await getTenantStaff(ctx, tenantId, args.staffId)
      if (!staff) {
        return fail(apiError("NOT_FOUND", `Staff '${args.staffId}' was not found in Convex`, 404))
      }
    }

    const validatedWindow = validateEventWindow(args)
    if ("code" in validatedWindow) {
      return fail(validatedWindow)
    }

    const timestamp = nowIso()
    const eventId = makeEventId()

    await ctx.db.insert("calendarEvents", {
      tenantId,
      eventId,
      staffId: args.staffId ?? null,
      type: args.type,
      title: args.title,
      startAt: validatedWindow.startAt,
      endAt: validatedWindow.endAt,
      note: args.note,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    return ok({
      id: eventId,
      tenantSlug: args.tenantSlug,
      staffId: args.staffId ?? null,
      type: args.type,
      title: args.title,
      startAt: validatedWindow.startAt,
      endAt: validatedWindow.endAt,
      note: args.note,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  },
})

export const update = mutationGeneric({
  args: {
    tenantSlug: v.string(),
    eventId: v.string(),
    expectedUpdatedAt: v.string(),
    patch: calendarEventPatchValidator,
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) {
      return fail(apiError("NOT_FOUND", `Tenant '${args.tenantSlug}' was not found in Convex`, 404))
    }
    const tenantId = tenant._id as GenericId<"tenants">

    const event = await getTenantEventById(ctx, tenantId, args.eventId)
    if (!event) {
      return fail(apiError("NOT_FOUND", `Calendar event '${args.eventId}' was not found in Convex`, 404))
    }

    if (event.updatedAt !== args.expectedUpdatedAt) {
      return fail(
        apiError("CONFLICT", "Calendar event was modified by another request", 409, {
          expectedUpdatedAt: args.expectedUpdatedAt,
          actualUpdatedAt: event.updatedAt,
        })
      )
    }

    const nextStaffId = args.patch.staffId === undefined ? event.staffId : args.patch.staffId
    if (nextStaffId) {
      const staff = await getTenantStaff(ctx, tenantId, nextStaffId)
      if (!staff) {
        return fail(apiError("NOT_FOUND", `Staff '${nextStaffId}' was not found in Convex`, 404))
      }
    }

    const nextType = (args.patch.type ?? event.type) as CalendarEventType
    const nextTitle = args.patch.title ?? event.title
    const nextStartAt = args.patch.startAt ?? event.startAt
    const nextEndAt = args.patch.endAt ?? event.endAt
    const validatedWindow = validateEventWindow({
      startAt: nextStartAt,
      endAt: nextEndAt,
    } as Pick<CalendarEvent, "startAt" | "endAt">)
    if ("code" in validatedWindow) {
      return fail(validatedWindow)
    }

    const updatedAt = nowIso()
    const patch: UpdateCalendarEventInput["patch"] & { updatedAt: string } = {
      staffId: nextStaffId,
      type: nextType,
      title: nextTitle,
      startAt: validatedWindow.startAt,
      endAt: validatedWindow.endAt,
      updatedAt,
    }

    if (args.patch.note !== undefined) {
      patch.note = args.patch.note
    } else if (event.note !== undefined) {
      patch.note = event.note
    }

    await ctx.db.patch(event._id as GenericId<"calendarEvents">, patch)

    return ok({
      ...mapCalendarEvent(args.tenantSlug, event),
      ...patch,
    })
  },
})

export const deleteEvent = mutationGeneric({
  args: {
    tenantSlug: v.string(),
    eventId: v.string(),
    expectedUpdatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx.db, args.tenantSlug)
    if (!tenant) {
      return fail(apiError("NOT_FOUND", `Tenant '${args.tenantSlug}' was not found in Convex`, 404))
    }
    const tenantId = tenant._id as GenericId<"tenants">

    const event = await getTenantEventById(ctx, tenantId, args.eventId)
    if (!event) {
      return fail(apiError("NOT_FOUND", `Calendar event '${args.eventId}' was not found in Convex`, 404))
    }

    if (event.updatedAt !== args.expectedUpdatedAt) {
      return fail(
        apiError("CONFLICT", "Calendar event was modified by another request", 409, {
          expectedUpdatedAt: args.expectedUpdatedAt,
          actualUpdatedAt: event.updatedAt,
        })
      )
    }

    await ctx.db.delete(event._id)

    return ok({ id: args.eventId })
  },
})

export { deleteEvent as delete }
