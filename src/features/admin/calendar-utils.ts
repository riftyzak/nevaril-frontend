import { addDays, addMinutes, differenceInMinutes } from "date-fns"
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"

import type { CalendarEvent, Booking } from "@/lib/api/types"
import type { AppLocale } from "@/i18n/locales"

export const CALENDAR_START_HOUR = 7
export const CALENDAR_END_HOUR = 21
export const CALENDAR_ROW_HEIGHT = 36
export const CALENDAR_WEEK_DAYS = 7

const localeMap: Record<AppLocale, string> = {
  cs: "cs-CZ",
  en: "en-US",
  sk: "sk-SK",
}

export type AdminCalendarItem =
  | {
      id: string
      type: "booking"
      title: string
      startAt: string
      endAt: string
      staffId: string | null
      booking: Booking
    }
  | {
      id: string
      type: CalendarEvent["type"]
      title: string
      startAt: string
      endAt: string
      staffId: string | null
      event: CalendarEvent
    }

function toUtcDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`)
}

function formatUtcDate(date: Date) {
  return formatInTimeZone(date, "UTC", "yyyy-MM-dd")
}

function toZonedDate(date: string, hours: number, minutes: number, timezone: string) {
  const [year, month, day] = date.split("-").map(Number)
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))
  return fromZonedTime(utcDate, timezone)
}

export function getInitialWeekStart(timezone: string) {
  const localToday = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd")
  const today = toUtcDate(localToday)
  const mondayOffset = (today.getUTCDay() + 6) % 7
  return formatUtcDate(addDays(today, -mondayOffset))
}

export function shiftWeek(weekStart: string, offsetWeeks: number) {
  return formatUtcDate(addDays(toUtcDate(weekStart), offsetWeeks * CALENDAR_WEEK_DAYS))
}

export function getWeekDays(weekStart: string, locale: AppLocale, timezone: string) {
  const formatter = new Intl.DateTimeFormat(localeMap[locale], {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
  })

  return Array.from({ length: CALENDAR_WEEK_DAYS }, (_, index) => {
    const date = addDays(toUtcDate(weekStart), index)
    return {
      dateKey: formatUtcDate(date),
      label: formatter.format(date),
      isToday:
        formatInTimeZone(new Date(), timezone, "yyyy-MM-dd") ===
        formatUtcDate(date),
    }
  })
}

export function getWeekRange(weekStart: string, timezone: string) {
  const startAt = toZonedDate(weekStart, 0, 0, timezone).toISOString()
  const endDate = formatUtcDate(addDays(toUtcDate(weekStart), CALENDAR_WEEK_DAYS))
  const endAt = toZonedDate(endDate, 0, 0, timezone).toISOString()

  return { startAt, endAt }
}

export function buildTimeLabels() {
  return Array.from({ length: (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 2 + 1 }, (_, index) => {
    const totalMinutes = CALENDAR_START_HOUR * 60 + index * 30
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  })
}

export function normalizeCalendarItems(
  bookings: Booking[],
  events: CalendarEvent[]
): AdminCalendarItem[] {
  const bookingItems = bookings.map<AdminCalendarItem>((booking) => ({
    id: booking.id,
    type: "booking",
    title: booking.customerName,
    startAt: booking.startAt,
    endAt: booking.endAt,
    staffId: booking.staffId,
    booking,
  }))

  const eventItems = events.map<AdminCalendarItem>((event) => ({
    id: event.id,
    type: event.type,
    title: event.title,
    startAt: event.startAt,
    endAt: event.endAt,
    staffId: event.staffId,
    event,
  }))

  return [...bookingItems, ...eventItems].sort((left, right) => left.startAt.localeCompare(right.startAt))
}

export function getItemDateKey(item: Pick<AdminCalendarItem, "startAt">, timezone: string) {
  return formatInTimeZone(new Date(item.startAt), timezone, "yyyy-MM-dd")
}

export function getItemPosition(item: Pick<AdminCalendarItem, "startAt" | "endAt">, timezone: string) {
  const startLabel = formatInTimeZone(new Date(item.startAt), timezone, "HH:mm")
  const [startHour, startMinute] = startLabel.split(":").map(Number)
  const startMinutes = startHour * 60 + startMinute
  const baseMinutes = CALENDAR_START_HOUR * 60
  const top = ((startMinutes - baseMinutes) / 30) * CALENDAR_ROW_HEIGHT
  const height = Math.max(
    CALENDAR_ROW_HEIGHT,
    (differenceInMinutes(new Date(item.endAt), new Date(item.startAt)) / 30) * CALENDAR_ROW_HEIGHT
  )

  return { top, height }
}

export function clampItemToVisibleHours(
  item: Pick<AdminCalendarItem, "startAt" | "endAt">,
  dateKey: string,
  timezone: string
) {
  const visibleStart = toZonedDate(dateKey, CALENDAR_START_HOUR, 0, timezone)
  const visibleEnd = toZonedDate(dateKey, CALENDAR_END_HOUR, 0, timezone)
  const startAt = new Date(item.startAt)
  const endAt = new Date(item.endAt)

  if (endAt <= visibleStart || startAt >= visibleEnd) return null

  return {
    startAt: startAt < visibleStart ? visibleStart.toISOString() : item.startAt,
    endAt: endAt > visibleEnd ? visibleEnd.toISOString() : item.endAt,
  }
}

export function formatWeekRangeLabel(weekStart: string, locale: AppLocale) {
  const localeTag = localeMap[locale]
  const formatter = new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
  const start = toUtcDate(weekStart)
  const end = addDays(start, CALENDAR_WEEK_DAYS - 1)
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

export function formatItemTimeLabel(item: Pick<AdminCalendarItem, "startAt" | "endAt">, timezone: string) {
  const start = formatInTimeZone(new Date(item.startAt), timezone, "HH:mm")
  const end = formatInTimeZone(new Date(item.endAt), timezone, "HH:mm")
  return `${start}-${end}`
}

export function createEmptySlotStart(dateKey: string, rowIndex: number, timezone: string) {
  const totalMinutes = CALENDAR_START_HOUR * 60 + rowIndex * 30
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return toZonedDate(dateKey, hours, minutes, timezone).toISOString()
}

export function addDuration(startAt: string, minutes: number) {
  return addMinutes(new Date(startAt), minutes).toISOString()
}

export function getDefaultCreateStartAt(weekStart: string, timezone: string) {
  const currentWeekStart = getInitialWeekStart(timezone)
  if (weekStart !== currentWeekStart) {
    return createEmptySlotStart(weekStart, 4, timezone)
  }

  const todayKey = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd")
  const hour = Number(formatInTimeZone(new Date(), timezone, "H"))
  const minute = Number(formatInTimeZone(new Date(), timezone, "m"))
  let roundedMinutes = Math.ceil((hour * 60 + minute + 1) / 30) * 30
  let dateKey = todayKey

  if (roundedMinutes < CALENDAR_START_HOUR * 60) {
    roundedMinutes = CALENDAR_START_HOUR * 60
  }

  if (roundedMinutes >= CALENDAR_END_HOUR * 60) {
    roundedMinutes = CALENDAR_START_HOUR * 60
    dateKey = formatUtcDate(addDays(toUtcDate(todayKey), 1))
  }

  const rowIndex = Math.floor((roundedMinutes - CALENDAR_START_HOUR * 60) / 30)
  return createEmptySlotStart(dateKey, rowIndex, timezone)
}
