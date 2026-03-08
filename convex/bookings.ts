import { convexContracts } from "../src/lib/app/convex-contracts"

export const bookingQueries = {
  list: convexContracts.bookings.list,
  getById: convexContracts.bookings.getById,
  getByToken: convexContracts.bookings.getByToken,
  getAvailability: convexContracts.bookings.getAvailability,
}

export const bookingMutations = {
  create: convexContracts.bookings.create,
  update: convexContracts.bookings.update,
  cancel: convexContracts.bookings.cancel,
}
