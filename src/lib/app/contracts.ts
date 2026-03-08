import type {
  AnalyticsPoint,
  ApiResult,
  AssignWaitlistToSlotInput,
  AvailabilitySlot,
  Booking,
  CalendarEvent,
  CancelBookingInput,
  CreateBookingInput,
  CreateCalendarEventInput,
  CreateVoucherOrderInput,
  CreateWaitlistEntryInput,
  Customer,
  DeleteCalendarEventInput,
  GetAvailabilityInput,
  ListCalendarEventsInput,
  LoyaltyConfig,
  NotificationTemplates,
  Service,
  Staff,
  TenantConfig,
  UpdateBookingInput,
  UpdateCalendarEventInput,
  UpdateCustomerTagsInput,
  UpdateLoyaltyConfigInput,
  UpdateNotificationTemplatesInput,
  UpdateServiceInput,
  UpdateStaffNotesInput,
  UpdateTenantConfigInput,
  UpdateTenantPlanInput,
  Voucher,
  WaitlistEntry,
} from "@/lib/api/types"

export interface AppDataAdapter {
  getTenantConfig(tenantSlug: string): Promise<ApiResult<TenantConfig>>
  updateTenantPlan(input: UpdateTenantPlanInput): Promise<ApiResult<TenantConfig>>
  updateTenantConfig(input: UpdateTenantConfigInput): Promise<ApiResult<TenantConfig>>
  getNotificationTemplates(tenantSlug: string): Promise<ApiResult<NotificationTemplates>>
  updateNotificationTemplates(
    input: UpdateNotificationTemplatesInput
  ): Promise<ApiResult<NotificationTemplates>>
  getLoyaltyConfig(tenantSlug: string): Promise<ApiResult<LoyaltyConfig>>
  updateLoyaltyConfig(input: UpdateLoyaltyConfigInput): Promise<ApiResult<LoyaltyConfig>>
  listServices(tenantSlug: string): Promise<ApiResult<Service[]>>
  getService(tenantSlug: string, serviceId: string): Promise<ApiResult<Service>>
  updateService(input: UpdateServiceInput): Promise<ApiResult<Service>>
  listStaff(tenantSlug: string): Promise<ApiResult<Staff[]>>
  updateStaffNotes(input: UpdateStaffNotesInput): Promise<ApiResult<Staff>>
  getAvailability(input: GetAvailabilityInput): Promise<ApiResult<AvailabilitySlot[]>>
  createBooking(input: CreateBookingInput): Promise<ApiResult<Booking>>
  listCalendarEvents(input: ListCalendarEventsInput): Promise<ApiResult<CalendarEvent[]>>
  createCalendarEvent(input: CreateCalendarEventInput): Promise<ApiResult<CalendarEvent>>
  updateCalendarEvent(input: UpdateCalendarEventInput): Promise<ApiResult<CalendarEvent>>
  deleteCalendarEvent(input: DeleteCalendarEventInput): Promise<ApiResult<{ id: string }>>
  updateBooking(input: UpdateBookingInput): Promise<ApiResult<Booking>>
  cancelBooking(input: CancelBookingInput): Promise<ApiResult<Booking>>
  listBookings(tenantSlug: string): Promise<ApiResult<Booking[]>>
  getBookingById(tenantSlug: string, bookingId: string): Promise<ApiResult<Booking>>
  getBookingByToken(token: string, tenantSlug?: string): Promise<ApiResult<Booking>>
  listCustomers(tenantSlug: string): Promise<ApiResult<Customer[]>>
  updateCustomerTags(input: UpdateCustomerTagsInput): Promise<ApiResult<Customer>>
  listWaitlist(tenantSlug: string): Promise<ApiResult<WaitlistEntry[]>>
  createWaitlistEntry(input: CreateWaitlistEntryInput): Promise<ApiResult<WaitlistEntry>>
  assignWaitlistToSlot(input: AssignWaitlistToSlotInput): Promise<ApiResult<WaitlistEntry>>
  listAnalytics(tenantSlug: string): Promise<ApiResult<AnalyticsPoint[]>>
  listVouchers(tenantSlug: string): Promise<ApiResult<Voucher[]>>
  createVoucherOrder(input: CreateVoucherOrderInput): Promise<ApiResult<Voucher>>
}
