import type { AppLocale } from "@/i18n/locales"
import { requireRouteAccess } from "@/lib/auth/route-guard"
import type { PermissionAbility, PermissionModule } from "@/lib/auth/types"
import { buildAdminNav } from "@/lib/auth/admin-nav"

export async function getAdminPageContext(input: {
  locale: AppLocale
  tenantSlug: string
  module: PermissionModule
  ability: PermissionAbility
}) {
  const { session, tenantSettings } = await requireRouteAccess({
    locale: input.locale,
    tenantSlug: input.tenantSlug,
    module: input.module,
    ability: input.ability,
  })

  return {
    session,
    tenantSettings,
    navItems: buildAdminNav(input.locale, input.tenantSlug),
  }
}
