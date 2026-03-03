import type { TenantPlan } from "@/lib/api/types"
import { PLAN_FEATURES, type PlanFeature } from "@/lib/plans/features"

const PLAN_ORDER: TenantPlan[] = ["starter", "lite", "business", "ultimate"]

const FEATURE_MIN_PLAN: Record<PlanFeature, TenantPlan> = {
  [PLAN_FEATURES.NOTIFICATIONS]: "lite",
  [PLAN_FEATURES.LOYALTY]: "business",
  [PLAN_FEATURES.VOUCHERS]: "business",
  [PLAN_FEATURES.REVIEWS]: "lite",
  [PLAN_FEATURES.ANALYTICS]: "business",
}

export function isFeatureEnabled(plan: TenantPlan, feature: PlanFeature) {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(FEATURE_MIN_PLAN[feature])
}

export function requiredPlanForFeature(feature: PlanFeature) {
  return FEATURE_MIN_PLAN[feature]
}
