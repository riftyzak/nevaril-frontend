import { addMinutes } from "date-fns"
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"

import type {
  AnalyticsPoint,
  ApiError,
  ApiResult,
  AssignWaitlistToSlotInput,
  AvailabilitySlot,
  Booking,
  CancelBookingInput,
  CreateBookingInput,
  CreateWaitlistEntryInput,
  CreateVoucherOrderInput,
  Customer,
  GetAvailabilityInput,
  Service,
  ServiceVariant,
  Staff,
  TenantConfig,
  TenantData,
  UpdateBookingInput,
  UpdateServiceInput,
  UpdateStaffNotesInput,
  UpdateCustomerTagsInput,
  Voucher,
  WaitlistEntry,
} from "@/lib/api/types"
import { canModifyBooking } from "@/lib/booking/policy"
import { getDb, mutateDb } from "@/lib/mock/storage"

const TZ_DEFAULT = "Europe/Prague"

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

function fail<T>(error: ApiError): ApiResult<T> {
  return { ok: false, error }
}

function apiError(code: ApiError["code"], message: string, status: number, details?: Record<string, unknown>): ApiError {
  return { code, message, status, details }
}

async function sleep(ms: number) {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function simulateBehavior() {
  const { dev } = getDb()
  await sleep(dev.latencyMs)

  if (dev.errorRatePct > 0 && Math.random() * 100 < dev.errorRatePct) {
    return apiError("INTERNAL", "Mock random error", 500)
  }

  return null
}

function nowIso() {
  return new Date().toISOString()
}

function getTenantOrError(tenantSlug: string) {
  const tenant = getDb().tenants[tenantSlug]
  if (!tenant) {
    return fail<TenantData>(
      apiError("NOT_FOUND", `Tenant '${tenantSlug}' was not found`, 404)
    )
  }
  return ok<TenantData>(tenant)
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

function isBookingBusy(booking: Booking) {
  return booking.status === "confirmed" || booking.status === "rescheduled"
}

function hasBookingConflict(
  bookings: Booking[],
  candidate: { startAt: string; endAt: string; staffId: string | null; ignoreBookingId?: string }
) {
  return bookings.some((booking) => {
    if (!isBookingBusy(booking)) return false
    if (candidate.ignoreBookingId && booking.id === candidate.ignoreBookingId) return false
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
  bookings: Booking[]
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

export async function getTenantConfig(tenantSlug: string): Promise<ApiResult<TenantConfig>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(tenantSlug)
  if (!tenantResult.ok) return tenantResult

  return ok(tenantResult.data.config)
}

export async function listServices(tenantSlug: string): Promise<ApiResult<Service[]>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(tenantSlug)
  if (!tenantResult.ok) return tenantResult

  return ok(tenantResult.data.services)
}

export async function getService(tenantSlug: string, serviceId: string): Promise<ApiResult<Service>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const service = tenantResult.data.services.find((item) => item.id === serviceId)
  if (!service) {
    return fail(apiError("NOT_FOUND", `Service '${serviceId}' was not found`, 404))
  }

  return ok(service)
}

export async function updateService(input: UpdateServiceInput): Promise<ApiResult<Service>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(input.tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const service = tenantResult.data.services.find((item) => item.id === input.serviceId)
  if (!service) {
    return fail(apiError("NOT_FOUND", `Service '${input.serviceId}' was not found`, 404))
  }

  if (service.updatedAt !== input.expectedUpdatedAt) {
    return fail(
      apiError("CONFLICT", "Service was modified by another request", 409, {
        expectedUpdatedAt: input.expectedUpdatedAt,
        actualUpdatedAt: service.updatedAt,
      })
    )
  }

  const updated: Service = {
    ...service,
    ...input.patch,
    updatedAt: nowIso(),
  }

  mutateDb((current) => {
    const tenant = current.tenants[input.tenantSlug]
    return {
      ...current,
      tenants: {
        ...current.tenants,
        [input.tenantSlug]: {
          ...tenant,
          services: tenant.services.map((item) => (item.id === input.serviceId ? updated : item)),
        },
      },
    }
  })

  return ok(updated)
}

export async function listStaff(tenantSlug: string): Promise<ApiResult<Staff[]>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(tenantSlug)
  if (!tenantResult.ok) return tenantResult

  return ok(tenantResult.data.staff)
}

export async function updateStaffNotes(input: UpdateStaffNotesInput): Promise<ApiResult<Staff>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(input.tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const staff = tenantResult.data.staff.find((item) => item.id === input.staffId)
  if (!staff) {
    return fail(apiError("NOT_FOUND", `Staff '${input.staffId}' was not found`, 404))
  }

  if (staff.updatedAt !== input.expectedUpdatedAt) {
    return fail(
      apiError("CONFLICT", "Staff was modified by another request", 409, {
        expectedUpdatedAt: input.expectedUpdatedAt,
        actualUpdatedAt: staff.updatedAt,
      })
    )
  }

  const updated: Staff = {
    ...staff,
    ...input.patch,
    updatedAt: nowIso(),
  }

  mutateDb((current) => {
    const tenant = current.tenants[input.tenantSlug]
    return {
      ...current,
      tenants: {
        ...current.tenants,
        [input.tenantSlug]: {
          ...tenant,
          staff: tenant.staff.map((item) => (item.id === input.staffId ? updated : item)),
        },
      },
    }
  })

  return ok(updated)
}

export async function getAvailability(input: GetAvailabilityInput): Promise<ApiResult<AvailabilitySlot[]>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(input.tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const service = tenantResult.data.services.find((item) => item.id === input.serviceId)
  if (!service) {
    return fail(apiError("NOT_FOUND", `Service '${input.serviceId}' was not found`, 404))
  }

  const timezone = tenantResult.data.config.timezone || TZ_DEFAULT
  const staffId = input.staffId ?? null

  const slots = createAvailabilitySlots({
    tenantSlug: input.tenantSlug,
    serviceId: input.serviceId,
    serviceVariant: input.serviceVariant,
    date: input.date,
    staffId,
    timezone,
    bookings: tenantResult.data.bookings,
  })

  return ok(slots)
}

export async function createBooking(input: CreateBookingInput): Promise<ApiResult<Booking>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(input.tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const service = tenantResult.data.services.find((item) => item.id === input.serviceId)
  if (!service) {
    return fail(apiError("NOT_FOUND", `Service '${input.serviceId}' was not found`, 404))
  }

  const newEndAt = computeEndAt(input.startAt, input.serviceVariant)
  const conflicts = hasBookingConflict(tenantResult.data.bookings, {
    startAt: input.startAt,
    endAt: newEndAt,
    staffId: input.staffId ?? null,
  })

  if (conflicts) {
    return fail(
      apiError("CONFLICT", "Selected slot is no longer available", 409, {
        startAt: input.startAt,
        staffId: input.staffId ?? null,
      })
    )
  }

  const timestamp = nowIso()
  const bookingToken = `${input.tenantSlug}-manage-${Date.now()}`
  const booking: Booking = {
    id: `bk-${Date.now()}`,
    tenantSlug: input.tenantSlug,
    serviceId: input.serviceId,
    serviceVariant: input.serviceVariant,
    staffId: input.staffId ?? null,
    customerId: input.customerId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    customFieldValues: input.customFieldValues ?? {},
    startAt: input.startAt,
    endAt: newEndAt,
    timezone: tenantResult.data.config.timezone || TZ_DEFAULT,
    status: "confirmed",
    bookingToken,
    manageToken: bookingToken,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  mutateDb((current) => {
    const tenant = current.tenants[input.tenantSlug]
    return {
      ...current,
      tenants: {
        ...current.tenants,
        [input.tenantSlug]: {
          ...tenant,
          bookings: [...tenant.bookings, booking],
        },
      },
    }
  })

  return ok(booking)
}

export async function updateBooking(input: UpdateBookingInput): Promise<ApiResult<Booking>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(input.tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const existing = tenantResult.data.bookings.find((item) => item.id === input.bookingId)
  if (!existing) {
    return fail(apiError("NOT_FOUND", `Booking '${input.bookingId}' was not found`, 404))
  }

  if (existing.updatedAt !== input.expectedUpdatedAt) {
    return fail(
      apiError("CONFLICT", "Booking was modified by another request", 409, {
        expectedUpdatedAt: input.expectedUpdatedAt,
        actualUpdatedAt: existing.updatedAt,
      })
    )
  }

  const isReschedule = typeof input.patch.startAt === "string"
  const isCancel = input.patch.status === "cancelled"
  if ((isReschedule || isCancel) && !canModifyBooking(nowIso(), existing.startAt, existing.timezone, 24)) {
    return fail(
      apiError("FORBIDDEN", "Booking can no longer be modified by policy window", 403, {
        bookingId: existing.id,
        startAt: existing.startAt,
      })
    )
  }

  const updatedAt = nowIso()
  const nextStartAt = input.patch.startAt ?? existing.startAt
  const nextVariant = existing.serviceVariant
  const nextEndAt = input.patch.endAt ?? computeEndAt(nextStartAt, nextVariant)
  const nextStaffId = input.patch.staffId ?? existing.staffId

  if (isReschedule) {
    const hasConflict = hasBookingConflict(tenantResult.data.bookings, {
      startAt: nextStartAt,
      endAt: nextEndAt,
      staffId: nextStaffId,
      ignoreBookingId: existing.id,
    })
    if (hasConflict) {
      return fail(
        apiError("CONFLICT", "Selected slot is no longer available", 409, {
          bookingId: existing.id,
          startAt: nextStartAt,
        })
      )
    }
  }

  const updated: Booking = {
    ...existing,
    ...input.patch,
    startAt: nextStartAt,
    endAt: nextEndAt,
    updatedAt,
  }

  mutateDb((current) => {
    const tenant = current.tenants[input.tenantSlug]
    return {
      ...current,
      tenants: {
        ...current.tenants,
        [input.tenantSlug]: {
          ...tenant,
          bookings: tenant.bookings.map((booking) =>
            booking.id === input.bookingId ? updated : booking
          ),
        },
      },
    }
  })

  return ok(updated)
}

export async function cancelBooking(input: CancelBookingInput): Promise<ApiResult<Booking>> {
  return updateBooking({
    tenantSlug: input.tenantSlug,
    bookingId: input.bookingId,
    expectedUpdatedAt: input.expectedUpdatedAt,
    patch: { status: "cancelled" },
  })
}

export async function listBookings(tenantSlug: string): Promise<ApiResult<Booking[]>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(tenantSlug)
  if (!tenantResult.ok) return tenantResult

  return ok(tenantResult.data.bookings)
}

export async function getBookingByToken(token: string, tenantSlug?: string): Promise<ApiResult<Booking>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const db = getDb()
  const tenantSlugs = tenantSlug ? [tenantSlug] : Object.keys(db.tenants)
  let booking: Booking | null = null

  for (const slug of tenantSlugs) {
    const tenant = db.tenants[slug]
    if (!tenant) continue
    const found = tenant.bookings.find(
      (item) => item.bookingToken === token || item.manageToken === token
    )
    if (found) {
      booking = found
      break
    }
  }

  if (!booking) {
    return fail(apiError("NOT_FOUND", `Booking token '${token}' was not found`, 404))
  }

  return ok(booking)
}

export async function listCustomers(tenantSlug: string): Promise<ApiResult<Customer[]>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(tenantSlug)
  if (!tenantResult.ok) return tenantResult

  return ok(tenantResult.data.customers)
}

export async function updateCustomerTags(input: UpdateCustomerTagsInput): Promise<ApiResult<Customer>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(input.tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const customer = tenantResult.data.customers.find((item) => item.id === input.customerId)
  if (!customer) {
    return fail(apiError("NOT_FOUND", `Customer '${input.customerId}' was not found`, 404))
  }

  if (customer.updatedAt !== input.expectedUpdatedAt) {
    return fail(
      apiError("CONFLICT", "Customer was modified by another request", 409, {
        expectedUpdatedAt: input.expectedUpdatedAt,
        actualUpdatedAt: customer.updatedAt,
      })
    )
  }

  const updated: Customer = {
    ...customer,
    tags: [...input.tags],
    updatedAt: nowIso(),
  }

  mutateDb((current) => {
    const tenant = current.tenants[input.tenantSlug]
    return {
      ...current,
      tenants: {
        ...current.tenants,
        [input.tenantSlug]: {
          ...tenant,
          customers: tenant.customers.map((item) =>
            item.id === input.customerId ? updated : item
          ),
        },
      },
    }
  })

  return ok(updated)
}

export async function listWaitlist(tenantSlug: string): Promise<ApiResult<WaitlistEntry[]>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(tenantSlug)
  if (!tenantResult.ok) return tenantResult

  return ok(tenantResult.data.waitlist)
}

export async function createWaitlistEntry(input: CreateWaitlistEntryInput): Promise<ApiResult<WaitlistEntry>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(input.tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const service = tenantResult.data.services.find((item) => item.id === input.serviceId)
  if (!service) {
    return fail(apiError("NOT_FOUND", `Service '${input.serviceId}' was not found`, 404))
  }

  const timestamp = nowIso()
  const entry: WaitlistEntry = {
    id: `wl-${Date.now()}`,
    tenantSlug: input.tenantSlug,
    serviceId: input.serviceId,
    customerName: input.customerName,
    email: input.email,
    phone: input.phone,
    note: input.note ?? "",
    preferredDate: input.preferredDate,
    preferredTimeLabel: input.preferredTimeLabel,
    status: "new",
    assignedBookingId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  mutateDb((current) => {
    const tenant = current.tenants[input.tenantSlug]
    return {
      ...current,
      tenants: {
        ...current.tenants,
        [input.tenantSlug]: {
          ...tenant,
          waitlist: [entry, ...tenant.waitlist],
        },
      },
    }
  })

  return ok(entry)
}

export async function assignWaitlistToSlot(input: AssignWaitlistToSlotInput): Promise<ApiResult<WaitlistEntry>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(input.tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const waitlist = tenantResult.data.waitlist.find((item) => item.id === input.waitlistId)
  if (!waitlist) {
    return fail(apiError("NOT_FOUND", `Waitlist '${input.waitlistId}' was not found`, 404))
  }

  if (waitlist.updatedAt !== input.expectedUpdatedAt) {
    return fail(
      apiError("CONFLICT", "Waitlist entry was modified by another request", 409, {
        expectedUpdatedAt: input.expectedUpdatedAt,
        actualUpdatedAt: waitlist.updatedAt,
      })
    )
  }

  if (waitlist.serviceId !== input.serviceId) {
    return fail(
      apiError("VALIDATION", "Assigned service must match waitlist service", 400, {
        waitlistServiceId: waitlist.serviceId,
        requestedServiceId: input.serviceId,
      })
    )
  }

  const bookingResult = await createBooking({
    tenantSlug: input.tenantSlug,
    serviceId: input.serviceId,
    serviceVariant: input.duration,
    staffId: input.staffId,
    customerId: `wl-${waitlist.id}`,
    customerName: waitlist.customerName,
    customerEmail: waitlist.email,
    customerPhone: waitlist.phone,
    customFieldValues: waitlist.note ? { note: waitlist.note } : {},
    startAt: input.startAt,
  })

  if (!bookingResult.ok) {
    return bookingResult
  }

  const updated: WaitlistEntry = {
    ...waitlist,
    status: "assigned",
    assignedBookingId: bookingResult.data.id,
    updatedAt: nowIso(),
  }

  mutateDb((current) => {
    const tenant = current.tenants[input.tenantSlug]
    return {
      ...current,
      tenants: {
        ...current.tenants,
        [input.tenantSlug]: {
          ...tenant,
          waitlist: tenant.waitlist.map((entry) =>
            entry.id === input.waitlistId ? updated : entry
          ),
        },
      },
    }
  })

  return ok(updated)
}

export async function listAnalytics(tenantSlug: string): Promise<ApiResult<AnalyticsPoint[]>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const revenueNow = tenantResult.data.bookings
    .filter((item) => isBookingBusy(item))
    .length * 1500

  const month = formatInTimeZone(new Date(), tenantResult.data.config.timezone || TZ_DEFAULT, "yyyy-MM")

  const analytics = tenantResult.data.analytics.map((point) =>
    point.metric === "revenue"
      ? {
          ...point,
          label: month,
          value: revenueNow,
        }
      : point
  )

  return ok(analytics)
}

export async function listVouchers(tenantSlug: string): Promise<ApiResult<Voucher[]>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(tenantSlug)
  if (!tenantResult.ok) return tenantResult

  return ok(tenantResult.data.vouchers)
}

export async function createVoucherOrder(input: CreateVoucherOrderInput): Promise<ApiResult<Voucher>> {
  const simulatedError = await simulateBehavior()
  if (simulatedError) return fail(simulatedError)

  const tenantResult = getTenantOrError(input.tenantSlug)
  if (!tenantResult.ok) return tenantResult

  const voucher: Voucher = {
    id: `v-${Date.now()}`,
    tenantSlug: input.tenantSlug,
    code: `${input.tenantSlug.toUpperCase()}-${Date.now().toString().slice(-6)}`,
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  mutateDb((current) => {
    const tenant = current.tenants[input.tenantSlug]
    return {
      ...current,
      tenants: {
        ...current.tenants,
        [input.tenantSlug]: {
          ...tenant,
          vouchers: [...tenant.vouchers, voucher],
        },
      },
    }
  })

  return ok(voucher)
}
