"use client"

import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { formatInTimeZone } from "date-fns-tz"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type AppLocale } from "@/i18n/locales"
import { updateBooking } from "@/lib/app/client"
import { canModifyBooking } from "@/lib/booking/policy"
import { useGtm } from "@/lib/gtm/useGtm"
import { useBookingByToken } from "@/lib/query/hooks/use-booking-by-token"
import { useService } from "@/lib/query/hooks/use-service"
import { useStaff } from "@/lib/query/hooks/use-staff"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"
import { queryKeys } from "@/lib/query/keys"
import { localePath, tenantUrl } from "@/lib/tenant/tenant-url"

type ConfirmationMode = "create" | "manage"

interface ConfirmationProps {
  locale: AppLocale
  tenantSlug: string
  token?: string
  serviceId?: string
  mode?: ConfirmationMode
  bookingId?: string
  startAt?: string
  date?: string
  variant?: string
  staffId?: string
  uiQuery?: string
  t: {
    missingToken: string
    loading: string
    notFound: string
    title: string
    description: string
    service: string
    variant: string
    durationUnit: string
    staff: string
    date: string
    customer: string
    addToCalendar: string
    newBooking: string
    noStaff: string
    manageBooking: string
    manageTitle: string
    manageDescription: string
    originalTime: string
    selectedTime: string
    confirmReschedule: string
    rescheduleSuccess: string
    rescheduleConflict: string
    reschedulePolicyBlocked: string
    rescheduleSubmitError: string
    backToSlots: string
    submitting: string
  }
}

export function Confirmation({
  locale,
  tenantSlug,
  token,
  serviceId,
  mode = "create",
  bookingId,
  startAt,
  date,
  variant,
  staffId,
  uiQuery,
  t,
}: Readonly<ConfirmationProps>) {
  const tc = useTranslations("booking.confirm")
  const router = useRouter()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const { pushEvent } = useGtm()
  const tenantConfigQuery = useTenantConfig(tenantSlug)
  const staffQuery = useStaff(tenantSlug)
  const bookingQuery = useBookingByToken(token ?? "", tenantSlug)

  const serviceQuery = useService(tenantSlug, serviceId ?? bookingQuery.data?.serviceId ?? "")
  const timezone = tenantConfigQuery.data?.timezone ?? bookingQuery.data?.timezone ?? "Europe/Prague"
  const policyHours = tenantConfigQuery.data?.cancellationPolicyHours ?? 24
  const policyBlockedText = tc("reschedulePolicyRule", { hours: policyHours })
  const effectiveMode: ConfirmationMode =
    mode === "manage" && bookingId && startAt ? "manage" : "create"

  const canRescheduleByPolicy = useMemo(() => {
    if (!bookingQuery.data) return false
    return canModifyBooking(new Date(), bookingQuery.data.startAt, timezone, policyHours)
  }, [bookingQuery.data, policyHours, timezone])

  const slotBackHref = useMemo(() => {
    const resolvedServiceId = bookingQuery.data?.serviceId ?? serviceId
    if (!resolvedServiceId) {
      return tenantUrl({ locale, tenantSlug, path: "/book" })
    }

    const params = new URLSearchParams()
    params.set("mode", "manage")
    params.set("token", String(token ?? ""))
    params.set("bookingId", String(bookingId ?? ""))
    params.set("variant", variant ?? String(bookingQuery.data?.serviceVariant ?? 60))
    params.set(
      "date",
      date ??
        (startAt
          ? formatInTimeZone(new Date(startAt), timezone, "yyyy-MM-dd")
          : formatInTimeZone(new Date(), timezone, "yyyy-MM-dd"))
    )
    params.set("startAt", startAt ?? bookingQuery.data?.startAt ?? "")
    if (staffId ?? bookingQuery.data?.staffId) {
      params.set("staffId", String(staffId ?? bookingQuery.data?.staffId ?? ""))
    }

    return `${tenantUrl({
      locale,
      tenantSlug,
      path: `/book/${resolvedServiceId}/slot`,
    })}?${params.toString()}${uiQuery ? `&${uiQuery}` : ""}`
  }, [
    bookingId,
    bookingQuery.data?.serviceId,
    bookingQuery.data?.serviceVariant,
    bookingQuery.data?.staffId,
    bookingQuery.data?.startAt,
    date,
    locale,
    serviceId,
    startAt,
    staffId,
    tenantSlug,
    timezone,
    token,
    variant,
    uiQuery,
  ])

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!bookingQuery.data || !bookingId || !startAt) {
        throw new Error("MISSING_DATA")
      }
      const result = await updateBooking({
        tenantSlug,
        bookingId,
        expectedUpdatedAt: bookingQuery.data.updatedAt,
        patch: {
          startAt,
          status: "rescheduled",
        },
      })
      if (!result.ok) {
        const error = new Error(result.error.message)
        ;(error as Error & { code?: string }).code = result.error.code
        throw error
      }
      return result.data
    },
    onSuccess: async (updatedBooking) => {
      pushEvent("reschedule_booking", {
        bookingId: updatedBooking.id,
        from: bookingQuery.data?.startAt,
        to: updatedBooking.startAt,
      })
      setSubmitSuccess(t.rescheduleSuccess)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.bookingToken(updatedBooking.tenantSlug, token ?? ""),
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.booking(updatedBooking.tenantSlug, updatedBooking.id),
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.bookings(updatedBooking.tenantSlug),
      })
      router.push(localePath({ locale, path: `/m/${token}` }))
    },
    onError: (error) => {
      const code = (error as Error & { code?: string }).code
      if (code === "CONFLICT") {
        setSubmitError(t.rescheduleConflict)
        return
      }
      if (code === "FORBIDDEN") {
        setSubmitError(policyBlockedText)
        return
      }
      setSubmitError(t.rescheduleSubmitError)
    },
  })

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t.missingToken}</CardContent>
      </Card>
    )
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{effectiveMode === "manage" ? t.manageTitle : t.title}</CardTitle>
        <CardDescription>
          {effectiveMode === "manage" ? t.manageDescription : t.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
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

        {effectiveMode === "manage" && startAt ? (
          <>
            <p>
              <span className="text-muted-foreground">{t.originalTime}: </span>
              {formatInTimeZone(new Date(booking.startAt), timezone, "yyyy-MM-dd HH:mm")}
            </p>
            <p>
              <span className="text-muted-foreground">{t.selectedTime}: </span>
              {formatInTimeZone(new Date(startAt), timezone, "yyyy-MM-dd HH:mm")}
            </p>
          </>
        ) : null}

        {submitError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <p>{submitError}</p>
            {submitError === t.rescheduleConflict ? (
              <Link href={slotBackHref} className="mt-1 inline-block underline-offset-4 hover:underline">
                {t.backToSlots}
              </Link>
            ) : null}
          </div>
        ) : null}

        {submitSuccess ? (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">{submitSuccess}</div>
        ) : null}

        {effectiveMode === "manage" && !canRescheduleByPolicy ? (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            {policyBlockedText}
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          {effectiveMode === "manage" && startAt ? (
            <Button
              type="button"
              data-testid="manage-confirm-reschedule"
              onClick={() => {
                setSubmitError(null)
                setSubmitSuccess(null)
                rescheduleMutation.mutate()
              }}
              disabled={rescheduleMutation.isPending || !canRescheduleByPolicy}
            >
              {rescheduleMutation.isPending ? t.submitting : t.confirmReschedule}
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline">
                {t.addToCalendar}
              </Button>
              <Link
                href={localePath({ locale, path: `/m/${booking.bookingToken}` })}
                data-testid="manage-booking-link"
                className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
              >
                {t.manageBooking}
              </Link>
              <Link
                href={`${tenantUrl({ locale, tenantSlug, path: "/book" })}${uiQuery ? `?${uiQuery}` : ""}`}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t.newBooking}
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
