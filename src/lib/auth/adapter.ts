import { cookies } from "next/headers"

import type { AppLocale } from "@/i18n/locales"
import type { AppSession } from "@/lib/auth/types"
import { convexContracts } from "@/lib/app/convex-contracts"
import type { ConvexResolvedAuthSession } from "@/lib/app/convex-contracts"
import {
  beginConvexMagicLink,
  completeConvexMagicLink,
  queryConvexResolvedSession,
  revokeConvexSession,
} from "@/lib/auth/convex-auth-client"
import { AuthSessionInvalidError, AuthSessionRequiredError } from "@/lib/auth/errors"
import {
  sendMagicLinkEmail,
  type MagicLinkEmailDeliveryMode,
} from "@/lib/auth/magic-link-email"
import { getAuthSource } from "@/lib/auth/source"
import { mockAuthAdapter } from "@/lib/auth/mock-auth-adapter"
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie"
import { localePath } from "@/lib/tenant/tenant-url"

export interface ResolveSessionInput {
  tenantSlug?: string
  sessionToken?: string | null
}

export interface BeginMagicLinkInput {
  email: string
  tenantSlug?: string
  locale: AppLocale
  next?: string
  origin: string
}

export interface BeginMagicLinkResult {
  requestedAt: string
  expiresAt: string
  cooldownEndsAt: string
  deliveryMode: MagicLinkEmailDeliveryMode
}

export interface BeginOAuthInput {
  provider: "google_oauth"
  tenantSlug?: string
  redirectTo?: string
}

export interface AuthAdapter {
  resolveSession(input?: ResolveSessionInput): Promise<AppSession>
  signOut(): Promise<void>
  beginMagicLink(input: BeginMagicLinkInput): Promise<BeginMagicLinkResult>
  completeMagicLink(input: { token: string }): Promise<{ sessionToken: string }>
  beginOAuth(input: BeginOAuthInput): Promise<{ authorizationUrl: string }>
}

function buildMissingConvexSessionError() {
  return new AuthSessionRequiredError(
    "No backend auth session was found for AUTH_SOURCE=convex. Sign in with the Convex magic-link flow or switch explicitly to AUTH_SOURCE=mock for dev/e2e fallback."
  )
}

function buildMagicLinkVerifyUrl(input: {
  origin: string
  locale: AppLocale
  token: string
  tenantSlug?: string
  next?: string
}) {
  const params = new URLSearchParams({ token: input.token })
  if (input.tenantSlug) {
    params.set("tenantSlug", input.tenantSlug)
  }
  if (input.next) {
    params.set("next", input.next)
  }

  return `${input.origin}${localePath({
    locale: input.locale,
    path: "/auth/verify",
  })}?${params.toString()}`
}

function mapResolvedSessionToAppSession(
  session: ConvexResolvedAuthSession,
  requestedTenantSlug?: string
): AppSession {
  const activeTenantSlug = requestedTenantSlug ?? session.activeTenantSlug ?? session.memberships[0]?.tenantSlug
  const activeMembership =
    session.memberships.find((membership) => membership.tenantSlug === activeTenantSlug) ??
    session.memberships[0]

  if (!activeMembership) {
    throw new Error(
      `Backend auth session '${session.sessionId}' has no active tenant memberships.`
    )
  }

  return {
    sessionId: session.sessionId,
    userId: session.user.id,
    role: activeMembership.role,
    tenantId: activeMembership.tenantId,
    tenantSlug: activeMembership.tenantSlug,
    activeTenantSlug: activeMembership.tenantSlug,
    staffId: activeMembership.staffId,
    plan: activeMembership.plan,
    authMethod: session.authMethod,
    memberships: session.memberships.map((membership) => ({
      tenantId: membership.tenantId,
      tenantSlug: membership.tenantSlug,
      role: membership.role,
      staffId: membership.staffId,
    })),
    identity: {
      provider: session.authMethod,
      email: session.user.primaryEmail,
    },
  }
}

async function resolveConvexSession(input?: ResolveSessionInput) {
  const cookieStore = await cookies()
  const sessionToken =
    input?.sessionToken ?? cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null

  if (!sessionToken) {
    throw buildMissingConvexSessionError()
  }

  const session = await queryConvexResolvedSession({
    sessionToken,
    tenantSlug: input?.tenantSlug,
  })

  if (!session) {
    throw new AuthSessionInvalidError(
      "Backend auth session is missing, invalid, or expired for AUTH_SOURCE=convex. Sign in again or switch explicitly to AUTH_SOURCE=mock for fallback/dev mode."
    )
  }

  return mapResolvedSessionToAppSession(session, input?.tenantSlug)
}

const convexAuthAdapter: AuthAdapter = {
  resolveSession: resolveConvexSession,
  signOut: async () => {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null
    if (sessionToken) {
      await revokeConvexSession(sessionToken)
    }
    cookieStore.delete(AUTH_SESSION_COOKIE_NAME)
  },
  beginMagicLink: async (input) => {
    const result = await beginConvexMagicLink({
      email: input.email,
      tenantSlug: input.tenantSlug,
    })

    if (result.sendStatus === "cooldown_active" || !result.verificationToken) {
      return {
        requestedAt: result.requestedAt,
        expiresAt: result.expiresAt,
        cooldownEndsAt: result.cooldownEndsAt,
        deliveryMode: "email_cooldown",
      }
    }

    const verifyUrl = buildMagicLinkVerifyUrl({
      origin: input.origin,
      locale: input.locale,
      token: result.verificationToken,
      tenantSlug: input.tenantSlug,
      next: input.next,
    })

    const delivery = await sendMagicLinkEmail({
      email: input.email,
      tenantSlug: input.tenantSlug,
      verifyUrl,
      expiresAt: result.expiresAt,
    })

    return {
      requestedAt: result.requestedAt,
      expiresAt: result.expiresAt,
      cooldownEndsAt: result.cooldownEndsAt,
      deliveryMode: delivery.deliveryMode,
    }
  },
  completeMagicLink: async (input) => {
    return completeConvexMagicLink(input.token)
  },
  beginOAuth: async () => {
    throw new Error(
      `Convex auth flow ${convexContracts.auth.beginGoogleOAuth.name} is not implemented in M28. Use AUTH_SOURCE=mock or the Convex magic-link flow.`
    )
  },
}

export function getAuthAdapter(): AuthAdapter {
  return getAuthSource() === "convex" ? convexAuthAdapter : mockAuthAdapter
}
