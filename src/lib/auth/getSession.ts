import type { MockSession } from "@/lib/auth/types"
import { resolveSession } from "@/lib/auth/session"

interface GetSessionInput {
  tenantSlug?: string
}

export async function getSession(input?: GetSessionInput): Promise<MockSession> {
  return resolveSession({ tenantSlug: input?.tenantSlug })
}
