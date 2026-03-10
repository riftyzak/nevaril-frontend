import type { AppLocale } from "@/i18n/locales"
import { PricingPanel } from "@/features/admin/advanced-pages"
import { isRecoverableAuthSessionError } from "@/lib/auth/errors"
import { getSession } from "@/lib/auth/getSession"
import type { TenantPlan } from "@/lib/api/types"

export default async function PricingPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>
}>) {
  await params
  let currentPlan: TenantPlan | null = null

  try {
    currentPlan = (await getSession()).plan
  } catch (error) {
    if (!isRecoverableAuthSessionError(error)) {
      throw error
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <PricingPanel currentPlan={currentPlan} />
    </main>
  )
}
