import { convexContracts } from "../src/lib/app/convex-contracts"

export const waitlistQueries = {
  list: convexContracts.waitlist.list,
}

export const waitlistMutations = {
  create: convexContracts.waitlist.create,
  assign: convexContracts.waitlist.assign,
}
