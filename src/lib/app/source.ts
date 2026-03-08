export type AppDataSource = "mock" | "convex"

export const DEFAULT_APP_DATA_SOURCE: AppDataSource = "mock"

export function getAppDataSource(): AppDataSource {
  const envValue = process.env.NEXT_PUBLIC_APP_DATA_SOURCE ?? process.env.APP_DATA_SOURCE
  return envValue === "convex" ? "convex" : DEFAULT_APP_DATA_SOURCE
}
