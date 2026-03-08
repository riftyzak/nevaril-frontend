import type { Service, UpdateServiceInput } from "@/lib/api/types"

function normalizeDurationOptions(durationOptions: UpdateServiceInput["patch"]["durationOptions"]) {
  if (!durationOptions) return undefined

  const normalized = Array.from(
    new Set(durationOptions.filter((item): item is 30 | 60 | 90 => item === 30 || item === 60 || item === 90))
  ).sort((left, right) => left - right)

  return normalized.length > 0 ? normalized : undefined
}

export function normalizeServicePatch(currentService: Service, patch: UpdateServiceInput["patch"]) {
  return {
    name: patch.name?.trim() || currentService.name,
    description: patch.description?.trim() || currentService.description,
    category: patch.category?.trim() || currentService.category,
    priceCents:
      patch.priceCents !== undefined
        ? Math.max(0, Math.round(patch.priceCents))
        : currentService.priceCents,
    durationOptions: normalizeDurationOptions(patch.durationOptions) ?? currentService.durationOptions,
    active: patch.active ?? currentService.active,
  }
}
