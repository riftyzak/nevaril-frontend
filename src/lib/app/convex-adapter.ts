import type { AppDataAdapter } from "@/lib/app/contracts"
import { convexContracts } from "@/lib/app/convex-contracts"

function notImplemented(contractName: string): never {
  throw new Error(
    `Convex app data adapter is not implemented for ${contractName}. Keep APP_DATA_SOURCE=mock until this contract is wired.`
  )
}

export const convexAppDataAdapter: AppDataAdapter = {
  getTenantConfig: async () => notImplemented(convexContracts.tenantSettings.get.name),
  updateTenantPlan: async () => notImplemented(convexContracts.tenantSettings.updatePlan.name),
  updateTenantConfig: async () => notImplemented(convexContracts.tenantSettings.update.name),
  getNotificationTemplates: async () =>
    notImplemented(convexContracts.notificationTemplates.get.name),
  updateNotificationTemplates: async () =>
    notImplemented(convexContracts.notificationTemplates.update.name),
  getLoyaltyConfig: async () => notImplemented(convexContracts.loyalty.get.name),
  updateLoyaltyConfig: async () => notImplemented(convexContracts.loyalty.update.name),
  listServices: async () => notImplemented(convexContracts.services.list.name),
  getService: async () => notImplemented(convexContracts.services.get.name),
  updateService: async () => notImplemented(convexContracts.services.update.name),
  listStaff: async () => notImplemented(convexContracts.staff.list.name),
  updateStaffNotes: async () => notImplemented(convexContracts.staff.updateNotes.name),
  getAvailability: async () => notImplemented(convexContracts.bookings.getAvailability.name),
  createBooking: async () => notImplemented(convexContracts.bookings.create.name),
  listCalendarEvents: async () => notImplemented(convexContracts.calendarEvents.list.name),
  createCalendarEvent: async () => notImplemented(convexContracts.calendarEvents.create.name),
  updateCalendarEvent: async () => notImplemented(convexContracts.calendarEvents.update.name),
  deleteCalendarEvent: async () => notImplemented(convexContracts.calendarEvents.delete.name),
  updateBooking: async () => notImplemented(convexContracts.bookings.update.name),
  cancelBooking: async () => notImplemented(convexContracts.bookings.cancel.name),
  listBookings: async () => notImplemented(convexContracts.bookings.list.name),
  getBookingByToken: async () => notImplemented(convexContracts.bookings.getByToken.name),
  listCustomers: async () => notImplemented(convexContracts.customers.list.name),
  updateCustomerTags: async () => notImplemented(convexContracts.customers.updateTags.name),
  listWaitlist: async () => notImplemented(convexContracts.waitlist.list.name),
  createWaitlistEntry: async () => notImplemented(convexContracts.waitlist.create.name),
  assignWaitlistToSlot: async () => notImplemented(convexContracts.waitlist.assign.name),
  listAnalytics: async () => notImplemented(convexContracts.analytics.list.name),
  listVouchers: async () => notImplemented(convexContracts.vouchers.list.name),
  createVoucherOrder: async () => notImplemented(convexContracts.vouchers.createOrder.name),
}
