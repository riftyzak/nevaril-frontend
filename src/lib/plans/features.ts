export const PLAN_FEATURES = {
  NOTIFICATIONS: "notifications",
  LOYALTY: "loyalty",
  VOUCHERS: "vouchers",
  REVIEWS: "reviews",
  ANALYTICS: "analytics",
} as const

export type PlanFeature = (typeof PLAN_FEATURES)[keyof typeof PLAN_FEATURES]
