import type { AppDataAdapter } from "@/lib/app/contracts"
import { mockAppDataAdapter } from "@/lib/app/mock-adapter"
import { getAppDataSource } from "@/lib/app/source"

function createConvexNotReadyAdapter(): AppDataAdapter {
  const notReady = async () => {
    throw new Error("Convex app data adapter is not implemented yet. Set APP_DATA_SOURCE=mock.")
  }

  return {
    getTenantConfig: notReady,
    updateTenantPlan: notReady,
    updateTenantConfig: notReady,
    getNotificationTemplates: notReady,
    updateNotificationTemplates: notReady,
    getLoyaltyConfig: notReady,
    updateLoyaltyConfig: notReady,
    listServices: notReady,
    getService: notReady,
    updateService: notReady,
    listStaff: notReady,
    updateStaffNotes: notReady,
    getAvailability: notReady,
    createBooking: notReady,
    listCalendarEvents: notReady,
    createCalendarEvent: notReady,
    updateCalendarEvent: notReady,
    deleteCalendarEvent: notReady,
    updateBooking: notReady,
    cancelBooking: notReady,
    listBookings: notReady,
    getBookingByToken: notReady,
    listCustomers: notReady,
    updateCustomerTags: notReady,
    listWaitlist: notReady,
    createWaitlistEntry: notReady,
    assignWaitlistToSlot: notReady,
    listAnalytics: notReady,
    listVouchers: notReady,
    createVoucherOrder: notReady,
  }
}

const convexNotReadyAdapter = createConvexNotReadyAdapter()

export function getAppDataAdapter(): AppDataAdapter {
  return getAppDataSource() === "convex" ? convexNotReadyAdapter : mockAppDataAdapter
}
