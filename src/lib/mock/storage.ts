import type { DevSettings, MockDatabase } from "@/lib/api/types"
import { createSeedDatabase, DB_VERSION } from "@/lib/mock/seed"

const STORAGE_KEY = "nevaril:mock-db"

type MockEnvelope = {
  version: number
  data: MockDatabase
}

let memoryEnvelope: MockEnvelope | null = null

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function readEnvelope(): MockEnvelope | null {
  if (hasWindow()) {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw) as MockEnvelope
    } catch {
      return null
    }
  }

  return memoryEnvelope
}

function writeEnvelope(envelope: MockEnvelope) {
  if (hasWindow()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    return
  }

  memoryEnvelope = envelope
}

function createEnvelope(): MockEnvelope {
  return {
    version: DB_VERSION,
    data: createSeedDatabase(),
  }
}

function ensureEnvelope(): MockEnvelope {
  const existing = readEnvelope()
  if (!existing || existing.version !== DB_VERSION) {
    const fresh = createEnvelope()
    writeEnvelope(fresh)
    return fresh
  }
  return existing
}

export function getDb(): MockDatabase {
  return ensureEnvelope().data
}

export function setDb(db: MockDatabase) {
  writeEnvelope({
    version: DB_VERSION,
    data: db,
  })
}

export function mutateDb(mutator: (db: MockDatabase) => MockDatabase): MockDatabase {
  const updated = mutator(getDb())
  setDb(updated)
  return updated
}

export function resetSeed(): MockDatabase {
  const envelope = createEnvelope()
  writeEnvelope(envelope)
  return envelope.data
}

export function getDevSettings(): DevSettings {
  return getDb().dev
}

export function setDevSettings(settings: Partial<DevSettings>): DevSettings {
  const db = mutateDb((current) => ({
    ...current,
    dev: {
      ...current.dev,
      ...settings,
      latencyMs: Math.max(0, Number(settings.latencyMs ?? current.dev.latencyMs)),
      errorRatePct: Math.min(
        100,
        Math.max(0, Number(settings.errorRatePct ?? current.dev.errorRatePct))
      ),
    },
  }))

  return db.dev
}

export { DB_VERSION }
