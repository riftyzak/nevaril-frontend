"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listBookings, listCalendarEvents, listStaff } from "@/lib/api"
import type { Booking, CalendarEvent, Staff } from "@/lib/api/types"
import type { MockSession } from "@/lib/auth/types"
import type { AppLocale } from "@/i18n/locales"
import { queryKeys } from "@/lib/query/keys"

import {
  buildTimeLabels,
  clampItemToVisibleHours,
  formatItemTimeLabel,
  formatWeekRangeLabel,
  getInitialWeekStart,
  getItemDateKey,
  getItemPosition,
  getWeekDays,
  getWeekRange,
  normalizeCalendarItems,
  shiftWeek,
  CALENDAR_ROW_HEIGHT,
} from "@/features/admin/calendar-utils"

interface CalendarPanelProps {
  locale: AppLocale
  tenantSlug: string
  session: MockSession
  tz: string
}

function filterScopedBookings(bookings: Booking[], session: MockSession) {
  return session.role === "owner"
    ? bookings
    : bookings.filter((booking) => booking.staffId === session.staffId)
}

function filterScopedEvents(events: CalendarEvent[], session: MockSession) {
  return session.role === "owner"
    ? events
    : events.filter((event) => event.staffId === session.staffId)
}

function getVisibleStaff(staff: Staff[], session: MockSession) {
  return session.role === "owner"
    ? staff
    : staff.filter((member) => member.id === session.staffId)
}

function itemClassName(type: "booking" | CalendarEvent["type"]) {
  if (type === "booking") {
    return "border-primary/30 bg-primary/12 text-foreground hover:bg-primary/18"
  }
  if (type === "blocked") {
    return "border-amber-500/30 bg-amber-500/12 text-foreground hover:bg-amber-500/18"
  }
  return "border-rose-500/30 bg-rose-500/12 text-foreground hover:bg-rose-500/18"
}

export function AdminCalendarPanel({
  locale,
  tenantSlug,
  session,
  tz,
}: Readonly<CalendarPanelProps>) {
  const t = useTranslations("adminCore")
  const [weekStart, setWeekStart] = useState(() => getInitialWeekStart(tz))
  const [selectedStaffId, setSelectedStaffId] = useState(() =>
    session.role === "staff" ? (session.staffId ?? "") : "all"
  )
  const weekRange = useMemo(() => getWeekRange(weekStart, tz), [weekStart, tz])
  const weekDays = useMemo(() => getWeekDays(weekStart, locale, tz), [locale, tz, weekStart])
  const timeLabels = useMemo(() => buildTimeLabels(), [])

  const bookingsQuery = useQuery({
    queryKey: ["bookings", tenantSlug],
    queryFn: async () => {
      const result = await listBookings(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const staffQuery = useQuery({
    queryKey: queryKeys.staff(tenantSlug),
    queryFn: async () => {
      const result = await listStaff(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const eventsQuery = useQuery({
    queryKey: queryKeys.calendarEvents(
      tenantSlug,
      weekRange.startAt,
      weekRange.endAt,
      session.role === "staff" ? (session.staffId ?? "own") : selectedStaffId
    ),
    queryFn: async () => {
      const result = await listCalendarEvents({
        tenantSlug,
        startAt: weekRange.startAt,
        endAt: weekRange.endAt,
        staffId:
          session.role === "staff"
            ? (session.staffId ?? undefined)
            : selectedStaffId === "all"
              ? undefined
              : selectedStaffId,
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  const staffOptions = useMemo(
    () => getVisibleStaff(staffQuery.data ?? [], session),
    [session, staffQuery.data]
  )

  const calendarItems = useMemo(() => {
    const scopedBookings = filterScopedBookings(bookingsQuery.data ?? [], session)
      .filter((booking) => booking.status !== "cancelled")
      .filter((booking) => booking.startAt < weekRange.endAt && booking.endAt > weekRange.startAt)
      .filter((booking) =>
        session.role === "staff"
          ? booking.staffId === session.staffId
          : selectedStaffId === "all"
            ? true
            : booking.staffId === selectedStaffId
      )

    const scopedEvents = filterScopedEvents(eventsQuery.data ?? [], session)

    return normalizeCalendarItems(scopedBookings, scopedEvents)
  }, [bookingsQuery.data, eventsQuery.data, selectedStaffId, session, weekRange.endAt, weekRange.startAt])

  const itemsByDay = useMemo(() => {
    return weekDays.reduce<Record<string, typeof calendarItems>>((accumulator, day) => {
      accumulator[day.dateKey] = calendarItems.filter((item) => getItemDateKey(item, tz) === day.dateKey)
      return accumulator
    }, {})
  }, [calendarItems, tz, weekDays])

  const isLoading = bookingsQuery.isLoading || staffQuery.isLoading || eventsQuery.isLoading
  const isError = bookingsQuery.isError || staffQuery.isError || eventsQuery.isError

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-1">
            <CardTitle>{t("calendar.title")}</CardTitle>
            <CardDescription>{t("calendar.description")}</CardDescription>
          </div>
          <div className="grid gap-3 lg:flex lg:items-center">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setWeekStart((current) => shiftWeek(current, -1))}>
                {t("calendar.previousWeek")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setWeekStart(getInitialWeekStart(tz))}>
                {t("calendar.today")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setWeekStart((current) => shiftWeek(current, 1))}>
                {t("calendar.nextWeek")}
              </Button>
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-medium">{t("calendar.staffFilter")}</span>
              <select
                value={session.role === "staff" ? (session.staffId ?? "") : selectedStaffId}
                onChange={(event) => setSelectedStaffId(event.target.value)}
                disabled={session.role === "staff"}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {session.role === "owner" ? <option value="all">{t("calendar.allStaff")}</option> : null}
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{formatWeekRangeLabel(weekStart, locale)}</span>
            <Badge>{t("calendar.legendBookings")}</Badge>
            <Badge className="border-amber-500/40 bg-amber-500/12 text-foreground hover:bg-amber-500/12">
              {t("calendar.legendBlocked")}
            </Badge>
            <Badge className="border-rose-500/40 bg-rose-500/12 text-foreground hover:bg-rose-500/12">
              {t("calendar.legendTimeOff")}
            </Badge>
          </div>

          {isLoading ? <p className="text-sm text-muted-foreground">{t("calendar.loading")}</p> : null}
          {isError ? <p className="text-sm text-destructive">{t("calendar.loadFailed")}</p> : null}

          {!isLoading && !isError ? (
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-border">
                  <div />
                  {weekDays.map((day) => (
                    <div
                      key={day.dateKey}
                      className={`border-l border-border px-3 py-2 text-sm font-medium ${
                        day.isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      {day.label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
                  <div className="relative">
                    {timeLabels.slice(0, -1).map((label, index) => (
                      <div
                        key={label}
                        className="border-b border-border/80 pr-3 text-right text-xs text-muted-foreground"
                        style={{ height: CALENDAR_ROW_HEIGHT }}
                      >
                        {index % 2 === 0 ? label : ""}
                      </div>
                    ))}
                  </div>

                  {weekDays.map((day) => (
                    <div key={day.dateKey} className={`relative border-l border-border ${day.isToday ? "bg-primary/5" : ""}`}>
                      {timeLabels.slice(0, -1).map((label) => (
                        <div key={label} className="border-b border-border/80" style={{ height: CALENDAR_ROW_HEIGHT }} />
                      ))}

                      <div className="pointer-events-none absolute inset-0 p-1">
                        {(itemsByDay[day.dateKey] ?? []).map((item) => {
                          const visibleItem = clampItemToVisibleHours(item, day.dateKey, tz)
                          if (!visibleItem) return null

                          const positionedItem = {
                            ...item,
                            startAt: visibleItem.startAt,
                            endAt: visibleItem.endAt,
                          }
                          const { top, height } = getItemPosition(positionedItem, tz)

                          return (
                            <div
                              key={item.id}
                              className={`absolute left-1 right-1 rounded-md border px-2 py-1 text-left shadow-sm ${itemClassName(
                                item.type
                              )}`}
                              style={{ top, height }}
                            >
                              <p className="truncate text-xs font-semibold">{item.title}</p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {formatItemTimeLabel(positionedItem, tz)}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {!isLoading && !isError && calendarItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("calendar.emptyWeek")}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
