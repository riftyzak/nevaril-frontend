import { convexContracts } from "../src/lib/app/convex-contracts"

export const membershipQueries = {
  listForUser: convexContracts.memberships.listForUser,
  getForTenant: convexContracts.memberships.getForTenant,
}
