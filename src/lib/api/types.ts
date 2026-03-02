export type TenantPlan = "starter" | "lite" | "business" | "ultimate"

export interface TenantCustomField {
  id: string
  label: string
  type: "text" | "textarea"
  required: boolean
  placeholder?: string
}

export interface TenantConfig {
  tenantSlug: string
  tenantName: string
  timezone: string
  localeDefault: "cs" | "sk" | "en"
  plan: TenantPlan
  currency: string
  staffSelectionEnabled: boolean
  customFields: TenantCustomField[]
  customerReadMode: "served-only" | "all-readonly"
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

export type WaitlistStatus = "waiting" | "assigned" | "cancelled"

export interface WaitlistEntry {
  id: string
  tenantSlug: string
  serviceId: string
  customerName: string
  email: string
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
  bookings: Booking[]
  customers: Customer[]
  waitlist: WaitlistEntry[]
  vouchers: Voucher[]
  analytics: AnalyticsPoint[]
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

export interface AssignWaitlistToSlotInput {
  tenantSlug: string
  waitlistId: string
  expectedUpdatedAt: string
  startAt: string
  serviceVariant: ServiceVariant
  staffId?: string
}

export interface CreateVoucherOrderInput {
  tenantSlug: string
  type: VoucherType
  amount: number
  currency: string
}
