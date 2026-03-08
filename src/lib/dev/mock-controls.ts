import { getDevSettings, resetSeed, setDevSettings } from "@/lib/mock/storage"

// Dev/demo-only wrapper so product components do not import mock storage directly.
export function readMockDevSettings() {
  return getDevSettings()
}

export function writeMockDevSettings(input: Parameters<typeof setDevSettings>[0]) {
  return setDevSettings(input)
}

export function resetMockData() {
  resetSeed()
}
