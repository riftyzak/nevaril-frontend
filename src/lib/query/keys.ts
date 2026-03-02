export const queryKeys = {
  tenantConfig: (tenantSlug: string) => ["tenant-config", tenantSlug] as const,
  services: (tenantSlug: string) => ["services", tenantSlug] as const,
  service: (tenantSlug: string, serviceId: string) =>
    ["services", tenantSlug, serviceId] as const,
  staff: (tenantSlug: string) => ["staff", tenantSlug] as const,
  waitlist: (tenantSlug: string) => ["waitlist", tenantSlug] as const,
  availability: (
    tenantSlug: string,
    serviceId: string,
    variant: number,
    staffId: string,
    date: string
  ) => ["availability", tenantSlug, serviceId, variant, staffId, date] as const,
}
