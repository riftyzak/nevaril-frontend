import type { AppSession } from "@/lib/auth/types"
import { convexContracts } from "@/lib/app/convex-contracts"
import { getAuthSource } from "@/lib/auth/source"
import { mockAuthAdapter } from "@/lib/auth/mock-auth-adapter"

export interface ResolveSessionInput {
  tenantSlug?: string
  sessionToken?: string | null
}

export interface BeginMagicLinkInput {
  email: string
  tenantSlug?: string
}

export interface BeginOAuthInput {
  provider: "google_oauth"
  tenantSlug?: string
  redirectTo?: string
}

export interface AuthAdapter {
  resolveSession(input?: ResolveSessionInput): Promise<AppSession>
  signOut(): Promise<void>
  beginMagicLink(input: BeginMagicLinkInput): Promise<{ requestedAt: string }>
  completeMagicLink(input: { token: string }): Promise<{ sessionToken: string }>
  beginOAuth(input: BeginOAuthInput): Promise<{ authorizationUrl: string }>
}

const convexAuthAdapter: AuthAdapter = {
  resolveSession: async () => {
    throw new Error(
      `Convex auth adapter is not implemented for ${convexContracts.auth.resolveSession.name}. Keep AUTH_SOURCE=mock.`
    )
  },
  signOut: async () => {
    throw new Error("Convex auth adapter signOut is not implemented yet. Keep AUTH_SOURCE=mock.")
  },
  beginMagicLink: async () => {
    throw new Error(
      `Convex auth adapter is not implemented for ${convexContracts.auth.beginMagicLink.name}. Keep AUTH_SOURCE=mock.`
    )
  },
  completeMagicLink: async () => {
    throw new Error("Convex auth adapter magic link completion is not implemented yet. Keep AUTH_SOURCE=mock.")
  },
  beginOAuth: async () => {
    throw new Error(
      `Convex auth adapter is not implemented for ${convexContracts.auth.beginGoogleOAuth.name}. Keep AUTH_SOURCE=mock.`
    )
  },
}

export function getAuthAdapter(): AuthAdapter {
  return getAuthSource() === "convex" ? convexAuthAdapter : mockAuthAdapter
}
