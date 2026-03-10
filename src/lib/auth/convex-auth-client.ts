import "server-only"

import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference } from "convex/server"

import { convexContracts } from "@/lib/app/convex-contracts"
import type { ConvexResolvedAuthSession } from "@/lib/app/convex-contracts"
import { assertAppRuntimeConfig } from "@/lib/app/runtime-config"

const resolveSessionRef = makeFunctionReference<
  "query",
  { sessionToken: string | null; tenantSlug?: string },
  ConvexResolvedAuthSession | null
>(convexContracts.auth.resolveSession.name)

const createSeededSessionRef = makeFunctionReference<
  "mutation",
  { email: string; tenantSlug?: string },
  { sessionToken: string; session: ConvexResolvedAuthSession }
>(convexContracts.auth.createSeededSession.name)

const revokeSessionRef = makeFunctionReference<
  "mutation",
  { sessionToken: string },
  { revoked: boolean }
>(convexContracts.auth.revokeSession.name)

const clientCache = new Map<string, ConvexHttpClient>()

function getConvexClient() {
  const { convexUrl } = assertAppRuntimeConfig()
  const existing = clientCache.get(convexUrl)
  if (existing) {
    return existing
  }

  const client = new ConvexHttpClient(convexUrl)
  clientCache.set(convexUrl, client)
  return client
}

export async function queryConvexResolvedSession(input: {
  sessionToken: string | null
  tenantSlug?: string
}) {
  return getConvexClient().query(resolveSessionRef, input)
}

export async function createConvexSeededSession(input: {
  email: string
  tenantSlug?: string
}) {
  return getConvexClient().mutation(createSeededSessionRef, input)
}

export async function revokeConvexSession(sessionToken: string) {
  return getConvexClient().mutation(revokeSessionRef, { sessionToken })
}
