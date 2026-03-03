export interface WidgetThemeOverrides {
  primary?: string
  radius?: string
  logoUrl?: string
}

function sanitizePrimary(value?: string) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed
  if (/^[a-zA-Z]+$/.test(trimmed)) return trimmed
  if (/^(rgb|rgba|hsl|hsla)\([^)]+\)$/.test(trimmed)) return trimmed
  return undefined
}

function sanitizeRadius(value?: string) {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  if (parsed < 0 || parsed > 24) return undefined
  return `${parsed}px`
}

function sanitizeLogoUrl(value?: string) {
  if (!value) return undefined
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined
    return parsed.toString()
  } catch {
    return undefined
  }
}

export function getWidgetThemeOverrides(input: {
  primary?: string
  radius?: string
  logoUrl?: string
}): WidgetThemeOverrides {
  return {
    primary: sanitizePrimary(input.primary),
    radius: sanitizeRadius(input.radius),
    logoUrl: sanitizeLogoUrl(input.logoUrl),
  }
}
