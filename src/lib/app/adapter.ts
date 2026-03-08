import type { AppDataAdapter } from "@/lib/app/contracts"
import { convexAppDataAdapter } from "@/lib/app/convex-adapter"
import { mockAppDataAdapter } from "@/lib/app/mock-adapter"
import { getAppDataSource } from "@/lib/app/source"

export function getAppDataAdapter(): AppDataAdapter {
  return getAppDataSource() === "convex" ? convexAppDataAdapter : mockAppDataAdapter
}
