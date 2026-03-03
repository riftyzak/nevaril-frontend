import type { AppLocale } from "@/i18n/locales"
import { PricingPanel } from "@/features/admin/advanced-pages"
import { getSession } from "@/lib/auth/getSession"

export default async function PricingPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>
}>) {
  await params
  const session = await getSession()
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <PricingPanel currentPlan={session.plan} />
    </main>
  )
}
