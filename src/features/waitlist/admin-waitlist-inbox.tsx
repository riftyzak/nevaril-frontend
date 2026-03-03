"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatInTimeZone } from "date-fns-tz"
import { useMemo, useState } from "react"
import { toast } from "sonner"

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
import {
  assignWaitlistToSlot,
  getAvailability,
  listWaitlist,
} from "@/lib/api"
import { type ServiceVariant, type WaitlistEntry } from "@/lib/api/types"
import { queryKeys } from "@/lib/query/keys"
import { useServices } from "@/lib/query/hooks/use-services"
import { useStaff } from "@/lib/query/hooks/use-staff"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"

interface AdminWaitlistInboxProps {
  tenantSlug: string
  t: {
    title: string
    description: string
    filterService: string
    filterStatus: string
    allServices: string
    allStatuses: string
    statusNew: string
    statusAssigned: string
    statusCancelled: string
    empty: string
    colCustomer: string
    colService: string
    colPreferred: string
    colCreated: string
    colStatus: string
    colAction: string
    assignAction: string
    assignedLabel: string
    openAssignTitle: string
    openAssignDescription: string
    staff: string
    anyStaff: string
    date: string
    duration: string
    minutesUnit: string
    availableSlots: string
    noSlots: string
    slotLoading: string
    selectSlot: string
    close: string
    confirm: string
    confirmLoading: string
    successToast: string
    wouldSendTitle: string
    wouldSendEmail: string
    wouldSendSms: string
    assignError: string
  }
}

export function AdminWaitlistInbox({ tenantSlug, t }: Readonly<AdminWaitlistInboxProps>) {
  const queryClient = useQueryClient()
  const [selectedService, setSelectedService] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [activeEntry, setActiveEntry] = useState<WaitlistEntry | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedDuration, setSelectedDuration] = useState<ServiceVariant>(60)
  const [selectedStartAt, setSelectedStartAt] = useState("")
  const [notificationPreview, setNotificationPreview] = useState<{
    email: string
    sms: string
  } | null>(null)

  const waitlistQuery = useQuery({
    queryKey: queryKeys.waitlist(tenantSlug),
    queryFn: async () => {
      const result = await listWaitlist(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const servicesQuery = useServices(tenantSlug)
  const staffQuery = useStaff(tenantSlug)
  const tenantConfigQuery = useTenantConfig(tenantSlug)
  const timezone = tenantConfigQuery.data?.timezone ?? "Europe/Prague"

  const filteredEntries = useMemo(() => {
    const entries = waitlistQuery.data ?? []
    return entries.filter((entry) => {
      const serviceMatch = selectedService === "all" || entry.serviceId === selectedService
      const statusMatch = selectedStatus === "all" || entry.status === selectedStatus
      return serviceMatch && statusMatch
    })
  }, [selectedService, selectedStatus, waitlistQuery.data])

  const activeService = useMemo(
    () => servicesQuery.data?.find((service) => service.id === activeEntry?.serviceId),
    [activeEntry?.serviceId, servicesQuery.data]
  )
  const serviceDurations = activeService?.durationOptions ?? [30, 60, 90]

  const slotQuery = useQuery({
    queryKey: queryKeys.availability(
      tenantSlug,
      activeEntry?.serviceId ?? "",
      selectedDuration,
      selectedStaffId || "any",
      selectedDate
    ),
    queryFn: async () => {
      if (!activeEntry || !selectedDate) return []
      const result = await getAvailability({
        tenantSlug,
        serviceId: activeEntry.serviceId,
        serviceVariant: selectedDuration,
        date: selectedDate,
        staffId: selectedStaffId || undefined,
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data.filter((slot) => slot.status === "available")
    },
    enabled: Boolean(activeEntry && selectedDate),
  })

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!activeEntry || !selectedStartAt) {
        throw new Error("MISSING_ASSIGN_DATA")
      }
      const result = await assignWaitlistToSlot({
        tenantSlug,
        waitlistId: activeEntry.id,
        expectedUpdatedAt: activeEntry.updatedAt,
        serviceId: activeEntry.serviceId,
        staffId: selectedStaffId || undefined,
        startAt: selectedStartAt,
        duration: selectedDuration,
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      if (!activeEntry) return
      const startLabel = formatInTimeZone(new Date(selectedStartAt), timezone, "yyyy-MM-dd HH:mm")
      setNotificationPreview({
        email: `${t.wouldSendEmail}: ${activeEntry.email} (${startLabel})`,
        sms: `${t.wouldSendSms}: ${activeEntry.phone} (${startLabel})`,
      })
      toast.success(t.successToast)
      setActiveEntry(null)
      setSelectedStartAt("")
      await queryClient.invalidateQueries({ queryKey: queryKeys.waitlist(tenantSlug) })
      await queryClient.invalidateQueries({ queryKey: ["availability", tenantSlug] })
      await queryClient.invalidateQueries({ queryKey: ["bookings", tenantSlug] })
    },
    onError: () => {
      toast.error(t.assignError)
    },
  })

  const openAssign = (entry: WaitlistEntry) => {
    const service = servicesQuery.data?.find((item) => item.id === entry.serviceId)
    const duration = service?.durationOptions[0] ?? 60
    setActiveEntry(entry)
    setSelectedStaffId("")
    setSelectedDate(entry.preferredDate)
    setSelectedDuration(duration)
    setSelectedStartAt("")
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">{t.filterService}</span>
              <select
                value={selectedService}
                onChange={(event) => setSelectedService(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">{t.allServices}</option>
                {(servicesQuery.data ?? []).map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">{t.filterStatus}</span>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">{t.allStatuses}</option>
                <option value="new">{t.statusNew}</option>
                <option value="assigned">{t.statusAssigned}</option>
                <option value="cancelled">{t.statusCancelled}</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">{t.colCustomer}</th>
                  <th className="px-3 py-2">{t.colService}</th>
                  <th className="px-3 py-2">{t.colPreferred}</th>
                  <th className="px-3 py-2">{t.colCreated}</th>
                  <th className="px-3 py-2">{t.colStatus}</th>
                  <th className="px-3 py-2">{t.colAction}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-muted-foreground" colSpan={6}>
                      {t.empty}
                    </td>
                  </tr>
                ) : null}

                {filteredEntries.map((entry) => {
                  const serviceName =
                    servicesQuery.data?.find((service) => service.id === entry.serviceId)?.name ??
                    entry.serviceId
                  return (
                    <tr key={entry.id} className="border-t border-border">
                      <td data-testid={`waitlist-status-${entry.id}`} className="px-3 py-2">
                        <p className="font-medium">{entry.customerName}</p>
                        <p className="text-xs text-muted-foreground">{entry.email}</p>
                        <p className="text-xs text-muted-foreground">{entry.phone}</p>
                      </td>
                      <td className="px-3 py-2">{serviceName}</td>
                      <td className="px-3 py-2">
                        {entry.preferredDate} ({entry.preferredTimeLabel})
                      </td>
                      <td className="px-3 py-2">
                        {formatInTimeZone(new Date(entry.createdAt), timezone, "yyyy-MM-dd HH:mm")}
                      </td>
                      <td className="px-3 py-2">
                        {entry.status === "new"
                          ? t.statusNew
                          : entry.status === "assigned"
                            ? t.statusAssigned
                            : t.statusCancelled}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          size="sm"
                          data-testid={`waitlist-assign-${entry.id}`}
                          disabled={entry.status !== "new"}
                          onClick={() => openAssign(entry)}
                        >
                          {entry.status === "new" ? t.assignAction : t.assignedLabel}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {notificationPreview ? (
            <div data-testid="waitlist-notification-preview" className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{t.wouldSendTitle}</p>
              <p className="mt-1 text-muted-foreground">{notificationPreview.email}</p>
              <p className="text-muted-foreground">{notificationPreview.sms}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(activeEntry)} onOpenChange={(open) => (!open ? setActiveEntry(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.openAssignTitle}</DialogTitle>
            <DialogDescription>{t.openAssignDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">{t.staff}</span>
              <select
                data-testid="waitlist-assign-staff"
                value={selectedStaffId}
                onChange={(event) => setSelectedStaffId(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t.anyStaff}</option>
                {(staffQuery.data ?? []).map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">{t.date}</span>
                <input
                  type="date"
                  data-testid="waitlist-assign-date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">{t.duration}</span>
                <select
                  data-testid="waitlist-assign-duration"
                  value={selectedDuration}
                  onChange={(event) => setSelectedDuration(Number(event.target.value) as ServiceVariant)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {serviceDurations.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration} {t.minutesUnit}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-1 text-sm">
              <span className="text-muted-foreground">{t.availableSlots}</span>
              {slotQuery.isLoading ? (
                <p>{t.slotLoading}</p>
              ) : slotQuery.data && slotQuery.data.length > 0 ? (
                <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto rounded-md border border-border p-2">
                  {slotQuery.data.map((slot) => {
                    const label = formatInTimeZone(new Date(slot.startAt), timezone, "HH:mm")
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        data-testid={`waitlist-slot-${slot.id}`}
                        onClick={() => setSelectedStartAt(slot.startAt)}
                        className={`h-9 rounded-md border text-sm ${
                          selectedStartAt === slot.startAt
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">{t.noSlots}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActiveEntry(null)}>
              {t.close}
            </Button>
            <Button
              type="button"
              data-testid="waitlist-assign-confirm"
              onClick={() => assignMutation.mutate()}
              disabled={!selectedStartAt || assignMutation.isPending}
            >
              {assignMutation.isPending ? t.confirmLoading : t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
