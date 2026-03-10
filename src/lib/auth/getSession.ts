import type { AppSession } from "@/lib/auth/types"
import { resolveSession } from "@/lib/auth/session"

interface GetSessionInput {
  tenantSlug?: string
}

export async function getSession(input?: GetSessionInput): Promise<AppSession> {
  return resolveSession({ tenantSlug: input?.tenantSlug })
}
