import { queryGeneric } from "convex/server"
import { type GenericId, v } from "convex/values"

export const getById = queryGeneric({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as GenericId<"users">)
    if (!user) {
      throw new Error(`User '${args.userId}' was not found in Convex.`)
    }

    return {
      id: user._id,
      primaryEmail: user.primaryEmail,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  },
})

export const getByEmail = queryGeneric({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase()
    const user = await ctx.db
      .query("users")
      .withIndex("by_primary_email", (query) => query.eq("primaryEmail", normalizedEmail))
      .unique()

    if (!user) {
      return null
    }

    return {
      id: user._id,
      primaryEmail: user.primaryEmail,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  },
})
