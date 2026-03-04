"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
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
import { type AppLocale } from "@/i18n/locales"
import { createBooking } from "@/lib/api"
import { type ServiceVariant } from "@/lib/api/types"
import { useGtm } from "@/lib/gtm/useGtm"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"
import { tenantUrl } from "@/lib/tenant/tenant-url"

interface DetailsFormProps {
  locale: AppLocale
  tenantSlug: string
  serviceId: string
  variant: ServiceVariant
  staffId?: string
  startAt: string
  date?: string
  uiQuery?: string
  t: {
    back: string
    title: string
    description: string
    name: string
    email: string
    phone: string
    submit: string
    slotConflict: string
    slotConflictAction: string
    submitError: string
    requiredField: string
    customFieldPrefix: string
    submitting: string
  }
}

type BookingDetailsValues = {
  name: string
  email: string
  phone: string
} & Record<string, string>

export function DetailsForm({
  locale,
  tenantSlug,
  serviceId,
  variant,
  staffId,
  startAt,
  date,
  uiQuery,
  t,
}: Readonly<DetailsFormProps>) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { pushEvent } = useGtm()
  const tenantConfigQuery = useTenantConfig(tenantSlug)

  const customFields = useMemo(
    () => tenantConfigQuery.data?.customFields ?? [],
    [tenantConfigQuery.data?.customFields]
  )

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {
      name: z.string().trim().min(1, t.requiredField),
      email: z.string().trim().email(t.requiredField),
      phone: z.string().trim().min(6, t.requiredField),
    }

    for (const field of customFields) {
      shape[field.id] = field.required
        ? z.string().trim().min(1, t.requiredField)
        : z.string().optional().default("")
    }

    return z.object(shape)
  }, [customFields, t.requiredField])

  const form = useForm<BookingDetailsValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      ...Object.fromEntries(customFields.map((field) => [field.id, ""])),
    },
  })

  const slotHref = `${tenantUrl({
    locale,
    tenantSlug,
    path: `/book/${serviceId}/slot`,
  })}?variant=${variant}${staffId ? `&staffId=${staffId}` : ""}${date ? `&date=${date}` : ""}${
    uiQuery ? `&${uiQuery}` : ""
  }`

  const mutation = useMutation({
    mutationFn: async (values: BookingDetailsValues) => {
      const customFieldValues = Object.fromEntries(
        customFields.map((field) => [field.id, String(values[field.id] ?? "")])
      )

      const result = await createBooking({
        tenantSlug,
        serviceId,
        serviceVariant: variant,
        staffId,
        startAt,
        customerId: `lead-${Date.now()}`,
        customerName: String(values.name ?? ""),
        customerEmail: String(values.email ?? ""),
        customerPhone: String(values.phone ?? ""),
        customFieldValues,
      })

      if (!result.ok) {
        const error = new Error(result.error.message)
        ;(error as Error & { code?: string }).code = result.error.code
        throw error
      }

      return result.data
    },
    onSuccess: (booking) => {
      pushEvent("booking_confirmed", {
        tenantSlug,
        bookingId: booking.id,
        token: booking.bookingToken,
      })
      router.push(
        `${tenantUrl({ locale, tenantSlug, path: "/book/confirmation" })}?token=${encodeURIComponent(
          booking.bookingToken
        )}&serviceId=${booking.serviceId}&variant=${variant}${staffId ? `&staffId=${encodeURIComponent(staffId)}` : ""}${
          date ? `&date=${encodeURIComponent(date)}` : ""
        }&startAt=${encodeURIComponent(startAt)}${uiQuery ? `&${uiQuery}` : ""}`
      )
    },
    onError: (error) => {
      const code = (error as Error & { code?: string }).code
      if (code === "CONFLICT") {
        setSubmitError(t.slotConflict)
        return
      }
      setSubmitError(t.submitError)
    },
  })

  return (
    <div className="grid gap-4">
      <Link href={slotHref} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        {t.back}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => {
              pushEvent("submit_booking", {
                tenantSlug,
                serviceId,
                duration: variant,
              })
              mutation.mutate(values)
            })}
          >
            <div className="grid gap-2">
              <Label htmlFor="booking-name">{t.name}</Label>
              <Input id="booking-name" data-testid="booking-name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="booking-email">{t.email}</Label>
              <Input id="booking-email" data-testid="booking-email" type="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="booking-phone">{t.phone}</Label>
              <Input id="booking-phone" data-testid="booking-phone" {...form.register("phone")} />
              {form.formState.errors.phone ? (
                <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
              ) : null}
            </div>

            {customFields.map((field) => {
              const fieldError = form.formState.errors[field.id]
              const inputId = `custom-${field.id}`

              return (
                <div className="grid gap-2" key={field.id}>
                  <Label htmlFor={inputId}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={inputId}
                      {...form.register(field.id)}
                      placeholder={field.placeholder}
                      className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  ) : (
                    <Input
                      id={inputId}
                      {...form.register(field.id)}
                      placeholder={field.placeholder}
                    />
                  )}
                  {fieldError ? (
                    <p className="text-xs text-destructive">
                      {(fieldError as { message?: string }).message ?? t.requiredField}
                    </p>
                  ) : null}
                </div>
              )
            })}

            {submitError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <p>{submitError}</p>
                {submitError === t.slotConflict ? (
                  <Link href={slotHref} className="mt-1 inline-block underline-offset-4 hover:underline">
                    {t.slotConflictAction}
                  </Link>
                ) : null}
              </div>
            ) : null}

            <Button type="submit" data-testid="booking-submit" disabled={mutation.isPending}>
              {mutation.isPending ? t.submitting : t.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
