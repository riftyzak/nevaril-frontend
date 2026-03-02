import type { ApiResult } from "@/lib/api/types"

export function unwrapResult<T>(result: ApiResult<T>): T {
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`)
  }
  return result.data
}
