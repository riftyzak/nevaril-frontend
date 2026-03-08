import { convexContracts } from "../src/lib/app/convex-contracts"

export const tenantSettingQueries = {
  get: convexContracts.tenantSettings.get,
}

export const tenantSettingMutations = {
  update: convexContracts.tenantSettings.update,
  updatePlan: convexContracts.tenantSettings.updatePlan,
}
