export const APP_LOCALES = ["cs", "sk", "en"] as const
export type AppLocale = (typeof APP_LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = "cs"
export const FALLBACK_LOCALE: AppLocale = "en"

export function isAppLocale(value: string): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale)
}
