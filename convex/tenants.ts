import { convexContracts } from "../src/lib/app/convex-contracts"

export const tenantQueries = {
  getBySlug: convexContracts.tenants.getBySlug,
  listForUser: convexContracts.tenants.listForUser,
}
