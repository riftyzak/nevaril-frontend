"use client"

type GtmPayload = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

const onceRegistry = new Set<string>()

function canPushToDataLayer() {
  return typeof window !== "undefined" && Array.isArray(window.dataLayer)
}

export function pushEvent(name: string, payload?: GtmPayload) {
  if (!canPushToDataLayer()) return false
  window.dataLayer?.push({
    event: name,
    ...(payload ?? {}),
  })
  return true
}

export function pushEventOnce(name: string, payload?: GtmPayload, key?: string) {
  if (typeof window === "undefined") return false
  const onceKey = key ?? `${name}:${window.location.pathname}:${window.location.search}`
  if (onceRegistry.has(onceKey)) return false
  onceRegistry.add(onceKey)
  return pushEvent(name, payload)
}

export function useGtm() {
  return {
    pushEvent,
    pushEventOnce,
  }
}
