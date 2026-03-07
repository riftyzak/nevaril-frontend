import type { MockDatabase, ServiceVariant, TenantData } from "@/lib/api/types"

export const DB_VERSION = 7

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
      availabilityNote: "",
      timeOffNote: "",
      updatedAt: BASE_TIMESTAMP,
    },
    {
      id: "st-1",
      tenantSlug,
      fullName: isBarber ? "Tomas Kral" : "Jakub Svoboda",
      role: "staff" as const,
      active: true,
      availabilityNote: "",
      timeOffNote: "",
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
      customerEmail: "anna@example.com",
      customerPhone: "+420777000111",
      customFieldValues: {},
      startAt: "2026-01-12T09:00:00.000Z",
      endAt: "2026-01-12T10:00:00.000Z",
      timezone: "Europe/Prague",
      status: "confirmed" as const,
      bookingToken: `${tenantSlug}-manage-1`,
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
      customerEmail: "marek@example.com",
      customerPhone: "+420777000222",
      customFieldValues: {},
      startAt: "2026-01-12T10:30:00.000Z",
      endAt: "2026-01-12T11:00:00.000Z",
      timezone: "Europe/Prague",
      status: "confirmed" as const,
      bookingToken: `${tenantSlug}-manage-2`,
      manageToken: `${tenantSlug}-manage-2`,
      createdAt: BASE_TIMESTAMP,
      updatedAt: BASE_TIMESTAMP,
    },
  ]

  const calendarEvents = [
    {
      id: `${tenantSlug}-evt-block-1`,
      tenantSlug,
      staffId: "st-1",
      type: "blocked" as const,
      title: isBarber ? "Blok na údržbu" : "Blok servisu",
      startAt: "2026-01-13T11:00:00.000Z",
      endAt: "2026-01-13T12:30:00.000Z",
      note: isBarber ? "Rezerva mezi směnami" : "Technická rezerva",
      createdAt: BASE_TIMESTAMP,
      updatedAt: BASE_TIMESTAMP,
    },
    {
      id: `${tenantSlug}-evt-timeoff-1`,
      tenantSlug,
      staffId: "st-owner",
      type: "time_off" as const,
      title: isBarber ? "Osobní volno" : "Dopolední volno",
      startAt: "2026-01-14T08:00:00.000Z",
      endAt: "2026-01-14T11:00:00.000Z",
      note: isBarber ? "Lékař" : "Soukromé vyřízení",
      createdAt: BASE_TIMESTAMP,
      updatedAt: BASE_TIMESTAMP,
    },
  ]

  return {
    config: {
      tenantSlug,
      tenantName: isBarber ? "Brass Barber" : "Brass Car Service",
      logoUrl: isBarber
        ? "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=120&q=80"
        : "https://images.unsplash.com/photo-1613214150384-3b62017b4b68?auto=format&fit=crop&w=120&q=80",
      timezone: "Europe/Prague",
      localeDefault: "cs",
      plan: isBarber ? "business" : "lite",
      currency: "CZK",
      staffSelectionEnabled: true,
      cancellationPolicyText: isBarber
        ? "Změny a zrušení přijímáme nejpozději 24h před termínem."
        : "Změny a zrušení přijímáme nejpozději 24h před termínem.",
      cancellationPolicyHours: 24,
      customFields: isBarber
        ? [
            {
              id: "note",
              label: "Poznamka",
              type: "textarea",
              required: false,
              placeholder: "Napiste poznamku k rezervaci",
            },
          ]
        : [
            {
              id: "plate",
              label: "SPZ vozidla",
              type: "text",
              required: true,
              placeholder: "1AB2345",
            },
            {
              id: "note",
              label: "Poznamka",
              type: "textarea",
              required: false,
              placeholder: "Co je potreba zkontrolovat",
            },
      ],
      customerReadMode: isBarber ? "served-only" : "all-readonly",
      customersVisibility: isBarber ? "own" : "all_readonly",
      embedDefaults: {
        widgetPrimary: isBarber ? "#1d4ed8" : "#0f766e",
        widgetRadius: "12px",
        defaultServiceId: services[0].id,
      },
      updatedAt: BASE_TIMESTAMP,
    },
    services,
    staff,
    calendarEvents,
    bookings,
    customers,
    waitlist: [
      {
        id: "wl-1",
        tenantSlug,
        serviceId: services[0].id,
        customerName: "Iva Horakova",
        email: "iva@example.com",
        phone: "+420777100333",
        note: "",
        preferredDate: "2026-01-13",
        preferredTimeLabel: "afternoon",
        status: "new",
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
      {
        id: `${tenantSlug}-a-rating-jan`,
        tenantSlug,
        metric: "rating",
        label: "2026-01",
        value: isBarber ? 47 : 44,
      },
      {
        id: `${tenantSlug}-a-top-jan`,
        tenantSlug,
        metric: "top-service",
        label: services[0].name,
        value: isBarber ? 31 : 22,
      },
    ],
    notificationTemplates: {
      sms: "Hello {{customer_name}}, your {{service}} is on {{date}} at {{time}}.",
      email:
        "Hi {{customer_name}},\n\nYour reservation for {{service}} is confirmed for {{date}} {{time}}.\nManage: {{manage_link}}",
      updatedAt: BASE_TIMESTAMP,
    },
    loyaltyConfig: {
      points: isBarber ? 120 : 80,
      nextBookingLabel: "Next reward at 200 points",
      updatedAt: BASE_TIMESTAMP,
    },
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
