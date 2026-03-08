import { getAppDataAdapter } from "@/lib/app/adapter"
import type {
  AssignWaitlistToSlotInput,
  CancelBookingInput,
  CreateBookingInput,
  CreateCalendarEventInput,
  CreateVoucherOrderInput,
  CreateWaitlistEntryInput,
  DeleteCalendarEventInput,
  GetAvailabilityInput,
  ListCalendarEventsInput,
  UpdateBookingInput,
  UpdateCalendarEventInput,
  UpdateCustomerTagsInput,
  UpdateLoyaltyConfigInput,
  UpdateNotificationTemplatesInput,
  UpdateServiceInput,
  UpdateStaffNotesInput,
  UpdateTenantConfigInput,
  UpdateTenantPlanInput,
} from "@/lib/api/types"

export function getTenantConfig(tenantSlug: string) {
  return getAppDataAdapter().getTenantConfig(tenantSlug)
}

export function updateTenantPlan(input: UpdateTenantPlanInput) {
  return getAppDataAdapter().updateTenantPlan(input)
}

export function updateTenantConfig(input: UpdateTenantConfigInput) {
  return getAppDataAdapter().updateTenantConfig(input)
}

export function getNotificationTemplates(tenantSlug: string) {
  return getAppDataAdapter().getNotificationTemplates(tenantSlug)
}

export function updateNotificationTemplates(input: UpdateNotificationTemplatesInput) {
  return getAppDataAdapter().updateNotificationTemplates(input)
}

export function getLoyaltyConfig(tenantSlug: string) {
  return getAppDataAdapter().getLoyaltyConfig(tenantSlug)
}

export function updateLoyaltyConfig(input: UpdateLoyaltyConfigInput) {
  return getAppDataAdapter().updateLoyaltyConfig(input)
}

export function listServices(tenantSlug: string) {
  return getAppDataAdapter().listServices(tenantSlug)
}

export function getService(tenantSlug: string, serviceId: string) {
  return getAppDataAdapter().getService(tenantSlug, serviceId)
}

export function updateService(input: UpdateServiceInput) {
  return getAppDataAdapter().updateService(input)
}

export function listStaff(tenantSlug: string) {
  return getAppDataAdapter().listStaff(tenantSlug)
}

export function updateStaffNotes(input: UpdateStaffNotesInput) {
  return getAppDataAdapter().updateStaffNotes(input)
}

export function getAvailability(input: GetAvailabilityInput) {
  return getAppDataAdapter().getAvailability(input)
}

export function createBooking(input: CreateBookingInput) {
  return getAppDataAdapter().createBooking(input)
}

export function listCalendarEvents(input: ListCalendarEventsInput) {
  return getAppDataAdapter().listCalendarEvents(input)
}

export function createCalendarEvent(input: CreateCalendarEventInput) {
  return getAppDataAdapter().createCalendarEvent(input)
}

export function updateCalendarEvent(input: UpdateCalendarEventInput) {
  return getAppDataAdapter().updateCalendarEvent(input)
}

export function deleteCalendarEvent(input: DeleteCalendarEventInput) {
  return getAppDataAdapter().deleteCalendarEvent(input)
}

export function updateBooking(input: UpdateBookingInput) {
  return getAppDataAdapter().updateBooking(input)
}

export function cancelBooking(input: CancelBookingInput) {
  return getAppDataAdapter().cancelBooking(input)
}

export function listBookings(tenantSlug: string) {
  return getAppDataAdapter().listBookings(tenantSlug)
}

export function getBookingById(tenantSlug: string, bookingId: string) {
  return getAppDataAdapter().getBookingById(tenantSlug, bookingId)
}

export function getBookingByToken(token: string, tenantSlug?: string) {
  return getAppDataAdapter().getBookingByToken(token, tenantSlug)
}

export function listCustomers(tenantSlug: string) {
  return getAppDataAdapter().listCustomers(tenantSlug)
}

export function updateCustomerTags(input: UpdateCustomerTagsInput) {
  return getAppDataAdapter().updateCustomerTags(input)
}

export function listWaitlist(tenantSlug: string) {
  return getAppDataAdapter().listWaitlist(tenantSlug)
}

export function createWaitlistEntry(input: CreateWaitlistEntryInput) {
  return getAppDataAdapter().createWaitlistEntry(input)
}

export function assignWaitlistToSlot(input: AssignWaitlistToSlotInput) {
  return getAppDataAdapter().assignWaitlistToSlot(input)
}

export function listAnalytics(tenantSlug: string) {
  return getAppDataAdapter().listAnalytics(tenantSlug)
}

export function listVouchers(tenantSlug: string) {
  return getAppDataAdapter().listVouchers(tenantSlug)
}

export function createVoucherOrder(input: CreateVoucherOrderInput) {
  return getAppDataAdapter().createVoucherOrder(input)
}
