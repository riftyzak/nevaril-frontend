"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatInTimeZone } from "date-fns-tz"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  cancelBooking,
  listBookings,
  listCustomers,
  listServices,
  listStaff,
  updateBooking,
  updateService,
  updateStaffNotes,
} from "@/lib/api"
import type { Booking, Customer } from "@/lib/api/types"
import { can } from "@/lib/auth/permissions"
import type { MockSession, TenantPermissionSettings } from "@/lib/auth/types"
import { canModifyBooking } from "@/lib/booking/policy"
import type { AppLocale } from "@/i18n/locales"
import { queryKeys } from "@/lib/query/keys"
import { adminAppPath } from "@/lib/tenant/tenant-url"

interface AdminBaseProps {
  locale: AppLocale
  tenantSlug: string
  session: MockSession
  tenantSettings: TenantPermissionSettings
  tz: string
}

function isOwnBooking(session: MockSession, booking: Booking) {
  return session.role === "owner" || booking.staffId === session.staffId
}

function filterBookingsByScope(bookings: Booking[], session: MockSession) {
  return session.role === "owner"
    ? bookings
    : bookings.filter((booking) => booking.staffId === session.staffId)
}

function filterCustomersByScope(
  customers: Customer[],
  bookings: Booking[],
  session: MockSession,
  tenantSettings: TenantPermissionSettings
) {
  if (session.role === "owner") return customers
  if (tenantSettings.customersVisibility === "all_readonly") return customers

  const ownCustomerIds = new Set(
    bookings
      .filter((booking) => booking.staffId === session.staffId)
      .map((booking) => booking.customerId)
  )
  return customers.filter((customer) => ownCustomerIds.has(customer.id))
}

export function DashboardPanel({ tz, tenantSlug, session }: AdminBaseProps) {
  const t = useTranslations("adminCore")
  const bookingsQuery = useQuery({
    queryKey: ["bookings", tenantSlug],
    queryFn: async () => {
      const result = await listBookings(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const bookings = filterBookingsByScope(bookingsQuery.data ?? [], session)
  const today = formatInTimeZone(new Date(), tz, "yyyy-MM-dd")
  const todayCount = bookings.filter((booking) => formatInTimeZone(new Date(booking.startAt), tz, "yyyy-MM-dd") === today).length
  const upcomingCount = bookings.filter((booking) => new Date(booking.startAt) > new Date()).length

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.todayBookings")}</CardTitle>
        </CardHeader>
        <CardContent>{todayCount}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.upcoming")}</CardTitle>
        </CardHeader>
        <CardContent>{upcomingCount}</CardContent>
      </Card>
    </div>
  )
}

export function CalendarPanel({ tenantSlug, session, tz }: AdminBaseProps) {
  const t = useTranslations("adminCore")
  const queryClient = useQueryClient()
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

  const activeStaff = useMemo(
    () =>
      session.role === "staff"
        ? staffQuery.data?.find((item) => item.id === session.staffId)
        : staffQuery.data?.[0],
    [session.role, session.staffId, staffQuery.data]
  )
  const [availabilityNote, setAvailabilityNote] = useState("")
  const [timeOffNote, setTimeOffNote] = useState("")

  const notesMutation = useMutation({
    mutationFn: async () => {
      if (!activeStaff) throw new Error("Missing staff")
      const result = await updateStaffNotes({
        tenantSlug,
        staffId: activeStaff.id,
        expectedUpdatedAt: activeStaff.updatedAt,
        patch: {
          availabilityNote,
          timeOffNote,
        },
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("calendar.toastUpdated"))
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff(tenantSlug) })
    },
  })

  const bookings = filterBookingsByScope(bookingsQuery.data ?? [], session)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("calendar.bookingsByDay")}</CardTitle>
          <CardDescription>{t("calendar.placeholder")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {bookings.slice(0, 10).map((booking) => (
            <div key={booking.id} className="rounded-md border border-border p-2">
              {formatInTimeZone(new Date(booking.startAt), tz, "yyyy-MM-dd HH:mm")} ({booking.status})
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{session.role === "staff" ? t("calendar.ownAvailability") : t("calendar.staffAvailability")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="availability-note">{t("calendar.availabilityBlocks")}</Label>
            <textarea
              id="availability-note"
              defaultValue={activeStaff?.availabilityNote ?? ""}
              onChange={(event) => setAvailabilityNote(event.target.value)}
              className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="time-off-note">{t("calendar.timeOff")}</Label>
            <textarea
              id="time-off-note"
              defaultValue={activeStaff?.timeOffNote ?? ""}
              onChange={(event) => setTimeOffNote(event.target.value)}
              className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="button" onClick={() => notesMutation.mutate()} disabled={!activeStaff || notesMutation.isPending}>
            {t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function BookingsListPanel({ locale, tenantSlug, session, tz }: AdminBaseProps) {
  const t = useTranslations("adminCore")
  const [search, setSearch] = useState("")
  const bookingsQuery = useQuery({
    queryKey: ["bookings", tenantSlug],
    queryFn: async () => {
      const result = await listBookings(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const bookings = useMemo(() => {
    const scoped = filterBookingsByScope(bookingsQuery.data ?? [], session)
    return scoped.filter((booking) => booking.customerName.toLowerCase().includes(search.toLowerCase()))
  }, [bookingsQuery.data, search, session])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("bookings.title")}</CardTitle>
        <CardDescription>{t("bookings.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("bookings.searchPlaceholder")} />
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2">{t("bookings.colCustomer")}</th>
                <th className="px-3 py-2">{t("bookings.colTime")}</th>
                <th className="px-3 py-2">{t("bookings.colStaff")}</th>
                <th className="px-3 py-2">{t("bookings.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link className="underline-offset-4 hover:underline" href={adminAppPath({ locale, tenantSlug, path: `/bookings/${booking.id}` })}>
                      {booking.customerName}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{formatInTimeZone(new Date(booking.startAt), tz, "yyyy-MM-dd HH:mm")}</td>
                  <td className="px-3 py-2">{booking.staffId ?? "-"}</td>
                  <td className="px-3 py-2">{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function BookingDetailPanel({
  locale,
  tenantSlug,
  session,
  tz,
  bookingId,
}: AdminBaseProps & { bookingId: string }) {
  const t = useTranslations("adminCore")
  const queryClient = useQueryClient()
  const [newStartAt, setNewStartAt] = useState("")
  const bookingQuery = useQuery({
    queryKey: ["bookings", tenantSlug],
    queryFn: async () => {
      const result = await listBookings(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data.find((item) => item.id === bookingId) ?? null
    },
  })

  const booking = bookingQuery.data
  const manageAllowed = booking ? isOwnBooking(session, booking) : false
  const policyAllowed = booking ? canModifyBooking(new Date(), booking.startAt, tz, 24) : false

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!booking || !newStartAt) throw new Error("Missing booking/start")
      const result = await updateBooking({
        tenantSlug,
        bookingId: booking.id,
        expectedUpdatedAt: booking.updatedAt,
        patch: {
          startAt: new Date(newStartAt).toISOString(),
          status: "rescheduled",
        },
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("bookingDetail.toastRescheduled"))
      await queryClient.invalidateQueries({ queryKey: ["bookings", tenantSlug] })
    },
    onError: () => toast.error(t("bookingDetail.toastRescheduleFailed")),
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("Missing booking")
      const result = await cancelBooking({
        tenantSlug,
        bookingId: booking.id,
        expectedUpdatedAt: booking.updatedAt,
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("bookingDetail.toastCanceled"))
      await queryClient.invalidateQueries({ queryKey: ["bookings", tenantSlug] })
    },
    onError: () => toast.error(t("bookingDetail.toastCancelFailed")),
  })

  if (!booking) {
    return (
      <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">{t("bookingDetail.notFound")}</CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{booking.customerName}</CardTitle>
          <CardDescription>{t("bookingDetail.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>{t("bookingDetail.time")}: {formatInTimeZone(new Date(booking.startAt), tz, "yyyy-MM-dd HH:mm")}</p>
          <p>{t("bookingDetail.status")}: {booking.status}</p>
          <p>{t("bookingDetail.staff")}: {booking.staffId ?? "-"}</p>
          <p>{t("bookingDetail.history")}</p>
          <p>
            <Link href={adminAppPath({ locale, tenantSlug, path: "/bookings" })} className="underline-offset-4 hover:underline">
              {t("bookingDetail.back")}
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("bookingDetail.actionsTitle")}</CardTitle>
          <CardDescription>{t("bookingDetail.actionsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {!manageAllowed ? <p className="text-sm text-muted-foreground">{t("bookingDetail.ownOnly")}</p> : null}
          {!policyAllowed ? <p className="text-sm text-muted-foreground">{t("bookingDetail.policy")}</p> : null}
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <Input type="datetime-local" value={newStartAt} onChange={(event) => setNewStartAt(event.target.value)} />
            <Button
              type="button"
              disabled={!manageAllowed || !policyAllowed || !newStartAt || rescheduleMutation.isPending}
              onClick={() => rescheduleMutation.mutate()}
            >
              {t("bookingDetail.reschedule")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!manageAllowed || !policyAllowed || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {t("bookingDetail.cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CustomersListPanel({ locale, tenantSlug, session, tenantSettings }: AdminBaseProps) {
  const t = useTranslations("adminCore")
  const [search, setSearch] = useState("")
  const customersQuery = useQuery({
    queryKey: ["customers", tenantSlug],
    queryFn: async () => {
      const result = await listCustomers(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const bookingsQuery = useQuery({
    queryKey: ["bookings", tenantSlug],
    queryFn: async () => {
      const result = await listBookings(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  const customers = useMemo(() => {
    const scoped = filterCustomersByScope(
      customersQuery.data ?? [],
      bookingsQuery.data ?? [],
      session,
      tenantSettings
    )
    return scoped.filter((item) => item.fullName.toLowerCase().includes(search.toLowerCase()))
  }, [bookingsQuery.data, customersQuery.data, search, session, tenantSettings])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("customers.title")}</CardTitle>
        <CardDescription>{session.role === "staff" ? t("customers.readOnly") : t("customers.ownerAccess")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("customers.searchPlaceholder")} />
        <div className="grid gap-2">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={adminAppPath({ locale, tenantSlug, path: `/customers/${customer.id}` })}
              className="rounded-md border border-border p-3 text-sm hover:bg-muted"
            >
              <p className="font-medium">{customer.fullName}</p>
              <p className="text-muted-foreground">{customer.email}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function CustomerDetailPanel({
  locale,
  tenantSlug,
  session,
  tenantSettings,
  customerId,
}: AdminBaseProps & { customerId: string }) {
  const t = useTranslations("adminCore")
  const customersQuery = useQuery({
    queryKey: ["customers", tenantSlug],
    queryFn: async () => {
      const result = await listCustomers(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const bookingsQuery = useQuery({
    queryKey: ["bookings", tenantSlug],
    queryFn: async () => {
      const result = await listBookings(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  const customer = customersQuery.data?.find((item) => item.id === customerId) ?? null
  const scopedCustomers = filterCustomersByScope(customersQuery.data ?? [], bookingsQuery.data ?? [], session, tenantSettings)
  const allowed = scopedCustomers.some((item) => item.id === customerId)
  const customerBookings = (bookingsQuery.data ?? []).filter((item) => item.customerId === customerId)

  if (!customer || !allowed) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t("customerDetail.notFound")}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{customer.fullName}</CardTitle>
        <CardDescription>{t("customerDetail.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <p>{t("customerDetail.email")}: {customer.email}</p>
        <p>{t("customerDetail.phone")}: {customer.phone}</p>
        <p>{t("customerDetail.visits")}: {customer.visits}</p>
        <p>{t("customerDetail.credit")}: {customer.creditCents / 100}</p>
        <p>{t("customerDetail.tags")}: {customer.tags.join(", ") || "-"}</p>
        <p>{t("customerDetail.bookingsTied")}: {customerBookings.length}</p>
        <Link href={adminAppPath({ locale, tenantSlug, path: "/customers" })} className="underline-offset-4 hover:underline">
          {t("customerDetail.back")}
        </Link>
      </CardContent>
    </Card>
  )
}

export function ServicesListPanel({ locale, tenantSlug, session, tenantSettings }: AdminBaseProps) {
  const t = useTranslations("adminCore")
  const servicesQuery = useQuery({
    queryKey: queryKeys.services(tenantSlug),
    queryFn: async () => {
      const result = await listServices(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const canUpdate = can(session, "services", "update", undefined, tenantSettings)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("services.title")}</CardTitle>
        <CardDescription>{canUpdate ? t("services.ownerCanEdit") : t("services.staffViewOnly")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {(servicesQuery.data ?? []).map((service) => (
          <Link
            key={service.id}
            data-testid={`admin-service-link-${service.id}`}
            href={adminAppPath({ locale, tenantSlug, path: `/services/${service.id}` })}
            className="rounded-md border border-border p-3 text-sm hover:bg-muted"
          >
            <p className="font-medium">{service.name}</p>
            <p className="text-muted-foreground">{service.description}</p>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

export function ServiceDetailPanel({
  locale,
  tenantSlug,
  session,
  tenantSettings,
  serviceId,
}: AdminBaseProps & { serviceId: string }) {
  const t = useTranslations("adminCore")
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [variants, setVariants] = useState<string>("30,60,90")

  const serviceQuery = useQuery({
    queryKey: queryKeys.service(tenantSlug, serviceId),
    queryFn: async () => {
      const result = await listServices(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data.find((item) => item.id === serviceId) ?? null
    },
  })

  const canUpdateService = can(session, "services", "update", undefined, tenantSettings)

  const updateMutation = useMutation({
    mutationFn: async () => {
      const service = serviceQuery.data
      if (!service) throw new Error("Service missing")
      const durationOptions = variants
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item): item is 30 | 60 | 90 => item === 30 || item === 60 || item === 90)
      const result = await updateService({
        tenantSlug,
        serviceId,
        expectedUpdatedAt: service.updatedAt,
        patch: {
          name: name || service.name,
          description: description || service.description,
          durationOptions: durationOptions.length > 0 ? durationOptions : service.durationOptions,
        },
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("serviceDetail.toastUpdated"))
      await queryClient.invalidateQueries({ queryKey: queryKeys.services(tenantSlug) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.service(tenantSlug, serviceId) })
    },
    onError: () => toast.error(t("serviceDetail.toastUpdateFailed")),
  })

  const service = serviceQuery.data
  if (!service) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t("serviceDetail.notFound")}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{service.name}</CardTitle>
        <CardDescription>{canUpdateService ? t("serviceDetail.edit") : t("serviceDetail.viewOnly")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="service-name">{t("serviceDetail.name")}</Label>
          <Input
            id="service-name"
            data-testid="admin-service-name"
            defaultValue={service.name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canUpdateService}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="service-description">{t("serviceDetail.descriptionLabel")}</Label>
          <textarea
            id="service-description"
            data-testid="admin-service-description"
            defaultValue={service.description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={!canUpdateService}
            className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="service-variants">{t("serviceDetail.variants")}</Label>
          <Input
            id="service-variants"
            defaultValue={service.durationOptions.join(",")}
            onChange={(event) => setVariants(event.target.value)}
            disabled={!canUpdateService}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            data-testid="admin-service-save"
            onClick={() => updateMutation.mutate()}
            disabled={!canUpdateService || updateMutation.isPending}
          >
            {t("common.save")}
          </Button>
          <Link
            href={adminAppPath({ locale, tenantSlug, path: "/services" })}
            className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm"
          >
            {t("common.back")}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function StaffPanel({ tenantSlug, session }: AdminBaseProps) {
  const t = useTranslations("adminCore")
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState("")
  const [availabilityNote, setAvailabilityNote] = useState("")
  const [timeOffNote, setTimeOffNote] = useState("")

  const staffQuery = useQuery({
    queryKey: queryKeys.staff(tenantSlug),
    queryFn: async () => {
      const result = await listStaff(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  const editableStaff = session.role === "owner" ? selectedId : session.staffId ?? ""
  const active = staffQuery.data?.find((item) => item.id === editableStaff)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("Missing staff")
      const result = await updateStaffNotes({
        tenantSlug,
        staffId: active.id,
        expectedUpdatedAt: active.updatedAt,
        patch: {
          availabilityNote,
          timeOffNote,
        },
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("staff.toastUpdated"))
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff(tenantSlug) })
    },
    onError: () => toast.error(t("staff.toastFailed")),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("staff.title")}</CardTitle>
          <CardDescription>{session.role === "owner" ? t("staff.ownerDescription") : t("staff.staffDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {(staffQuery.data ?? []).map((item) => (
            <div key={item.id} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">{item.fullName}</p>
              <p className="text-muted-foreground">{item.role}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("staff.editorTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {session.role === "owner" ? (
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("staff.selectStaff")}</option>
              {(staffQuery.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName}
                </option>
              ))}
            </select>
          ) : null}
          <textarea
            placeholder={t("staff.availability")}
            defaultValue={active?.availabilityNote ?? ""}
            onChange={(event) => setAvailabilityNote(event.target.value)}
            className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <textarea
            placeholder={t("staff.timeOff")}
            defaultValue={active?.timeOffNote ?? ""}
            onChange={(event) => setTimeOffNote(event.target.value)}
            className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button type="button" onClick={() => mutation.mutate()} disabled={!active || mutation.isPending}>
            {t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function OwnerOnlyPlaceholder({
  title,
  description,
  body,
}: {
  title: string
  description: string
  body: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
    </Card>
  )
}
