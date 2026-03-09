import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference } from "convex/server"

import { convexContracts } from "@/lib/app/convex-contracts"
import type {
  ApiResult,
  AvailabilitySlot,
  Booking,
  CancelBookingInput,
  CalendarEvent,
  CreateBookingInput,
  CreateCalendarEventInput,
  DeleteCalendarEventInput,
  GetAvailabilityInput,
  Service,
  Staff,
  TenantConfig,
  UpdateBookingInput,
  UpdateCalendarEventInput,
  UpdateServiceInput,
  UpdateTenantConfigInput,
} from "@/lib/api/types"

type ConvexTenantSettingsUpdateArgs = {
  tenantSlug: string
  expectedUpdatedAt: string
  patch: UpdateTenantConfigInput["patch"]
  [key: string]: unknown
}

type ConvexServiceUpdateArgs = {
  tenantSlug: string
  serviceId: string
  expectedUpdatedAt: string
  patch: UpdateServiceInput["patch"]
  [key: string]: unknown
}

type ConvexBookingAvailabilityArgs = GetAvailabilityInput & {
  [key: string]: unknown
}

type ConvexBookingCreateArgs = CreateBookingInput & {
  [key: string]: unknown
}

type ConvexBookingUpdateArgs = UpdateBookingInput & {
  [key: string]: unknown
}

type ConvexBookingCancelArgs = CancelBookingInput & {
  [key: string]: unknown
}

type ConvexCalendarEventsListArgs = {
  tenantSlug: string
  startAt: string
  endAt: string
  staffId?: string
}

type ConvexCalendarEventCreateArgs = CreateCalendarEventInput & {
  [key: string]: unknown
}

type ConvexCalendarEventUpdateArgs = UpdateCalendarEventInput & {
  [key: string]: unknown
}

type ConvexCalendarEventDeleteArgs = DeleteCalendarEventInput & {
  [key: string]: unknown
}

const tenantSettingsGetRef = makeFunctionReference<
  "query",
  { tenantSlug: string },
  TenantConfig | null
>(convexContracts.tenantSettings.get.name)

const servicesListRef = makeFunctionReference<"query", { tenantSlug: string }, Service[]>(
  convexContracts.services.list.name
)

const servicesGetRef = makeFunctionReference<
  "query",
  { tenantSlug: string; serviceId: string },
  Service | null
>(convexContracts.services.get.name)

const staffListRef = makeFunctionReference<"query", { tenantSlug: string }, Staff[]>(
  convexContracts.staff.list.name
)

const bookingsListRef = makeFunctionReference<"query", { tenantSlug: string }, Booking[]>(
  convexContracts.bookings.list.name
)

const bookingsGetByIdRef = makeFunctionReference<
  "query",
  { tenantSlug: string; bookingId: string },
  Booking | null
>(convexContracts.bookings.getById.name)

const bookingsGetByTokenRef = makeFunctionReference<
  "query",
  { bookingToken: string; tenantSlug?: string },
  Booking | null
>(convexContracts.bookings.getByToken.name)

const bookingsAvailabilityRef = makeFunctionReference<
  "query",
  ConvexBookingAvailabilityArgs,
  AvailabilitySlot[]
>(convexContracts.bookings.getAvailability.name)

const calendarEventsListRef = makeFunctionReference<
  "query",
  ConvexCalendarEventsListArgs,
  CalendarEvent[]
>(convexContracts.calendarEvents.list.name)

const tenantSettingsUpdateRef = makeFunctionReference<
  "mutation",
  ConvexTenantSettingsUpdateArgs,
  ApiResult<TenantConfig>
>(convexContracts.tenantSettings.update.name)

const servicesUpdateRef = makeFunctionReference<
  "mutation",
  ConvexServiceUpdateArgs,
  ApiResult<Service>
>(convexContracts.services.update.name)

const bookingsCreateRef = makeFunctionReference<
  "mutation",
  ConvexBookingCreateArgs,
  ApiResult<Booking>
>(convexContracts.bookings.create.name)

const bookingsUpdateRef = makeFunctionReference<
  "mutation",
  ConvexBookingUpdateArgs,
  ApiResult<Booking>
>(convexContracts.bookings.update.name)

const bookingsCancelRef = makeFunctionReference<
  "mutation",
  ConvexBookingCancelArgs,
  ApiResult<Booking>
>(convexContracts.bookings.cancel.name)

const calendarEventsCreateRef = makeFunctionReference<
  "mutation",
  ConvexCalendarEventCreateArgs,
  ApiResult<CalendarEvent>
>(convexContracts.calendarEvents.create.name)

const calendarEventsUpdateRef = makeFunctionReference<
  "mutation",
  ConvexCalendarEventUpdateArgs,
  ApiResult<CalendarEvent>
>(convexContracts.calendarEvents.update.name)

const calendarEventsDeleteRef = makeFunctionReference<
  "mutation",
  ConvexCalendarEventDeleteArgs,
  ApiResult<{ id: string }>
>(convexContracts.calendarEvents.delete.name)

const clientCache = new Map<string, ConvexHttpClient>()

export function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL) for APP_DATA_SOURCE=convex."
    )
  }
  return url
}

function getConvexClient() {
  const url = getConvexUrl()
  const existing = clientCache.get(url)
  if (existing) return existing

  const client = new ConvexHttpClient(url)
  clientCache.set(url, client)
  return client
}

export async function queryConvexTenantConfig(tenantSlug: string) {
  return getConvexClient().query(tenantSettingsGetRef, { tenantSlug })
}

export async function queryConvexServices(tenantSlug: string) {
  return getConvexClient().query(servicesListRef, { tenantSlug })
}

export async function queryConvexService(tenantSlug: string, serviceId: string) {
  return getConvexClient().query(servicesGetRef, { tenantSlug, serviceId })
}

export async function queryConvexStaff(tenantSlug: string) {
  return getConvexClient().query(staffListRef, { tenantSlug })
}

export async function queryConvexBookings(tenantSlug: string) {
  return getConvexClient().query(bookingsListRef, { tenantSlug })
}

export async function queryConvexBookingById(tenantSlug: string, bookingId: string) {
  return getConvexClient().query(bookingsGetByIdRef, { tenantSlug, bookingId })
}

export async function queryConvexBookingByToken(bookingToken: string, tenantSlug?: string) {
  return getConvexClient().query(bookingsGetByTokenRef, { bookingToken, tenantSlug })
}

export async function queryConvexAvailability(input: GetAvailabilityInput) {
  return getConvexClient().query(
    bookingsAvailabilityRef,
    input as ConvexBookingAvailabilityArgs
  )
}

export async function queryConvexCalendarEvents(input: ConvexCalendarEventsListArgs) {
  return getConvexClient().query(calendarEventsListRef, input)
}

export async function mutateConvexTenantConfig(input: UpdateTenantConfigInput) {
  return getConvexClient().mutation(
    tenantSettingsUpdateRef,
    input as ConvexTenantSettingsUpdateArgs
  )
}

export async function mutateConvexService(input: UpdateServiceInput) {
  return getConvexClient().mutation(
    servicesUpdateRef,
    input as ConvexServiceUpdateArgs
  )
}

export async function mutateConvexBooking(input: CreateBookingInput) {
  return getConvexClient().mutation(
    bookingsCreateRef,
    input as ConvexBookingCreateArgs
  )
}

export async function mutateConvexBookingUpdate(input: UpdateBookingInput) {
  return getConvexClient().mutation(
    bookingsUpdateRef,
    input as ConvexBookingUpdateArgs
  )
}

export async function mutateConvexBookingCancel(input: CancelBookingInput) {
  return getConvexClient().mutation(
    bookingsCancelRef,
    input as ConvexBookingCancelArgs
  )
}

export async function mutateConvexCalendarEventCreate(input: CreateCalendarEventInput) {
  return getConvexClient().mutation(
    calendarEventsCreateRef,
    input as ConvexCalendarEventCreateArgs
  )
}

export async function mutateConvexCalendarEventUpdate(input: UpdateCalendarEventInput) {
  return getConvexClient().mutation(
    calendarEventsUpdateRef,
    input as ConvexCalendarEventUpdateArgs
  )
}

export async function mutateConvexCalendarEventDelete(input: DeleteCalendarEventInput) {
  return getConvexClient().mutation(
    calendarEventsDeleteRef,
    input as ConvexCalendarEventDeleteArgs
  )
}
