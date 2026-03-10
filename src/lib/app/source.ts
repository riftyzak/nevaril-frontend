import { getResolvedAppDataSource } from "@/lib/app/runtime-config"

export type AppDataSource = "mock" | "convex"

export const DEFAULT_APP_DATA_SOURCE: AppDataSource = "convex"

export function getAppDataSource(): AppDataSource {
  return getResolvedAppDataSource()
}
