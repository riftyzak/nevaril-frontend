import { redirect } from "next/navigation"

import { type AppLocale } from "@/i18n/locales"
import { tenantUrl } from "@/lib/tenant/tenant-url"

function createSearchParams(
  searchParams: Record<string, string | string[] | undefined>
) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) params.append(key, item)
      }
      continue
    }

    if (value !== undefined) {
      params.set(key, value)
    }
  }

  return params.toString()
}

export default async function PublicPageRedirect({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { locale, tenantSlug } = await params
  const query = createSearchParams(await searchParams)
  const target = tenantUrl({ locale, tenantSlug, path: "/book" })

  redirect(query ? `${target}?${query}` : target)
}
