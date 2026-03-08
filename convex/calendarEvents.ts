import { convexContracts } from "../src/lib/app/convex-contracts"

export const calendarEventQueries = {
  list: convexContracts.calendarEvents.list,
}

export const calendarEventMutations = {
  create: convexContracts.calendarEvents.create,
  update: convexContracts.calendarEvents.update,
  delete: convexContracts.calendarEvents.delete,
}
