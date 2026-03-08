import { convexContracts } from "../src/lib/app/convex-contracts"

export const serviceQueries = {
  list: convexContracts.services.list,
  get: convexContracts.services.get,
}

export const serviceMutations = {
  update: convexContracts.services.update,
}
