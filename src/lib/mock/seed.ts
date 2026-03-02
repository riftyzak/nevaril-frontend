import type { MockDatabase, ServiceVariant, TenantData } from "@/lib/api/types"

export const DB_VERSION = 1

const BASE_TIMESTAMP = "2026-01-10T10:00:00.000Z"

function makeServices(tenantSlug: string, names: Array<{ id: string; name: string; category: string; priceCents: number }>) {
  return names.map((item) => ({
    id: item.id,
    tenantSlug,
    name: item.name,
    description: `${item.name} service`,
    category: item.category,
    priceCents: item.priceCents,
    durationOptions: [30, 60, 90] as ServiceVariant[],
    active: true,
    updatedAt: BASE_TIMESTAMP,
  }))
}

function makeTenantData(tenantSlug: "barber" | "carservice"): TenantData {
  const isBarber = tenantSlug === "barber"

  const services = makeServices(
    tenantSlug,
    isBarber
      ? [
          { id: "svc-cut", name: "Haircut", category: "Cut", priceCents: 4200 },
          { id: "svc-beard", name: "Beard Trim", category: "Beard", priceCents: 2500 },
        ]
      : [
          { id: "svc-diagnostic", name: "Diagnostics", category: "Inspection", priceCents: 6900 },
          { id: "svc-oil", name: "Oil Change", category: "Maintenance", priceCents: 7900 },
        ]
  )

  const staff = [
    {
      id: "st-owner",
      tenantSlug,
      fullName: isBarber ? "Martin Novak" : "Petr Dvorak",
      role: "owner" as const,
      active: true,
      updatedAt: BASE_TIMESTAMP,
    },
    {
      id: "st-1",
      tenantSlug,
      fullName: isBarber ? "Tomas Kral" : "Jakub Svoboda",
      role: "staff" as const,
      active: true,
      updatedAt: BASE_TIMESTAMP,
    },
  ]

  const customers = [
    {
      id: "cus-1",
      tenantSlug,
      fullName: "Anna Novakova",
      email: "anna@example.com",
      phone: "+420777000111",
      tags: ["vip"],
      visits: 5,
      creditCents: 1200,
      updatedAt: BASE_TIMESTAMP,
    },
    {
      id: "cus-2",
      tenantSlug,
      fullName: "Marek Sramek",
      email: "marek@example.com",
      phone: "+420777000222",
      tags: ["new"],
      visits: 1,
      creditCents: 0,
      updatedAt: BASE_TIMESTAMP,
    },
  ]

  const bookings = [
    {
      id: "bk-1",
      tenantSlug,
      serviceId: services[0].id,
      serviceVariant: 60 as const,
      staffId: "st-1",
      customerId: "cus-1",
      customerName: "Anna Novakova",
      startAt: "2026-01-12T09:00:00.000Z",
      endAt: "2026-01-12T10:00:00.000Z",
      timezone: "Europe/Prague",
      status: "confirmed" as const,
      manageToken: `${tenantSlug}-manage-1`,
      createdAt: BASE_TIMESTAMP,
      updatedAt: BASE_TIMESTAMP,
    },
    {
      id: "bk-2",
      tenantSlug,
      serviceId: services[1].id,
      serviceVariant: 30 as const,
      staffId: "st-owner",
      customerId: "cus-2",
      customerName: "Marek Sramek",
      startAt: "2026-01-12T10:30:00.000Z",
      endAt: "2026-01-12T11:00:00.000Z",
      timezone: "Europe/Prague",
      status: "confirmed" as const,
      manageToken: `${tenantSlug}-manage-2`,
      createdAt: BASE_TIMESTAMP,
      updatedAt: BASE_TIMESTAMP,
    },
  ]

  return {
    config: {
      tenantSlug,
      tenantName: isBarber ? "Brass Barber" : "Brass Car Service",
      timezone: "Europe/Prague",
      localeDefault: "cs",
      plan: isBarber ? "business" : "lite",
      currency: "CZK",
      staffSelectionEnabled: true,
      customerReadMode: "all-readonly",
      updatedAt: BASE_TIMESTAMP,
    },
    services,
    staff,
    bookings,
    customers,
    waitlist: [
      {
        id: "wl-1",
        tenantSlug,
        serviceId: services[0].id,
        customerName: "Iva Horakova",
        email: "iva@example.com",
        preferredDate: "2026-01-13",
        preferredTimeLabel: "afternoon",
        status: "waiting",
        assignedBookingId: null,
        createdAt: BASE_TIMESTAMP,
        updatedAt: BASE_TIMESTAMP,
      },
    ],
    vouchers: [
      {
        id: "v-1",
        tenantSlug,
        code: `${tenantSlug.toUpperCase()}-WELCOME`,
        type: "fixed",
        amount: 1000,
        currency: "CZK",
        status: "active",
        createdAt: BASE_TIMESTAMP,
        updatedAt: BASE_TIMESTAMP,
      },
    ],
    analytics: [
      {
        id: `${tenantSlug}-a-revenue-jan`,
        tenantSlug,
        metric: "revenue",
        label: "2026-01",
        value: isBarber ? 125000 : 189000,
      },
      {
        id: `${tenantSlug}-a-bookings-jan`,
        tenantSlug,
        metric: "bookings",
        label: "2026-01",
        value: isBarber ? 72 : 48,
      },
    ],
  }
}

export function createSeedDatabase(): MockDatabase {
  return {
    tenants: {
      barber: makeTenantData("barber"),
      carservice: makeTenantData("carservice"),
    },
    dev: {
      latencyMs: 150,
      errorRatePct: 0,
    },
  }
}
