import type {
  GenericDataModel,
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server"
import { mutationGeneric, queryGeneric } from "convex/server"
import { type GenericId, v } from "convex/values"

import type { ConvexResolvedAuthSession, ConvexResolvedTenantMembership } from "../src/lib/app/convex-contracts"

type DatabaseReader = GenericDatabaseReader<GenericDataModel>
type DatabaseWriter = GenericDatabaseWriter<GenericDataModel>

interface AuthSessionRecord {
  _id: GenericId<"authSessions">
  userId: GenericId<"users">
  sessionToken: string
  activeTenantSlug: string | null
  authMethod: ConvexResolvedAuthSession["authMethod"]
  expiresAt: string
  createdAt: string
  updatedAt: string
}

interface AuthMagicLinkRecord {
  _id: GenericId<"authMagicLinks">
  userId: GenericId<"users">
  email: string
  tenantSlug: string | null
  tokenHash: string
  expiresAt: string
  lastSentAt: string
  consumedAt: string | null
  createdAt: string
  updatedAt: string
}

interface UserRecord {
  _id: GenericId<"users">
  primaryEmail: string
  fullName: string
  createdAt: string
  updatedAt: string
}

interface MembershipRecord {
  _id: GenericId<"tenantMemberships">
  tenantId: GenericId<"tenants">
  userId: GenericId<"users">
  role: "owner" | "staff"
  staffId: string | null
  status: "active" | "invited" | "disabled"
  createdAt: string
  updatedAt: string
}

interface TenantRecord {
  _id: GenericId<"tenants">
  slug: string
  plan: ConvexResolvedTenantMembership["plan"]
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000
const MAGIC_LINK_RESEND_COOLDOWN_MS = 60 * 1000

function nowIso() {
  return new Date().toISOString()
}

function expiresAtIso() {
  return new Date(Date.now() + SESSION_TTL_MS).toISOString()
}

function magicLinkExpiresAtIso() {
  return new Date(Date.now() + MAGIC_LINK_TTL_MS).toISOString()
}

function makeSessionToken() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

function makeMagicLinkToken() {
  return `mlink_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`
}

async function hashMagicLinkToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
}

function isExpired(timestamp: string) {
  return new Date(timestamp).getTime() <= Date.now()
}

function addCooldown(timestamp: string) {
  return new Date(new Date(timestamp).getTime() + MAGIC_LINK_RESEND_COOLDOWN_MS).toISOString()
}

async function resolveSessionRecord(
  db: DatabaseReader,
  sessionToken: string
) {
  const session = (await db
    .query("authSessions")
    .withIndex("by_session_token", (query) => query.eq("sessionToken", sessionToken))
    .unique()) as unknown as AuthSessionRecord | null

  if (!session) {
    return null
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null
  }

  const user = (await db.get(session.userId as GenericId<"users">)) as unknown as UserRecord | null
  if (!user) {
    return null
  }

  return { session, user }
}

async function resolveMagicLinkRecord(
  db: DatabaseReader | DatabaseWriter,
  verificationToken: string
) {
  const tokenHash = await hashMagicLinkToken(verificationToken)
  const magicLink = (await db
    .query("authMagicLinks")
    .withIndex("by_token_hash", (query) =>
      query.eq("tokenHash", tokenHash)
    )
    .unique()) as unknown as AuthMagicLinkRecord | null

  if (!magicLink || magicLink.consumedAt || isExpired(magicLink.expiresAt)) {
    return null
  }

  return magicLink
}

function matchesTenantScope(magicLink: AuthMagicLinkRecord, tenantSlug?: string) {
  return magicLink.tenantSlug === (tenantSlug ?? null)
}

async function listActiveMagicLinks(
  db: DatabaseReader | DatabaseWriter,
  userId: GenericId<"users">,
  tenantSlug?: string
) {
  const magicLinks = (await db
    .query("authMagicLinks")
    .withIndex("by_user_id", (query) => query.eq("userId", userId))
    .collect()) as unknown as AuthMagicLinkRecord[]

  return magicLinks.filter(
    (magicLink) =>
      matchesTenantScope(magicLink, tenantSlug) &&
      !magicLink.consumedAt &&
      !isExpired(magicLink.expiresAt)
  )
}

async function listResolvedMemberships(
  db: DatabaseReader | DatabaseWriter,
  userId: GenericId<"users">
): Promise<ConvexResolvedTenantMembership[]> {
  const memberships = (await db
    .query("tenantMemberships")
    .withIndex("by_user_id", (query) => query.eq("userId", userId))
    .collect()) as unknown as MembershipRecord[]

  const resolved: ConvexResolvedTenantMembership[] = []

  for (const membership of memberships) {
    if (membership.status !== "active") {
      continue
    }

    const tenant = (await db.get(membership.tenantId as GenericId<"tenants">)) as unknown as TenantRecord | null
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
  return (db
    .query("users")
    .withIndex("by_primary_email", (query) => query.eq("primaryEmail", email))
    .unique()) as unknown as Promise<UserRecord | null>
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
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase()
    const user = await getSeededUserByEmail(ctx.db, normalizedEmail)
    if (!user) {
      throw new Error("Magic-link sign-in is not available for this email.")
    }

    const memberships = await listResolvedMemberships(ctx.db, user._id as GenericId<"users">)
    if (memberships.length === 0) {
      throw new Error("Magic-link sign-in is not available for this user.")
    }

    if (
      args.tenantSlug &&
      !memberships.some((membership) => membership.tenantSlug === args.tenantSlug)
    ) {
      throw new Error("Magic-link sign-in is not available for this tenant.")
    }

    const existingLinks = await listActiveMagicLinks(
      ctx.db,
      user._id as GenericId<"users">,
      args.tenantSlug
    )

    const activeMagicLink = existingLinks[0]
    if (activeMagicLink) {
      const cooldownEndsAt = addCooldown(activeMagicLink.lastSentAt)
      if (!isExpired(cooldownEndsAt)) {
        return {
          requestedAt: activeMagicLink.lastSentAt,
          expiresAt: activeMagicLink.expiresAt,
          cooldownEndsAt,
          sendStatus: "cooldown_active" as const,
        }
      }
    }

    for (const existingLink of existingLinks) {
      await ctx.db.delete(existingLink._id)
    }

    const requestedAt = nowIso()
    const expiresAt = magicLinkExpiresAtIso()
    const verificationToken = makeMagicLinkToken()
    const tokenHash = await hashMagicLinkToken(verificationToken)

    await ctx.db.insert("authMagicLinks", {
      userId: user._id as GenericId<"users">,
      email: normalizedEmail,
      tenantSlug: args.tenantSlug ?? null,
      tokenHash,
      expiresAt,
      lastSentAt: requestedAt,
      consumedAt: null,
      createdAt: requestedAt,
      updatedAt: requestedAt,
    })

    return {
      requestedAt,
      expiresAt,
      cooldownEndsAt: addCooldown(requestedAt),
      verificationToken,
      sendStatus: "send_now" as const,
    }
  },
})

export const completeMagicLink = mutationGeneric({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const magicLink = await resolveMagicLinkRecord(ctx.db, args.token)
    if (!magicLink) {
      throw new Error("Magic link is invalid or expired.")
    }

    const memberships = await listResolvedMemberships(ctx.db, magicLink.userId)
    if (memberships.length === 0) {
      throw new Error("Magic-link sign-in is not available for this user.")
    }

    if (
      magicLink.tenantSlug &&
      !memberships.some((membership) => membership.tenantSlug === magicLink.tenantSlug)
    ) {
      throw new Error("Magic-link sign-in is not available for this tenant.")
    }

    const timestamp = nowIso()
    const sessionToken = makeSessionToken()

    await ctx.db.insert("authSessions", {
      userId: magicLink.userId,
      sessionToken,
      activeTenantSlug: magicLink.tenantSlug ?? memberships[0]?.tenantSlug ?? null,
      authMethod: "magic_link",
      expiresAt: expiresAtIso(),
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    await ctx.db.patch(magicLink._id, {
      consumedAt: timestamp,
      updatedAt: timestamp,
    })

    return { sessionToken }
  },
})

export const beginGoogleOAuth = mutationGeneric({
  args: {
    tenantSlug: v.optional(v.string()),
    redirectTo: v.optional(v.string()),
  },
  handler: async () => {
    throw new Error(
      "Google OAuth is not implemented in M28. Use AUTH_SOURCE=mock or the Convex magic-link flow."
    )
  },
})
