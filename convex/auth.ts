import { mutationGeneric, queryGeneric } from "convex/server"
import { type GenericId, v } from "convex/values"

import type { ConvexResolvedAuthSession, ConvexResolvedTenantMembership } from "../src/lib/app/convex-contracts"
import type { DatabaseReader, DatabaseWriter } from "./_generated/server"

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

function nowIso() {
  return new Date().toISOString()
}

function expiresAtIso() {
  return new Date(Date.now() + SESSION_TTL_MS).toISOString()
}

function makeSessionToken() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

async function resolveSessionRecord(
  db: DatabaseReader,
  sessionToken: string
) {
  const session = await db
    .query("authSessions")
    .withIndex("by_session_token", (query) => query.eq("sessionToken", sessionToken))
    .unique()

  if (!session) {
    return null
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null
  }

  const user = await db.get(session.userId as GenericId<"users">)
  if (!user) {
    return null
  }

  return { session, user }
}

async function listResolvedMemberships(
  db: DatabaseReader | DatabaseWriter,
  userId: GenericId<"users">
): Promise<ConvexResolvedTenantMembership[]> {
  const memberships = await db
    .query("tenantMemberships")
    .withIndex("by_user_id", (query) => query.eq("userId", userId))
    .collect()

  const resolved: ConvexResolvedTenantMembership[] = []

  for (const membership of memberships) {
    if (membership.status !== "active") {
      continue
    }

    const tenant = await db.get(membership.tenantId as GenericId<"tenants">)
    if (!tenant) {
      continue
    }

    resolved.push({
      id: membership._id,
      tenantId: membership.tenantId,
      tenantSlug: tenant.slug,
      role: membership.role,
      staffId: membership.staffId,
      status: membership.status,
      plan: tenant.plan,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    })
  }

  return resolved
}

function pickActiveTenantSlug(input: {
  requestedTenantSlug?: string
  storedActiveTenantSlug: string | null
  memberships: ConvexResolvedTenantMembership[]
}) {
  if (
    input.requestedTenantSlug &&
    input.memberships.some((membership) => membership.tenantSlug === input.requestedTenantSlug)
  ) {
    return input.requestedTenantSlug
  }

  if (
    input.storedActiveTenantSlug &&
    input.memberships.some((membership) => membership.tenantSlug === input.storedActiveTenantSlug)
  ) {
    return input.storedActiveTenantSlug
  }

  return input.memberships[0]?.tenantSlug ?? null
}

async function buildResolvedSession(input: {
  db: DatabaseReader | DatabaseWriter
  sessionToken: string
  requestedTenantSlug?: string
}): Promise<ConvexResolvedAuthSession | null> {
  const record = await resolveSessionRecord(input.db, input.sessionToken)
  if (!record) {
    return null
  }

  const memberships = await listResolvedMemberships(
    input.db,
    record.user._id as GenericId<"users">
  )
  const activeTenantSlug = pickActiveTenantSlug({
    requestedTenantSlug: input.requestedTenantSlug,
    storedActiveTenantSlug: record.session.activeTenantSlug,
    memberships,
  })

  return {
    sessionId: record.session._id,
    sessionToken: record.session.sessionToken,
    user: {
      id: record.user._id,
      primaryEmail: record.user.primaryEmail,
      fullName: record.user.fullName,
      createdAt: record.user.createdAt,
      updatedAt: record.user.updatedAt,
    },
    activeTenantSlug,
    authMethod: record.session.authMethod,
    memberships,
    expiresAt: record.session.expiresAt,
    createdAt: record.session.createdAt,
    updatedAt: record.session.updatedAt,
  }
}

async function getSeededUserByEmail(
  db: DatabaseReader | DatabaseWriter,
  email: string
) {
  return db
    .query("users")
    .withIndex("by_primary_email", (query) => query.eq("primaryEmail", email))
    .unique()
}

export const resolveSession = queryGeneric({
  args: {
    sessionToken: v.union(v.string(), v.null()),
    tenantSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.sessionToken) {
      return null
    }

    return buildResolvedSession({
      db: ctx.db,
      sessionToken: args.sessionToken,
      requestedTenantSlug: args.tenantSlug,
    })
  },
})

export const createSeededSession = mutationGeneric({
  args: {
    email: v.string(),
    tenantSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase()
    const user = await getSeededUserByEmail(ctx.db, normalizedEmail)
    if (!user) {
      throw new Error(
        `Seeded auth user '${normalizedEmail}' was not found. Run npx convex run seed:seedBarberReadSlice first.`
      )
    }

    const memberships = await listResolvedMemberships(ctx.db, user._id as GenericId<"users">)
    if (memberships.length === 0) {
      throw new Error(`Seeded auth user '${normalizedEmail}' has no active tenant memberships.`)
    }

    if (
      args.tenantSlug &&
      !memberships.some((membership) => membership.tenantSlug === args.tenantSlug)
    ) {
      throw new Error(
        `Seeded auth user '${normalizedEmail}' does not belong to tenant '${args.tenantSlug}'.`
      )
    }

    const timestamp = nowIso()
    const sessionToken = makeSessionToken()
    await ctx.db.insert("authSessions", {
      userId: user._id as GenericId<"users">,
      sessionToken,
      activeTenantSlug: args.tenantSlug ?? memberships[0]?.tenantSlug ?? null,
      authMethod: "magic_link",
      expiresAt: expiresAtIso(),
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    const session = await buildResolvedSession({
      db: ctx.db,
      sessionToken,
      requestedTenantSlug: args.tenantSlug,
    })

    if (!session) {
      throw new Error("Created auth session could not be resolved.")
    }

    return {
      sessionToken,
      session,
    }
  },
})

export const revokeSession = mutationGeneric({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("authSessions")
      .withIndex("by_session_token", (query) => query.eq("sessionToken", args.sessionToken))
      .unique()

    if (!existing) {
      return { revoked: false }
    }

    await ctx.db.delete(existing._id)
    return { revoked: true }
  },
})

export const beginMagicLink = mutationGeneric({
  args: {
    email: v.string(),
    tenantSlug: v.optional(v.string()),
  },
  handler: async () => {
    throw new Error(
      "Magic-link delivery is not implemented in M27. Use auth:createSeededSession for the seeded backend auth handoff."
    )
  },
})

export const beginGoogleOAuth = mutationGeneric({
  args: {
    tenantSlug: v.optional(v.string()),
    redirectTo: v.optional(v.string()),
  },
  handler: async () => {
    throw new Error(
      "Google OAuth is not implemented in M27. Use AUTH_SOURCE=mock or the seeded backend auth handoff."
    )
  },
})
