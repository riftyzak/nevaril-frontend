import { convexContracts } from "../src/lib/app/convex-contracts"

export const staffQueries = {
  list: convexContracts.staff.list,
  getByUser: convexContracts.staff.getByUser,
}

export const staffMutations = {
  updateNotes: convexContracts.staff.updateNotes,
}
