"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createVoucherOrder,
  getLoyaltyConfig,
  getNotificationTemplates,
  listAnalytics,
  listVouchers,
  updateLoyaltyConfig,
  updateNotificationTemplates,
} from "@/lib/api"
import { useGtm } from "@/lib/gtm/useGtm"
import type { TenantPlan, VoucherType } from "@/lib/api/types"

interface AdvancedProps {
  tenantSlug: string
}

const NOTIFICATION_VARIABLES = [
  "{{customer_name}}",
  "{{service}}",
  "{{date}}",
  "{{time}}",
  "{{manage_link}}",
]

export function NotificationsPanel({ tenantSlug }: AdvancedProps) {
  const t = useTranslations("advanced.notifications")
  const queryClient = useQueryClient()
  const [sms, setSms] = useState("")
  const [email, setEmail] = useState("")

  const templatesQuery = useQuery({
    queryKey: ["notification-templates", tenantSlug],
    queryFn: async () => {
      const result = await getNotificationTemplates(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const current = templatesQuery.data
      if (!current) throw new Error("Missing templates")
      const result = await updateNotificationTemplates({
        tenantSlug,
        expectedUpdatedAt: current.updatedAt,
        sms: sms || current.sms,
        email: email || current.email,
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("saved"))
      await queryClient.invalidateQueries({ queryKey: ["notification-templates", tenantSlug] })
    },
    onError: () => toast.error(t("saveError")),
  })

  function insertVariable(variable: string) {
    setSms((prev) => `${prev}${prev ? " " : ""}${variable}`)
  }

  const previewSms = (sms || templatesQuery.data?.sms || "")
    .replaceAll("{{customer_name}}", "Anna")
    .replaceAll("{{service}}", "Haircut")
    .replaceAll("{{date}}", "2026-02-12")
    .replaceAll("{{time}}", "10:30")
    .replaceAll("{{manage_link}}", "https://example.com/manage")

  const previewEmail = (email || templatesQuery.data?.email || "")
    .replaceAll("{{customer_name}}", "Anna")
    .replaceAll("{{service}}", "Haircut")
    .replaceAll("{{date}}", "2026-02-12")
    .replaceAll("{{time}}", "10:30")
    .replaceAll("{{manage_link}}", "https://example.com/manage")

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {NOTIFICATION_VARIABLES.map((variable) => (
              <Button key={variable} type="button" size="xs" variant="outline" onClick={() => insertVariable(variable)}>
                {variable}
              </Button>
            ))}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tmpl-sms">{t("sms")}</Label>
            <textarea
              id="tmpl-sms"
              defaultValue={templatesQuery.data?.sms ?? ""}
              onChange={(event) => setSms(event.target.value)}
              className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tmpl-email">{t("email")}</Label>
            <textarea
              id="tmpl-email"
              defaultValue={templatesQuery.data?.email ?? ""}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {t("save")}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("preview")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="mb-1 text-xs text-muted-foreground">{t("smsPreview")}</p>
            <p>{previewSms}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="mb-1 text-xs text-muted-foreground">{t("emailPreview")}</p>
            <pre className="whitespace-pre-wrap font-sans">{previewEmail}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function LoyaltyPanel({ tenantSlug }: AdvancedProps) {
  const t = useTranslations("advanced.loyalty")
  const queryClient = useQueryClient()
  const [points, setPoints] = useState("")
  const [nextBookingLabel, setNextBookingLabel] = useState("")

  const loyaltyQuery = useQuery({
    queryKey: ["loyalty-config", tenantSlug],
    queryFn: async () => {
      const result = await getLoyaltyConfig(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const current = loyaltyQuery.data
      if (!current) throw new Error("Missing config")
      const result = await updateLoyaltyConfig({
        tenantSlug,
        expectedUpdatedAt: current.updatedAt,
        points: points ? Number(points) : current.points,
        nextBookingLabel: nextBookingLabel || current.nextBookingLabel,
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success(t("saved"))
      await queryClient.invalidateQueries({ queryKey: ["loyalty-config", tenantSlug] })
    },
  })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-card to-muted p-4">
            <p className="text-xs uppercase text-muted-foreground">{t("walletCard")}</p>
            <p className="mt-3 text-2xl font-semibold">{points || loyaltyQuery.data?.points || 0}</p>
            <p className="text-sm text-muted-foreground">{t("points")}</p>
            <p className="mt-4 text-sm">{nextBookingLabel || loyaltyQuery.data?.nextBookingLabel || "-"}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline">{t("addApple")}</Button>
              <Button size="sm" variant="outline">{t("addGoogle")}</Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="loyalty-points">{t("pointsLabel")}</Label>
            <Input
              id="loyalty-points"
              type="number"
              defaultValue={loyaltyQuery.data?.points ?? 0}
              onChange={(event) => setPoints(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="loyalty-next">{t("nextBookingLabel")}</Label>
            <Input
              id="loyalty-next"
              defaultValue={loyaltyQuery.data?.nextBookingLabel ?? ""}
              onChange={(event) => setNextBookingLabel(event.target.value)}
            />
          </div>
          <Button type="button" onClick={() => mutation.mutate()}>{t("save")}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("pushTitle")}</CardTitle>
          <CardDescription>{t("pushDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("pushPlaceholder")}</CardContent>
      </Card>
    </div>
  )
}

export function VouchersPanel({ tenantSlug }: AdvancedProps) {
  const t = useTranslations("advanced.vouchers")
  const queryClient = useQueryClient()
  const { pushEvent } = useGtm()
  const [type, setType] = useState<VoucherType>("fixed")
  const [amount, setAmount] = useState("100")
  const [selectedCode, setSelectedCode] = useState("")

  const vouchersQuery = useQuery({
    queryKey: ["vouchers", tenantSlug],
    queryFn: async () => {
      const result = await listVouchers(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await createVoucherOrder({
        tenantSlug,
        type,
        amount: Number(amount),
        currency: "EUR",
      })
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async (voucher) => {
      setSelectedCode(voucher.code)
      toast.success(t("checkoutStarted"))
      await queryClient.invalidateQueries({ queryKey: ["vouchers", tenantSlug] })
    },
  })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="voucher-type">{t("productType")}</Label>
            <select
              id="voucher-type"
              value={type}
              onChange={(event) => setType(event.target.value as VoucherType)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="fixed">{t("types.fixed")}</option>
              <option value="credit">{t("types.credit")}</option>
              <option value="percent">{t("types.percent")}</option>
              <option value="pack">{t("types.pack")}</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="voucher-amount">{t("amount")}</Label>
            <Input id="voucher-amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <Button
            type="button"
            onClick={() => {
              pushEvent("start_checkout_mock", {
                tenantSlug,
                voucherType: type,
                amount: Number(amount),
              })
              mutation.mutate()
            }}
          >
            {t("checkout")}
          </Button>
          {selectedCode ? (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{t("generatedCode")}: {selectedCode}</p>
              <Button type="button" size="sm" variant="outline" className="mt-2">{t("printableView")}</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("issued")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {(vouchersQuery.data ?? []).map((voucher) => (
            <div key={voucher.id} className="rounded-md border border-border p-3">
              <p className="font-medium">{voucher.code}</p>
              <p className="text-muted-foreground">{voucher.type} / {voucher.amount} {voucher.currency}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function ReviewsPanel() {
  const t = useTranslations("advanced.reviews")
  const [googlePlaceId, setGooglePlaceId] = useState("")
  const [reviewText, setReviewText] = useState("")

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Label htmlFor="google-place-id">{t("googlePlaceId")}</Label>
          <Input id="google-place-id" value={googlePlaceId} onChange={(event) => setGooglePlaceId(event.target.value)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("internalTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <textarea
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button type="button" variant="outline">{t("saveMock")}</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function AnalyticsPanel({ tenantSlug }: AdvancedProps) {
  const t = useTranslations("advanced.analytics")
  const analyticsQuery = useQuery({
    queryKey: ["analytics", tenantSlug],
    queryFn: async () => {
      const result = await listAnalytics(tenantSlug)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  const data = analyticsQuery.data ?? []
  const revenue = data.filter((item) => item.metric === "revenue")
  const bookings = data.filter((item) => item.metric === "bookings")
  const ratings = data.filter((item) => item.metric === "rating")
  const topServices = data.filter((item) => item.metric === "top-service")

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("revenue")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("bookings")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("ratings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {ratings.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-3">
                {item.label}: {(item.value / 10).toFixed(1)}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("topServices")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topServices.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-3">
                {item.label}: {item.value}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface PricingProps {
  currentPlan: TenantPlan
}

const PLAN_ORDER: TenantPlan[] = ["starter", "lite", "business", "ultimate"]

export function PricingPanel({ currentPlan }: PricingProps) {
  const t = useTranslations("pricing")
  const features = [
    { key: "notifications", min: "lite" as TenantPlan },
    { key: "reviews", min: "lite" as TenantPlan },
    { key: "loyalty", min: "business" as TenantPlan },
    { key: "vouchers", min: "business" as TenantPlan },
    { key: "analytics", min: "business" as TenantPlan },
  ]

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </section>
      <section className="grid gap-4 lg:grid-cols-4">
        {PLAN_ORDER.map((plan) => {
          const active = plan === currentPlan
          return (
            <div
              key={plan}
              className={`rounded-xl border p-4 ${
                active ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <p className="text-sm font-medium uppercase">{t(`plans.${plan}.name`)}</p>
              <p className="mt-2 text-2xl font-semibold">{t(`plans.${plan}.price`)}</p>
              {active ? (
                <span className="mt-3 inline-flex rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                  {t("currentPlan")}
                </span>
              ) : null}
            </div>
          )
        })}
      </section>
      <section className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">{t("feature")}</th>
              {PLAN_ORDER.map((plan) => (
                <th key={plan} className="px-3 py-2 text-left uppercase">
                  {t(`plans.${plan}.name`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.key} className="border-t border-border">
                <td className="px-3 py-2">{t(`features.${feature.key}`)}</td>
                {PLAN_ORDER.map((plan) => (
                  <td key={`${feature.key}-${plan}`} className="px-3 py-2">
                    {PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(feature.min) ? "✓" : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
