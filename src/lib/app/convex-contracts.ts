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
import type { AuthMethod } from "@/lib/auth/types"

type ConvexFunctionKind = "query" | "mutation"

export interface ConvexFunctionContract<
  Name extends string = string,
  Args = unknown,
  Result = unknown,
> {
  readonly kind: ConvexFunctionKind
  readonly name: Name
  readonly notes?: string
  readonly __args?: Args
  readonly __result?: Result
}

function defineConvexQuery<Name extends string, Args, Result>(
  name: Name,
  notes?: string
): ConvexFunctionContract<Name, Args, Result> {
  return { kind: "query", name, notes }
}

function defineConvexMutation<Name extends string, Args, Result>(
  name: Name,
  notes?: string
): ConvexFunctionContract<Name, Args, Result> {
  return { kind: "mutation", name, notes }
}

export interface ConvexTenantDoc {
  id: string
  slug: string
  name: string
  timezone: string
  localeDefault: TenantConfig["localeDefault"]
  currency: string
  plan: TenantConfig["plan"]
  createdAt: string
  updatedAt: string
}

export interface ConvexUserDoc {
  id: string
  primaryEmail: string
  fullName: string
  createdAt: string
  updatedAt: string
}

export interface ConvexTenantMembershipDoc {
  id: string
  tenantId: string
  userId: string
  role: "owner" | "staff"
  staffId: string | null
  status: "active" | "invited" | "disabled"
  createdAt: string
  updatedAt: string
}

export interface ConvexAuthIdentityDoc {
  id: string
  userId: string
  provider: "magic_link" | "google_oauth" | "password"
  providerSubject: string
  createdAt: string
  updatedAt: string
}

export interface ConvexAuthSessionDoc {
  id: string
  userId: string
  activeTenantSlug: string | null
  authMethod: Exclude<AuthMethod, "mock">
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface ConvexResolvedTenantMembership {
  id: string
  tenantId: string
  tenantSlug: string
  role: "owner" | "staff"
  staffId: string | null
  status: "active" | "invited" | "disabled"
  plan: TenantConfig["plan"]
  createdAt: string
  updatedAt: string
}

export interface ConvexResolvedAuthSession {
  sessionId: string
  sessionToken: string
  user: ConvexUserDoc
  activeTenantSlug: string | null
  authMethod: Exclude<AuthMethod, "mock">
  memberships: ConvexResolvedTenantMembership[]
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface ConvexMagicLinkStartResult {
  requestedAt: string
  expiresAt: string
  verificationToken: string
  deliveryMode: "dev_preview"
}

export const convexContracts = {
  tenants: {
    getBySlug: defineConvexQuery<"tenants:getBySlug", { tenantSlug: string }, ConvexTenantDoc>(
      "tenants:getBySlug"
    ),
    listForUser: defineConvexQuery<
      "tenants:listForUser",
      { userId: string },
      ConvexTenantDoc[]
    >("tenants:listForUser"),
  },
  tenantSettings: {
    get: defineConvexQuery<"tenantSettings:get", { tenantSlug: string }, TenantConfig | null>(
      "tenantSettings:get"
    ),
    update: defineConvexMutation<
      "tenantSettings:update",
      UpdateTenantConfigInput,
      ApiResult<TenantConfig>
    >("tenantSettings:update"),
    updatePlan: defineConvexMutation<
      "tenantSettings:updatePlan",
      UpdateTenantPlanInput,
      ApiResult<TenantConfig>
    >("tenantSettings:updatePlan"),
  },
  users: {
    getById: defineConvexQuery<"users:getById", { userId: string }, ConvexUserDoc>("users:getById"),
    getByEmail: defineConvexQuery<"users:getByEmail", { email: string }, ConvexUserDoc | null>(
      "users:getByEmail"
    ),
  },
  memberships: {
    listForUser: defineConvexQuery<
      "memberships:listForUser",
      { userId: string },
      ConvexTenantMembershipDoc[]
    >("memberships:listForUser"),
    getForTenant: defineConvexQuery<
      "memberships:getForTenant",
      { userId: string; tenantSlug: string },
      ConvexTenantMembershipDoc | null
    >("memberships:getForTenant"),
  },
  staff: {
    list: defineConvexQuery<"staff:list", { tenantSlug: string }, Staff[]>("staff:list"),
    getByUser: defineConvexQuery<
      "staff:getByUser",
      { tenantSlug: string; userId: string },
      Staff | null
    >("staff:getByUser"),
    updateNotes: defineConvexMutation<
      "staff:updateNotes",
      UpdateStaffNotesInput,
      ApiResult<Staff>
    >("staff:updateNotes"),
  },
  customers: {
    list: defineConvexQuery<"customers:list", { tenantSlug: string }, Customer[]>("customers:list"),
    getById: defineConvexQuery<
      "customers:getById",
      { tenantSlug: string; customerId: string },
      Customer | null
    >("customers:getById"),
    updateTags: defineConvexMutation<
      "customers:updateTags",
      UpdateCustomerTagsInput,
      ApiResult<Customer>
    >("customers:updateTags"),
  },
  services: {
    list: defineConvexQuery<"services:list", { tenantSlug: string }, Service[]>("services:list"),
    get: defineConvexQuery<
      "services:get",
      { tenantSlug: string; serviceId: string },
      Service | null
    >("services:get"),
    update: defineConvexMutation<
      "services:update",
      UpdateServiceInput,
      ApiResult<Service>
    >("services:update"),
  },
  bookings: {
    list: defineConvexQuery<"bookings:list", { tenantSlug: string }, Booking[]>("bookings:list"),
    getById: defineConvexQuery<
      "bookings:getById",
      { tenantSlug: string; bookingId: string },
      Booking | null
    >("bookings:getById"),
    getByToken: defineConvexQuery<
      "bookings:getByToken",
      { bookingToken: string; tenantSlug?: string },
      Booking | null
    >("bookings:getByToken"),
    getAvailability: defineConvexQuery<
      "bookings:getAvailability",
      GetAvailabilityInput,
      AvailabilitySlot[]
    >("bookings:getAvailability"),
    create: defineConvexMutation<
      "bookings:create",
      CreateBookingInput,
      ApiResult<Booking>
    >("bookings:create"),
    update: defineConvexMutation<
      "bookings:update",
      UpdateBookingInput,
      ApiResult<Booking>
    >("bookings:update"),
    cancel: defineConvexMutation<
      "bookings:cancel",
      CancelBookingInput,
      ApiResult<Booking>
    >("bookings:cancel"),
  },
  waitlist: {
    list: defineConvexQuery<"waitlist:list", { tenantSlug: string }, WaitlistEntry[]>("waitlist:list"),
    create: defineConvexMutation<
      "waitlist:create",
      CreateWaitlistEntryInput,
      ApiResult<WaitlistEntry>
    >("waitlist:create"),
    assign: defineConvexMutation<
      "waitlist:assign",
      AssignWaitlistToSlotInput,
      ApiResult<WaitlistEntry>
    >("waitlist:assign"),
  },
  calendarEvents: {
    list: defineConvexQuery<
      "calendarEvents:list",
      ListCalendarEventsInput,
      CalendarEvent[]
    >("calendarEvents:list"),
    create: defineConvexMutation<
      "calendarEvents:create",
      CreateCalendarEventInput,
      ApiResult<CalendarEvent>
    >("calendarEvents:create"),
    update: defineConvexMutation<
      "calendarEvents:update",
      UpdateCalendarEventInput,
      ApiResult<CalendarEvent>
    >("calendarEvents:update"),
    delete: defineConvexMutation<
      "calendarEvents:delete",
      DeleteCalendarEventInput,
      ApiResult<{ id: string }>
    >("calendarEvents:delete"),
  },
  notificationTemplates: {
    get: defineConvexQuery<
      "notificationTemplates:get",
      { tenantSlug: string },
      NotificationTemplates
    >("notificationTemplates:get"),
    update: defineConvexMutation<
      "notificationTemplates:update",
      UpdateNotificationTemplatesInput,
      ApiResult<NotificationTemplates>
    >("notificationTemplates:update"),
  },
  loyalty: {
    get: defineConvexQuery<"loyalty:get", { tenantSlug: string }, LoyaltyConfig>("loyalty:get"),
    update: defineConvexMutation<
      "loyalty:update",
      UpdateLoyaltyConfigInput,
      ApiResult<LoyaltyConfig>
    >("loyalty:update"),
  },
  analytics: {
    list: defineConvexQuery<"analytics:list", { tenantSlug: string }, AnalyticsPoint[]>("analytics:list"),
  },
  vouchers: {
    list: defineConvexQuery<"vouchers:list", { tenantSlug: string }, Voucher[]>("vouchers:list"),
    createOrder: defineConvexMutation<
      "vouchers:createOrder",
      CreateVoucherOrderInput,
      ApiResult<Voucher>
    >("vouchers:createOrder"),
  },
  auth: {
    resolveSession: defineConvexQuery<
      "auth:resolveSession",
      { sessionToken: string | null; tenantSlug?: string },
      ConvexResolvedAuthSession | null
    >("auth:resolveSession"),
    createSeededSession: defineConvexMutation<
      "auth:createSeededSession",
      { email: string; tenantSlug?: string },
      { sessionToken: string; session: ConvexResolvedAuthSession }
    >("auth:createSeededSession"),
    revokeSession: defineConvexMutation<
      "auth:revokeSession",
      { sessionToken: string },
      { revoked: boolean }
    >("auth:revokeSession"),
    beginMagicLink: defineConvexMutation<
      "auth:beginMagicLink",
      { email: string; tenantSlug?: string },
      ConvexMagicLinkStartResult
    >("auth:beginMagicLink"),
    completeMagicLink: defineConvexMutation<
      "auth:completeMagicLink",
      { token: string },
      { sessionToken: string }
    >("auth:completeMagicLink"),
    beginGoogleOAuth: defineConvexMutation<
      "auth:beginGoogleOAuth",
      { tenantSlug?: string; redirectTo?: string },
      { authorizationUrl: string }
    >("auth:beginGoogleOAuth"),
  },
} as const

export type ConvexContractRegistry = typeof convexContracts
