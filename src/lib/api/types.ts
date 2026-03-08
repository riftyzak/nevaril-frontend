export type TenantPlan = "starter" | "lite" | "business" | "ultimate"

export interface TenantCustomField {
  id: string
  label: string
  type: "text" | "textarea"
  required: boolean
  placeholder?: string
}

export interface TenantEmbedDefaults {
  widgetPrimary?: string
  widgetRadius?: string
  defaultServiceId?: string | null
}

export interface TenantConfig {
  tenantSlug: string
  tenantName: string
  logoUrl?: string
  timezone: string
  localeDefault: "cs" | "sk" | "en"
  plan: TenantPlan
  currency: string
  staffSelectionEnabled: boolean
  cancellationPolicyText: string
  cancellationPolicyHours: number
  customFields: TenantCustomField[]
  customerReadMode: "served-only" | "all-readonly"
  customersVisibility: "own" | "all_readonly"
  embedDefaults: TenantEmbedDefaults
  updatedAt: string
}

export type ServiceVariant = 30 | 60 | 90

export interface Service {
  id: string
  tenantSlug: string
  name: string
  description: string
  category: string
  priceCents: number
  durationOptions: ServiceVariant[]
  active: boolean
  updatedAt: string
}

export interface Staff {
  id: string
  tenantSlug: string
  fullName: string
  role: "owner" | "staff"
  active: boolean
  availabilityNote: string
  timeOffNote: string
  updatedAt: string
}

export type AvailabilityStatus = "available" | "busy" | "blocked"

export interface AvailabilitySlot {
  id: string
  tenantSlug: string
  serviceId: string
  staffId: string | null
  startAt: string
  endAt: string
  timezone: string
  status: AvailabilityStatus
  updatedAt: string
}

export type CalendarEventType = "blocked" | "time_off"

export interface CalendarEvent {
  id: string
  tenantSlug: string
  staffId: string | null
  type: CalendarEventType
  title: string
  startAt: string
  endAt: string
  note?: string
  createdAt: string
  updatedAt: string
}

export type BookingStatus = "confirmed" | "cancelled" | "rescheduled" | "completed"

export interface Booking {
  id: string
  tenantSlug: string
  serviceId: string
  serviceVariant: ServiceVariant
  staffId: string | null
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customFieldValues: Record<string, string>
  startAt: string
  endAt: string
  timezone: string
  status: BookingStatus
  bookingToken: string
  manageToken: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  tenantSlug: string
  fullName: string
  email: string
  phone: string
  tags: string[]
  visits: number
  creditCents: number
  updatedAt: string
}

export type WaitlistStatus = "new" | "assigned" | "cancelled"

export interface WaitlistEntry {
  id: string
  tenantSlug: string
  serviceId: string
  customerName: string
  email: string
  phone: string
  note: string
  preferredDate: string
  preferredTimeLabel: string
  status: WaitlistStatus
  assignedBookingId: string | null
  createdAt: string
  updatedAt: string
}

export type VoucherType = "fixed" | "credit" | "percent" | "pack"

export interface Voucher {
  id: string
  tenantSlug: string
  code: string
  type: VoucherType
  amount: number
  currency: string
  status: "active" | "redeemed" | "expired"
  createdAt: string
  updatedAt: string
}

export interface NotificationTemplates {
  sms: string
  email: string
  updatedAt: string
}

export interface LoyaltyConfig {
  points: number
  nextBookingLabel: string
  updatedAt: string
}

export interface AnalyticsPoint {
  id: string
  tenantSlug: string
  metric: "revenue" | "bookings" | "rating" | "top-service"
  label: string
  value: number
}

export type ApiErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN"
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "INTERNAL"
  | "RATE_LIMITED"

export interface ApiError {
  code: ApiErrorCode
  message: string
  status: number
  details?: Record<string, unknown>
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export interface DevSettings {
  latencyMs: number
  errorRatePct: number
}

export interface TenantData {
  config: TenantConfig
  services: Service[]
  staff: Staff[]
  calendarEvents: CalendarEvent[]
  bookings: Booking[]
  customers: Customer[]
  waitlist: WaitlistEntry[]
  vouchers: Voucher[]
  analytics: AnalyticsPoint[]
  notificationTemplates: NotificationTemplates
  loyaltyConfig: LoyaltyConfig
}

export interface MockDatabase {
  tenants: Record<string, TenantData>
  dev: DevSettings
}

export interface GetAvailabilityInput {
  tenantSlug: string
  serviceId: string
  serviceVariant: ServiceVariant
  date: string
  staffId?: string
}

export interface CreateBookingInput {
  tenantSlug: string
  serviceId: string
  serviceVariant: ServiceVariant
  staffId?: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customFieldValues?: Record<string, string>
  startAt: string
}

export interface ListCalendarEventsInput {
  tenantSlug: string
  startAt: string
  endAt: string
  staffId?: string
}

export interface CreateCalendarEventInput {
  tenantSlug: string
  staffId?: string
  type: CalendarEventType
  title: string
  startAt: string
  endAt: string
  note?: string
}

export interface UpdateCalendarEventInput {
  tenantSlug: string
  eventId: string
  expectedUpdatedAt: string
  patch: Partial<Pick<CalendarEvent, "staffId" | "type" | "title" | "startAt" | "endAt" | "note">>
}

export interface DeleteCalendarEventInput {
  tenantSlug: string
  eventId: string
  expectedUpdatedAt: string
}

export interface UpdateBookingInput {
  tenantSlug: string
  bookingId: string
  expectedUpdatedAt: string
  patch: Partial<Pick<Booking, "startAt" | "endAt" | "staffId" | "status">>
}

export interface CancelBookingInput {
  tenantSlug: string
  bookingId: string
  expectedUpdatedAt: string
}

export interface UpdateCustomerTagsInput {
  tenantSlug: string
  customerId: string
  expectedUpdatedAt: string
  tags: string[]
}

export interface UpdateServiceInput {
  tenantSlug: string
  serviceId: string
  expectedUpdatedAt: string
  patch: Partial<Pick<Service, "name" | "description" | "category" | "priceCents" | "durationOptions" | "active">>
}

export interface UpdateStaffNotesInput {
  tenantSlug: string
  staffId: string
  expectedUpdatedAt: string
  patch: Partial<Pick<Staff, "availabilityNote" | "timeOffNote">>
}

export interface AssignWaitlistToSlotInput {
  tenantSlug: string
  waitlistId: string
  expectedUpdatedAt: string
  serviceId: string
  startAt: string
  duration: ServiceVariant
  staffId?: string
}

export interface CreateWaitlistEntryInput {
  tenantSlug: string
  serviceId: string
  customerName: string
  email: string
  phone: string
  note?: string
  preferredDate: string
  preferredTimeLabel: string
}

export interface CreateVoucherOrderInput {
  tenantSlug: string
  type: VoucherType
  amount: number
  currency: string
}

export interface UpdateNotificationTemplatesInput {
  tenantSlug: string
  expectedUpdatedAt: string
  sms: string
  email: string
}

export interface UpdateLoyaltyConfigInput {
  tenantSlug: string
  expectedUpdatedAt: string
  points: number
  nextBookingLabel: string
}

export interface UpdateTenantPlanInput {
  tenantSlug: string
  expectedUpdatedAt: string
  plan: TenantPlan
}

export interface UpdateTenantConfigInput {
  tenantSlug: string
  expectedUpdatedAt: string
  patch: Partial<
    Pick<
      TenantConfig,
      | "tenantName"
      | "logoUrl"
      | "staffSelectionEnabled"
      | "cancellationPolicyText"
      | "cancellationPolicyHours"
      | "customFields"
      | "customersVisibility"
      | "customerReadMode"
      | "embedDefaults"
    >
  >
}
