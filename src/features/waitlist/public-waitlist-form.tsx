"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { formatInTimeZone } from "date-fns-tz"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createWaitlistEntry } from "@/lib/app/client"
import { useServices } from "@/lib/query/hooks/use-services"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"

interface PublicWaitlistFormProps {
  tenantSlug: string
  t: {
    title: string
    description: string
    service: string
    date: string
    timeWindow: string
    note: string
    name: string
    email: string
    phone: string
    submit: string
    submitLoading: string
    required: string
    invalidEmail: string
    successTitle: string
    successDescription: string
    timeAny: string
    timeMorning: string
    timeAfternoon: string
    timeEvening: string
    error: string
    servicePlaceholder: string
  }
}

type FormValues = {
  serviceId: string
  preferredDate: string
  preferredTimeLabel: string
  note: string
  name: string
  email: string
  phone: string
}

export function PublicWaitlistForm({ tenantSlug, t }: Readonly<PublicWaitlistFormProps>) {
  const servicesQuery = useServices(tenantSlug)
  const tenantConfigQuery = useTenantConfig(tenantSlug)
  const timezone = tenantConfigQuery.data?.timezone ?? "Europe/Prague"

  const schema = useMemo(
    () =>
      z.object({
        serviceId: z.string().min(1, t.required),
        preferredDate: z.string().min(1, t.required),
        preferredTimeLabel: z.string().min(1, t.required),
        note: z.string().max(1000).optional().default(""),
        name: z.string().trim().min(1, t.required),
        email: z.string().trim().email(t.invalidEmail),
        phone: z.string().trim().min(6, t.required),
      }),
    [t.invalidEmail, t.required]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      serviceId: "",
      preferredDate: formatInTimeZone(new Date(), timezone, "yyyy-MM-dd"),
      preferredTimeLabel: "anytime",
      note: "",
      name: "",
      email: "",
      phone: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const result = await createWaitlistEntry({
        tenantSlug,
        serviceId: values.serviceId,
        preferredDate: values.preferredDate,
        preferredTimeLabel: values.preferredTimeLabel,
        note: values.note,
        customerName: values.name,
        email: values.email,
        phone: values.phone,
      })
      if (!result.ok) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: () => {
      form.reset({
        serviceId: "",
        preferredDate: formatInTimeZone(new Date(), timezone, "yyyy-MM-dd"),
        preferredTimeLabel: "anytime",
        note: "",
        name: "",
        email: "",
        phone: "",
      })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {mutation.isSuccess ? (
          <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium">{t.successTitle}</p>
            <p className="mt-1 text-muted-foreground">{t.successDescription}</p>
          </div>
        ) : null}

        {mutation.isError ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {t.error}
          </div>
        ) : null}

        <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div className="grid gap-2">
            <Label htmlFor="waitlist-service">{t.service}</Label>
            <select
              id="waitlist-service"
              data-testid="waitlist-service"
              {...form.register("serviceId")}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t.servicePlaceholder}</option>
              {(servicesQuery.data ?? []).map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            {form.formState.errors.serviceId ? (
              <p className="text-xs text-destructive">{form.formState.errors.serviceId.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="waitlist-date">{t.date}</Label>
              <Input id="waitlist-date" data-testid="waitlist-date" type="date" {...form.register("preferredDate")} />
              {form.formState.errors.preferredDate ? (
                <p className="text-xs text-destructive">{form.formState.errors.preferredDate.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="waitlist-window">{t.timeWindow}</Label>
              <select
                id="waitlist-window"
                data-testid="waitlist-window"
                {...form.register("preferredTimeLabel")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="anytime">{t.timeAny}</option>
                <option value="morning">{t.timeMorning}</option>
                <option value="afternoon">{t.timeAfternoon}</option>
                <option value="evening">{t.timeEvening}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="waitlist-note">{t.note}</Label>
            <textarea
              id="waitlist-note"
              {...form.register("note")}
              className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="waitlist-name">{t.name}</Label>
              <Input id="waitlist-name" data-testid="waitlist-name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="waitlist-email">{t.email}</Label>
              <Input id="waitlist-email" data-testid="waitlist-email" type="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="waitlist-phone">{t.phone}</Label>
              <Input id="waitlist-phone" data-testid="waitlist-phone" {...form.register("phone")} />
              {form.formState.errors.phone ? (
                <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
              ) : null}
            </div>
          </div>

          <Button type="submit" data-testid="waitlist-submit" disabled={mutation.isPending || servicesQuery.isLoading}>
            {mutation.isPending ? t.submitLoading : t.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
