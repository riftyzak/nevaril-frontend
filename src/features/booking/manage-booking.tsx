"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatInTimeZone } from "date-fns-tz"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { type AppLocale } from "@/i18n/locales"
import { cancelBooking, getBookingByToken } from "@/lib/api"
import { canModifyBooking } from "@/lib/booking/policy"
import { useGtm } from "@/lib/gtm/useGtm"
import { useService } from "@/lib/query/hooks/use-service"
import { useStaff } from "@/lib/query/hooks/use-staff"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"
import { tenantUrl } from "@/lib/tenant/tenant-url"

interface ManageBookingProps {
  locale: AppLocale
  bookingToken: string
  tenantSlugHint: string
  t: {
    loading: string
    notFound: string
    title: string
    description: string
    policyBanner: string
    policyBlocked: string
    service: string
    variant: string
    durationUnit: string
    staff: string
    date: string
    customer: string
    status: string
    reschedule: string
    cancel: string
    canceledState: string
    noStaff: string
    cancelDialogTitle: string
    cancelDialogDescription: string
    close: string
    confirmCancel: string
    cancelSuccess: string
    cancelConflict: string
    cancelForbidden: string
    cancelError: string
  }
}

export function ManageBooking({
  locale,
  bookingToken,
  tenantSlugHint,
  t,
}: Readonly<ManageBookingProps>) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const openedForBookingIdRef = useRef<string | null>(null)
  const queryClient = useQueryClient()
  const { pushEvent } = useGtm()

  const bookingQuery = useQuery({
    queryKey: ["booking-token", bookingToken],
    queryFn: async () => {
      const result = await getBookingByToken(bookingToken, tenantSlugHint)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  const tenantSlug = bookingQuery.data?.tenantSlug ?? tenantSlugHint
  const tenantConfigQuery = useTenantConfig(tenantSlug)
  const serviceQuery = useService(tenantSlug, bookingQuery.data?.serviceId ?? "")
  const staffQuery = useStaff(tenantSlug)
  const timezone = tenantConfigQuery.data?.timezone ?? bookingQuery.data?.timezone ?? "Europe/Prague"

  useEffect(() => {
    const booking = bookingQuery.data
    if (!booking || openedForBookingIdRef.current === booking.id) return
    openedForBookingIdRef.current = booking.id
    pushEvent("open_manage_booking", {
      bookingId: booking.id,
      token: booking.bookingToken,
    })
  }, [bookingQuery.data, pushEvent])

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!bookingQuery.data) {
        throw new Error("MISSING_BOOKING")
      }
      const result = await cancelBooking({
        tenantSlug: bookingQuery.data.tenantSlug,
        bookingId: bookingQuery.data.id,
        expectedUpdatedAt: bookingQuery.data.updatedAt,
      })
      if (!result.ok) {
        const error = new Error(result.error.message)
        ;(error as Error & { code?: string }).code = result.error.code
        throw error
      }
      return result.data
    },
    onSuccess: async (booking) => {
      setConfirmOpen(false)
      setActionError(null)
      setActionSuccess(t.cancelSuccess)
      pushEvent("cancel_booking", {
        bookingId: booking.id,
      })
      await queryClient.invalidateQueries({ queryKey: ["booking-token", bookingToken] })
    },
    onError: (error) => {
      const code = (error as Error & { code?: string }).code
      if (code === "FORBIDDEN") {
        setActionError(t.cancelForbidden)
        return
      }
      if (code === "CONFLICT") {
        setActionError(t.cancelConflict)
        return
      }
      setActionError(t.cancelError)
    },
  })

  if (bookingQuery.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t.loading}</CardContent>
      </Card>
    )
  }

  if (!bookingQuery.data) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t.notFound}</CardContent>
      </Card>
    )
  }

  const booking = bookingQuery.data
  const staffName = staffQuery.data?.find((staff) => staff.id === booking.staffId)?.fullName
  const canModify = canModifyBooking(new Date(), booking.startAt, timezone, 24)
  const isCancelled = booking.status === "cancelled"

  const rescheduleHref = `${tenantUrl({
    locale,
    tenantSlug: booking.tenantSlug,
    path: `/book/${booking.serviceId}/slot`,
  })}?mode=manage&token=${encodeURIComponent(booking.bookingToken)}&bookingId=${encodeURIComponent(
    booking.id
  )}&variant=${booking.serviceVariant}${booking.staffId ? `&staffId=${encodeURIComponent(booking.staffId)}` : ""}&date=${encodeURIComponent(
    formatInTimeZone(new Date(booking.startAt), timezone, "yyyy-MM-dd")
  )}&startAt=${encodeURIComponent(booking.startAt)}`

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="rounded-md border border-border bg-muted/40 p-3">{t.policyBanner}</div>
          {!canModify && !isCancelled ? (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-muted-foreground">
              {t.policyBlocked}
            </div>
          ) : null}

          <p>
            <span className="text-muted-foreground">{t.service}: </span>
            {serviceQuery.data?.name ?? booking.serviceId}
          </p>
          <p>
            <span className="text-muted-foreground">{t.variant}: </span>
            {booking.serviceVariant} {t.durationUnit}
          </p>
          <p>
            <span className="text-muted-foreground">{t.staff}: </span>
            {staffName ?? t.noStaff}
          </p>
          <p>
            <span className="text-muted-foreground">{t.date}: </span>
            {formatInTimeZone(new Date(booking.startAt), timezone, "yyyy-MM-dd HH:mm")}
          </p>
          <p>
            <span className="text-muted-foreground">{t.customer}: </span>
            {booking.customerName}
          </p>
          <p>
            <span className="text-muted-foreground">{t.status}: </span>
            {isCancelled ? t.canceledState : booking.status}
          </p>

          {actionError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          ) : null}
          {actionSuccess ? (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">{actionSuccess}</div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={rescheduleHref}
              data-testid="manage-reschedule-link"
              aria-disabled={!canModify || isCancelled}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              {t.reschedule}
            </Link>
            <Button
              type="button"
              data-testid="manage-cancel-button"
              variant="outline"
              disabled={!canModify || isCancelled || cancelMutation.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {t.cancel}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.cancelDialogTitle}</DialogTitle>
            <DialogDescription>{t.cancelDialogDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              {t.close}
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-testid="manage-confirm-cancel"
              onClick={() => {
                setActionError(null)
                setActionSuccess(null)
                cancelMutation.mutate()
              }}
              disabled={cancelMutation.isPending}
            >
              {t.confirmCancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
