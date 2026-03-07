"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatInTimeZone } from "date-fns-tz"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { listBookings, listCalendarEvents, listServices, listStaff, updateBooking, cancelBooking, updateCalendarEvent, deleteCalendarEvent } from "@/lib/api"
import { canModifyBooking } from "@/lib/booking/policy"
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

type SelectedItemRef =
  | { type: "booking"; id: string }
  | { type: CalendarEvent["type"]; id: string }

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
  const queryClient = useQueryClient()
  const [weekStart, setWeekStart] = useState(() => getInitialWeekStart(tz))
  const [selectedStaffId, setSelectedStaffId] = useState(() =>
    session.role === "staff" ? (session.staffId ?? "") : "all"
  )
  const [selectedItem, setSelectedItem] = useState<SelectedItemRef | null>(null)
  const [rescheduleAt, setRescheduleAt] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [eventStartAt, setEventStartAt] = useState("")
  const [eventEndAt, setEventEndAt] = useState("")
  const [eventNote, setEventNote] = useState("")

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
  const servicesQuery = useQuery({
    queryKey: queryKeys.services(tenantSlug),
    queryFn: async () => {
      const result = await listServices(tenantSlug)
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

  const selectedCalendarItem = useMemo(() => {
    if (!selectedItem) return null
    return calendarItems.find((item) => item.id === selectedItem.id && item.type === selectedItem.type) ?? null
  }, [calendarItems, selectedItem])

  const selectedBooking = selectedCalendarItem?.type === "booking" ? selectedCalendarItem.booking : null
  const selectedEvent =
    selectedCalendarItem && selectedCalendarItem.type !== "booking"
      ? selectedCalendarItem.event
      : null

  const selectedService = servicesQuery.data?.find((service) => service.id === selectedBooking?.serviceId)
  const selectedStaff = staffQuery.data?.find((staff) =>
    staff.id === (selectedBooking?.staffId ?? selectedEvent?.staffId ?? "")
  )
  const canManageSelectedBooking = Boolean(
    selectedBooking &&
      (session.role === "owner" || selectedBooking.staffId === session.staffId)
  )
  const canManageSelectedEvent = Boolean(
    selectedEvent &&
      (session.role === "owner" || selectedEvent.staffId === session.staffId)
  )
  const policyAllowsBookingChange = Boolean(
    selectedBooking && canModifyBooking(new Date(), selectedBooking.startAt, tz, 24)
  )

  function openItemPanel(item: (typeof calendarItems)[number]) {
    setSelectedItem({ id: item.id, type: item.type })

    if (item.type === "booking") {
      setRescheduleAt(formatInTimeZone(new Date(item.booking.startAt), tz, "yyyy-MM-dd'T'HH:mm"))
      setEventTitle("")
      setEventStartAt("")
      setEventEndAt("")
      setEventNote("")
      return
    }

    setRescheduleAt("")
    setEventTitle(item.event.title)
    setEventStartAt(formatInTimeZone(new Date(item.event.startAt), tz, "yyyy-MM-dd'T'HH:mm"))
    setEventEndAt(formatInTimeZone(new Date(item.event.endAt), tz, "yyyy-MM-dd'T'HH:mm"))
    setEventNote(item.event.note ?? "")
  }

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking || !rescheduleAt) throw new Error("Missing booking/start")
      const result = await updateBooking({
        tenantSlug,
        bookingId: selectedBooking.id,
        expectedUpdatedAt: selectedBooking.updatedAt,
        patch: {
          startAt: new Date(rescheduleAt).toISOString(),
          status: "rescheduled",
        },
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("calendar.detail.toastRescheduled"))
      await queryClient.invalidateQueries({ queryKey: ["bookings", tenantSlug] })
    },
    onError: () => toast.error(t("calendar.detail.toastRescheduleFailed")),
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) throw new Error("Missing booking")
      const result = await cancelBooking({
        tenantSlug,
        bookingId: selectedBooking.id,
        expectedUpdatedAt: selectedBooking.updatedAt,
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("calendar.detail.toastCanceled"))
      await queryClient.invalidateQueries({ queryKey: ["bookings", tenantSlug] })
      setSelectedItem(null)
    },
    onError: () => toast.error(t("calendar.detail.toastCancelFailed")),
  })

  const updateEventMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) throw new Error("Missing event")
      const result = await updateCalendarEvent({
        tenantSlug,
        eventId: selectedEvent.id,
        expectedUpdatedAt: selectedEvent.updatedAt,
        patch: {
          title: eventTitle,
          startAt: new Date(eventStartAt).toISOString(),
          endAt: new Date(eventEndAt).toISOString(),
          note: eventNote,
        },
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("calendar.detail.toastEventUpdated"))
      await queryClient.invalidateQueries({ queryKey: ["calendar-events", tenantSlug] })
    },
    onError: () => toast.error(t("calendar.detail.toastEventUpdateFailed")),
  })

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) throw new Error("Missing event")
      const result = await deleteCalendarEvent({
        tenantSlug,
        eventId: selectedEvent.id,
        expectedUpdatedAt: selectedEvent.updatedAt,
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("calendar.detail.toastEventDeleted"))
      await queryClient.invalidateQueries({ queryKey: ["calendar-events", tenantSlug] })
      setSelectedItem(null)
    },
    onError: () => toast.error(t("calendar.detail.toastEventDeleteFailed")),
  })

  const isLoading =
    bookingsQuery.isLoading || staffQuery.isLoading || servicesQuery.isLoading || eventsQuery.isLoading
  const isError =
    bookingsQuery.isError || staffQuery.isError || servicesQuery.isError || eventsQuery.isError

  return (
    <>
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

                        <div className="absolute inset-0 p-1">
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
                              <button
                                key={item.id}
                                type="button"
                                data-testid={`calendar-item-${item.id}`}
                                className={`absolute left-1 right-1 rounded-md border px-2 py-1 text-left shadow-sm ${itemClassName(
                                  item.type
                                )}`}
                                style={{ top, height }}
                                onClick={() => openItemPanel(item)}
                              >
                                <p className="truncate text-xs font-semibold">{item.title}</p>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {formatItemTimeLabel(positionedItem, tz)}
                                </p>
                              </button>
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

      <Dialog
        open={Boolean(selectedCalendarItem)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null)
            setRescheduleAt("")
            setEventTitle("")
            setEventStartAt("")
            setEventEndAt("")
            setEventNote("")
          }
        }}
      >
        <DialogContent
          className="top-0 right-0 left-auto h-screen max-w-[calc(100%-1rem)] translate-x-0 translate-y-0 rounded-none border-0 border-l p-0 sm:max-w-xl"
          showCloseButton
        >
          {selectedCalendarItem ? (
            <div data-testid="calendar-detail-panel" className="grid h-full grid-rows-[auto_1fr_auto]">
              <DialogHeader className="border-b border-border px-6 py-5">
                <DialogTitle>
                  {selectedBooking ? selectedBooking.customerName : selectedEvent?.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedBooking ? t("calendar.detail.bookingDescription") : t("calendar.detail.eventDescription")}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 overflow-y-auto px-6 py-5">
                {selectedBooking ? (
                  <>
                    <div className="grid gap-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">{t("calendar.detail.service")}: </span>
                        {selectedService?.name ?? selectedBooking.serviceId}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("calendar.detail.staff")}: </span>
                        {selectedStaff?.fullName ?? t("calendar.detail.unassigned")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("calendar.detail.time")}: </span>
                        {formatInTimeZone(new Date(selectedBooking.startAt), tz, "yyyy-MM-dd HH:mm")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("calendar.detail.status")}: </span>
                        {selectedBooking.status}
                      </p>
                    </div>

                    {!canManageSelectedBooking ? (
                      <p className="text-sm text-muted-foreground">{t("calendar.detail.ownOnly")}</p>
                    ) : null}
                    {!policyAllowsBookingChange ? (
                      <p className="text-sm text-muted-foreground">{t("calendar.detail.policy")}</p>
                    ) : null}

                    <div className="grid gap-2">
                      <label className="text-sm font-medium" htmlFor="calendar-booking-reschedule">
                        {t("calendar.detail.newTime")}
                      </label>
                      <Input
                        id="calendar-booking-reschedule"
                        type="datetime-local"
                        value={rescheduleAt}
                        onChange={(event) => setRescheduleAt(event.target.value)}
                      />
                    </div>
                  </>
                ) : selectedEvent ? (
                  <>
                    <div className="grid gap-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">{t("calendar.detail.type")}: </span>
                        {selectedEvent.type === "blocked"
                          ? t("calendar.legendBlocked")
                          : t("calendar.legendTimeOff")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("calendar.detail.staff")}: </span>
                        {selectedStaff?.fullName ?? t("calendar.detail.unassigned")}
                      </p>
                    </div>

                    {!canManageSelectedEvent ? (
                      <p className="text-sm text-muted-foreground">{t("calendar.detail.ownOnly")}</p>
                    ) : null}

                    <div className="grid gap-2">
                      <label className="text-sm font-medium" htmlFor="calendar-event-title">
                        {t("calendar.detail.titleLabel")}
                      </label>
                      <Input
                        id="calendar-event-title"
                        value={eventTitle}
                        onChange={(event) => setEventTitle(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="calendar-event-start">
                          {t("calendar.detail.start")}
                        </label>
                        <Input
                          id="calendar-event-start"
                          type="datetime-local"
                          value={eventStartAt}
                          onChange={(event) => setEventStartAt(event.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="calendar-event-end">
                          {t("calendar.detail.end")}
                        </label>
                        <Input
                          id="calendar-event-end"
                          type="datetime-local"
                          value={eventEndAt}
                          onChange={(event) => setEventEndAt(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium" htmlFor="calendar-event-note">
                        {t("calendar.detail.note")}
                      </label>
                      <textarea
                        id="calendar-event-note"
                        value={eventNote}
                        onChange={(event) => setEventNote(event.target.value)}
                        className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                ) : null}
              </div>

              <DialogFooter className="border-t border-border px-6 py-4">
                {selectedBooking ? (
                  <>
                    <Button
                      type="button"
                      data-testid="calendar-booking-cancel"
                      variant="outline"
                      disabled={!canManageSelectedBooking || !policyAllowsBookingChange || cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate()}
                    >
                      {t("calendar.detail.cancel")}
                    </Button>
                    <Button
                      type="button"
                      data-testid="calendar-booking-reschedule"
                      disabled={
                        !canManageSelectedBooking ||
                        !policyAllowsBookingChange ||
                        !rescheduleAt ||
                        rescheduleMutation.isPending
                      }
                      onClick={() => rescheduleMutation.mutate()}
                    >
                      {t("calendar.detail.reschedule")}
                    </Button>
                  </>
                ) : selectedEvent ? (
                  <>
                    <Button
                      type="button"
                      data-testid="calendar-event-delete"
                      variant="outline"
                      disabled={!canManageSelectedEvent || deleteEventMutation.isPending}
                      onClick={() => deleteEventMutation.mutate()}
                    >
                      {t("calendar.detail.delete")}
                    </Button>
                    <Button
                      type="button"
                      data-testid="calendar-event-save"
                      disabled={
                        !canManageSelectedEvent ||
                        !eventTitle ||
                        !eventStartAt ||
                        !eventEndAt ||
                        updateEventMutation.isPending
                      }
                      onClick={() => updateEventMutation.mutate()}
                    >
                      {t("calendar.detail.save")}
                    </Button>
                  </>
                ) : null}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
