import { convexContracts } from "../src/lib/app/convex-contracts"

export const customerQueries = {
  list: convexContracts.customers.list,
  getById: convexContracts.customers.getById,
}

export const customerMutations = {
  updateTags: convexContracts.customers.updateTags,
}
