import { convexContracts } from "../src/lib/app/convex-contracts"

export const userQueries = {
  getById: convexContracts.users.getById,
  getByEmail: convexContracts.users.getByEmail,
}
