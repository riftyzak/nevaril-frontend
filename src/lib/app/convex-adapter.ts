import type { AppDataAdapter } from "@/lib/app/contracts"
import {
  mutateConvexBooking,
  mutateConvexService,
  mutateConvexTenantConfig,
  queryConvexAvailability,
  queryConvexBookingById,
  queryConvexBookingByToken,
  queryConvexBookings,
  queryConvexService,
  queryConvexServices,
  queryConvexStaff,
  queryConvexTenantConfig,
} from "@/lib/app/convex-client"
import { convexContracts } from "@/lib/app/convex-contracts"
import type { ApiError, ApiResult } from "@/lib/api/types"

function notImplemented(contractName: string): never {
  throw new Error(
    `Convex app data adapter is not implemented for ${contractName}. Keep APP_DATA_SOURCE=mock until this contract is wired.`
  )
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

function toConvexFailure<T>(contractName: string, error: unknown): ApiResult<T> {
  const message = error instanceof Error ? error.message : "Unknown Convex error"
  return fail(
    apiError("INTERNAL", `Convex reader '${contractName}' failed: ${message}`, 500, {
      contractName,
    })
  )
}

function toConvexMutationFailure<T>(contractName: string, error: unknown): ApiResult<T> {
  const message = error instanceof Error ? error.message : "Unknown Convex error"
  return fail(
    apiError("INTERNAL", `Convex mutation '${contractName}' failed: ${message}`, 500, {
      contractName,
    })
  )
}

export const convexAppDataAdapter: AppDataAdapter = {
  getTenantConfig: async (tenantSlug) => {
    try {
      const config = await queryConvexTenantConfig(tenantSlug)
      if (!config) {
        return fail(
          apiError("NOT_FOUND", `Tenant '${tenantSlug}' was not found in Convex`, 404, {
            contractName: convexContracts.tenantSettings.get.name,
          })
        )
      }
      return ok(config)
    } catch (error) {
      return toConvexFailure(convexContracts.tenantSettings.get.name, error)
    }
  },
  updateTenantPlan: async () => notImplemented(convexContracts.tenantSettings.updatePlan.name),
  updateTenantConfig: async (input) => {
    try {
      return await mutateConvexTenantConfig(input)
    } catch (error) {
      return toConvexFailure(convexContracts.tenantSettings.update.name, error)
    }
  },
  getNotificationTemplates: async () =>
    notImplemented(convexContracts.notificationTemplates.get.name),
  updateNotificationTemplates: async () =>
    notImplemented(convexContracts.notificationTemplates.update.name),
  getLoyaltyConfig: async () => notImplemented(convexContracts.loyalty.get.name),
  updateLoyaltyConfig: async () => notImplemented(convexContracts.loyalty.update.name),
  listServices: async (tenantSlug) => {
    try {
      return ok(await queryConvexServices(tenantSlug))
    } catch (error) {
      return toConvexFailure(convexContracts.services.list.name, error)
    }
  },
  getService: async (tenantSlug, serviceId) => {
    try {
      const service = await queryConvexService(tenantSlug, serviceId)
      if (!service) {
        return fail(
          apiError("NOT_FOUND", `Service '${serviceId}' was not found in Convex`, 404, {
            contractName: convexContracts.services.get.name,
          })
        )
      }
      return ok(service)
    } catch (error) {
      return toConvexFailure(convexContracts.services.get.name, error)
    }
  },
  updateService: async (input) => {
    try {
      return await mutateConvexService(input)
    } catch (error) {
      return toConvexFailure(convexContracts.services.update.name, error)
    }
  },
  listStaff: async (tenantSlug) => {
    try {
      return ok(await queryConvexStaff(tenantSlug))
    } catch (error) {
      return toConvexFailure(convexContracts.staff.list.name, error)
    }
  },
  updateStaffNotes: async () => notImplemented(convexContracts.staff.updateNotes.name),
  getAvailability: async (input) => {
    try {
      return ok(await queryConvexAvailability(input))
    } catch (error) {
      return toConvexFailure(convexContracts.bookings.getAvailability.name, error)
    }
  },
  createBooking: async (input) => {
    try {
      return await mutateConvexBooking(input)
    } catch (error) {
      return toConvexMutationFailure(convexContracts.bookings.create.name, error)
    }
  },
  listCalendarEvents: async () => notImplemented(convexContracts.calendarEvents.list.name),
  createCalendarEvent: async () => notImplemented(convexContracts.calendarEvents.create.name),
  updateCalendarEvent: async () => notImplemented(convexContracts.calendarEvents.update.name),
  deleteCalendarEvent: async () => notImplemented(convexContracts.calendarEvents.delete.name),
  updateBooking: async () => notImplemented(convexContracts.bookings.update.name),
  cancelBooking: async () => notImplemented(convexContracts.bookings.cancel.name),
  listBookings: async (tenantSlug) => {
    try {
      return ok(await queryConvexBookings(tenantSlug))
    } catch (error) {
      return toConvexFailure(convexContracts.bookings.list.name, error)
    }
  },
  getBookingById: async (tenantSlug, bookingId) => {
    try {
      const booking = await queryConvexBookingById(tenantSlug, bookingId)
      if (!booking) {
        return fail(
          apiError("NOT_FOUND", `Booking '${bookingId}' was not found in Convex`, 404, {
            contractName: convexContracts.bookings.getById.name,
          })
        )
      }
      return ok(booking)
    } catch (error) {
      return toConvexFailure(convexContracts.bookings.getById.name, error)
    }
  },
  getBookingByToken: async (bookingToken, tenantSlug) => {
    try {
      const booking = await queryConvexBookingByToken(bookingToken, tenantSlug)
      if (!booking) {
        return fail(
          apiError("NOT_FOUND", `Booking token '${bookingToken}' was not found in Convex`, 404, {
            contractName: convexContracts.bookings.getByToken.name,
          })
        )
      }
      return ok(booking)
    } catch (error) {
      return toConvexFailure(convexContracts.bookings.getByToken.name, error)
    }
  },
  listCustomers: async () => notImplemented(convexContracts.customers.list.name),
  updateCustomerTags: async () => notImplemented(convexContracts.customers.updateTags.name),
  listWaitlist: async () => notImplemented(convexContracts.waitlist.list.name),
  createWaitlistEntry: async () => notImplemented(convexContracts.waitlist.create.name),
  assignWaitlistToSlot: async () => notImplemented(convexContracts.waitlist.assign.name),
  listAnalytics: async () => notImplemented(convexContracts.analytics.list.name),
  listVouchers: async () => notImplemented(convexContracts.vouchers.list.name),
  createVoucherOrder: async () => notImplemented(convexContracts.vouchers.createOrder.name),
}
