import { getRequestConfig } from "next-intl/server"

import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  isAppLocale,
  type AppLocale,
} from "@/i18n/locales"

type Messages = Record<string, unknown>

async function loadMessages(locale: AppLocale): Promise<Messages> {
  return (await import(`../../messages/${locale}.json`)).default
}

function mergeMessages(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base }

  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key]
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeMessages(baseValue as Messages, value as Messages)
    } else {
      result[key] = value
    }
  }

  return result
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = requested && isAppLocale(requested) ? requested : DEFAULT_LOCALE

  const fallbackMessages = await loadMessages(FALLBACK_LOCALE)
  const localeMessages =
    locale === FALLBACK_LOCALE ? fallbackMessages : await loadMessages(locale)

  return {
    locale,
    messages: mergeMessages(fallbackMessages, localeMessages),
  }
})
