import type { TenantConfig, UpdateTenantConfigInput } from "@/lib/api/types"
import { getWidgetThemeOverrides } from "@/lib/theme/widget-theme"

export function customerReadModeFromVisibility(
  visibility: TenantConfig["customersVisibility"]
): TenantConfig["customerReadMode"] {
  return visibility === "own" ? "served-only" : "all-readonly"
}

export function sanitizeCustomFields(fields: TenantConfig["customFields"] | undefined) {
  if (!fields) return undefined

  return fields
    .map((field, index) => ({
      id: field.id.trim() || `field-${index + 1}`,
      label: field.label.trim(),
      type: field.type === "textarea" ? ("textarea" as const) : ("text" as const),
      required: Boolean(field.required),
      placeholder: field.placeholder?.trim() || undefined,
    }))
    .filter((field) => field.label.length > 0)
}

export function normalizeTenantConfigPatch(
  currentConfig: TenantConfig,
  patch: UpdateTenantConfigInput["patch"]
) {
  const widgetTheme = getWidgetThemeOverrides({
    primary: patch.embedDefaults?.widgetPrimary,
    radius: patch.embedDefaults?.widgetRadius?.replace("px", ""),
    logoUrl: patch.logoUrl,
  })
  const nextVisibility = patch.customersVisibility ?? currentConfig.customersVisibility
  const sanitizedCustomFields = sanitizeCustomFields(patch.customFields) ?? currentConfig.customFields

  return {
    tenantName: patch.tenantName?.trim() || currentConfig.tenantName,
    logoUrl: patch.logoUrl !== undefined ? widgetTheme.logoUrl : currentConfig.logoUrl,
    staffSelectionEnabled: patch.staffSelectionEnabled ?? currentConfig.staffSelectionEnabled,
    cancellationPolicyText: patch.cancellationPolicyText?.trim() || currentConfig.cancellationPolicyText,
    cancellationPolicyHours:
      patch.cancellationPolicyHours !== undefined
        ? Math.max(0, Math.round(patch.cancellationPolicyHours))
        : currentConfig.cancellationPolicyHours,
    customFields: sanitizedCustomFields,
    customersVisibility: nextVisibility,
    customerReadMode: customerReadModeFromVisibility(nextVisibility),
    embedDefaults: {
      ...currentConfig.embedDefaults,
      ...patch.embedDefaults,
      widgetPrimary:
        patch.embedDefaults?.widgetPrimary !== undefined
          ? widgetTheme.primary
          : currentConfig.embedDefaults.widgetPrimary,
      widgetRadius:
        patch.embedDefaults?.widgetRadius !== undefined
          ? widgetTheme.radius
          : currentConfig.embedDefaults.widgetRadius,
      defaultServiceId:
        patch.embedDefaults?.defaultServiceId !== undefined
          ? patch.embedDefaults.defaultServiceId
          : currentConfig.embedDefaults.defaultServiceId,
    },
  }
}
