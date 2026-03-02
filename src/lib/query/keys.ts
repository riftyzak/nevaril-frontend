export const queryKeys = {
  tenantConfig: (tenantSlug: string) => ["tenant-config", tenantSlug] as const,
  services: (tenantSlug: string) => ["services", tenantSlug] as const,
  service: (tenantSlug: string, serviceId: string) =>
    ["services", tenantSlug, serviceId] as const,
  staff: (tenantSlug: string) => ["staff", tenantSlug] as const,
}
