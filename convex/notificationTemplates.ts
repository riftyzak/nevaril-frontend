import { convexContracts } from "../src/lib/app/convex-contracts"

export const notificationTemplateQueries = {
  get: convexContracts.notificationTemplates.get,
}

export const notificationTemplateMutations = {
  update: convexContracts.notificationTemplates.update,
}
