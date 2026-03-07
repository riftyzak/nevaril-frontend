"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AppLocale } from "@/i18n/locales"
import { updateTenantConfig } from "@/lib/api"
import type { TenantConfig } from "@/lib/api/types"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"
import { useServices } from "@/lib/query/hooks/use-services"
import { queryKeys } from "@/lib/query/keys"
import { adminAppPath, tenantUrl } from "@/lib/tenant/tenant-url"

interface TenantSettingsPanelProps {
  locale: AppLocale
  tenantSlug: string
}

interface TenantSettingsDraft {
  tenantName: string
  logoUrl: string
  staffSelectionEnabled: boolean
  cancellationPolicyText: string
  cancellationPolicyHours: number
  customFields: TenantConfig["customFields"]
  customersVisibility: TenantConfig["customersVisibility"]
  embedDefaults: TenantConfig["embedDefaults"]
}

function createDraft(config: TenantConfig): TenantSettingsDraft {
  return {
    tenantName: config.tenantName,
    logoUrl: config.logoUrl ?? "",
    staffSelectionEnabled: config.staffSelectionEnabled,
    cancellationPolicyText: config.cancellationPolicyText,
    cancellationPolicyHours: config.cancellationPolicyHours,
    customFields: config.customFields,
    customersVisibility: config.customersVisibility,
    embedDefaults: config.embedDefaults,
  }
}

function buildPatch(current: TenantConfig, draft: TenantSettingsDraft) {
  const patch: Parameters<typeof updateTenantConfig>[0]["patch"] = {}

  if (draft.tenantName !== current.tenantName) patch.tenantName = draft.tenantName
  if (draft.logoUrl !== (current.logoUrl ?? "")) patch.logoUrl = draft.logoUrl
  if (draft.staffSelectionEnabled !== current.staffSelectionEnabled) {
    patch.staffSelectionEnabled = draft.staffSelectionEnabled
  }
  if (draft.cancellationPolicyText !== current.cancellationPolicyText) {
    patch.cancellationPolicyText = draft.cancellationPolicyText
  }
  if (draft.cancellationPolicyHours !== current.cancellationPolicyHours) {
    patch.cancellationPolicyHours = draft.cancellationPolicyHours
  }
  if (draft.customersVisibility !== current.customersVisibility) {
    patch.customersVisibility = draft.customersVisibility
  }
  if (JSON.stringify(draft.customFields) !== JSON.stringify(current.customFields)) {
    patch.customFields = draft.customFields
  }
  if (JSON.stringify(draft.embedDefaults) !== JSON.stringify(current.embedDefaults)) {
    patch.embedDefaults = draft.embedDefaults
  }

  return patch
}

function createNextCustomFieldId(fields: TenantConfig["customFields"]) {
  const existingIds = new Set(fields.map((field) => field.id))
  let index = fields.length + 1

  while (existingIds.has(`field-${index}`)) {
    index += 1
  }

  return `field-${index}`
}

export function TenantSettingsPanel({ locale, tenantSlug }: Readonly<TenantSettingsPanelProps>) {
  const t = useTranslations("adminCore.tenantSettings")
  const queryClient = useQueryClient()
  const configQuery = useTenantConfig(tenantSlug)
  const servicesQuery = useServices(tenantSlug)
  const [localDraft, setLocalDraft] = useState<TenantSettingsDraft | null>(null)

  const draft = useMemo(() => {
    if (!configQuery.data) return null
    return localDraft ?? createDraft(configQuery.data)
  }, [configQuery.data, localDraft])

  const isDirty = useMemo(() => {
    if (!configQuery.data || !draft) return false
    return JSON.stringify(createDraft(configQuery.data)) !== JSON.stringify(draft)
  }, [configQuery.data, draft])

  function updateDraft(updater: (current: TenantSettingsDraft) => TenantSettingsDraft) {
    setLocalDraft((current) => {
      const baseDraft = current ?? (configQuery.data ? createDraft(configQuery.data) : null)
      if (!baseDraft) return current
      return updater(baseDraft)
    })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!configQuery.data || !draft) {
        throw new Error("Missing tenant config draft")
      }

      const patch = buildPatch(configQuery.data, draft)
      return updateTenantConfig({
        tenantSlug,
        expectedUpdatedAt: configQuery.data.updatedAt,
        patch,
      })
    },
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(t("saveError"))
        return
      }
      queryClient.setQueryData(queryKeys.tenantConfig(tenantSlug), result.data)
      setLocalDraft(null)
      toast.success(t("saved"))
    },
    onError: () => {
      toast.error(t("saveError"))
    },
  })

  if (configQuery.isLoading || !draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("loading")}</CardContent>
      </Card>
    )
  }

  if (configQuery.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("errorTitle")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground">
          <p>{t("errorBody")}</p>
          <Button type="button" variant="outline" onClick={() => void configQuery.refetch()}>
            {t("retry")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const defaultService = servicesQuery.data?.find((service) => service.id === draft.embedDefaults.defaultServiceId)
  const bookingEntryHref = tenantUrl({
    locale,
    tenantSlug,
    path: draft.embedDefaults.defaultServiceId ? `/book/${draft.embedDefaults.defaultServiceId}` : "/book",
  })
  const embedSettingsHref = adminAppPath({ locale, tenantSlug, path: "/embed" })

  return (
    <div className="grid gap-6 pb-28">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.profile.title")}</CardTitle>
          <CardDescription>{t("sections.profile.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tenant-name">{t("profile.name")}</Label>
              <Input
                id="tenant-name"
                value={draft.tenantName}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    tenantName: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant-logo">{t("profile.logoUrl")}</Label>
              <Input
                id="tenant-logo"
                value={draft.logoUrl}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    logoUrl: event.target.value,
                  }))
                }
                placeholder="https://"
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("profile.previewLabel")}
            </p>
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-background p-4 shadow-sm">
              {draft.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={draft.logoUrl}
                  alt={draft.tenantName}
                  className="size-16 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10 text-xl font-semibold text-primary">
                  {(draft.tenantName.trim()[0] ?? "N").toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{t("profile.previewEyebrow")}</p>
                <p className="truncate text-lg font-semibold">{draft.tenantName || t("profile.fallbackName")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.booking.title")}</CardTitle>
          <CardDescription>{t("sections.booking.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-5">
            <label className="flex items-start gap-3 rounded-xl border border-border p-4">
              <input
                type="checkbox"
                checked={draft.staffSelectionEnabled}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    staffSelectionEnabled: event.target.checked,
                  }))
                }
                className="mt-1 size-4"
              />
              <div className="grid gap-1">
                <span className="font-medium">{t("booking.staffSelection")}</span>
                <span className="text-sm text-muted-foreground">{t("booking.staffSelectionHint")}</span>
              </div>
            </label>

            <div className="grid gap-2">
              <Label htmlFor="tenant-policy-text">{t("booking.policyText")}</Label>
              <textarea
                id="tenant-policy-text"
                value={draft.cancellationPolicyText}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    cancellationPolicyText: event.target.value,
                  }))
                }
                className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-2 sm:max-w-48">
              <Label htmlFor="tenant-policy-hours">{t("booking.policyHours")}</Label>
              <Input
                id="tenant-policy-hours"
                type="number"
                min={0}
                step={1}
                value={String(draft.cancellationPolicyHours)}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    cancellationPolicyHours: Number(event.target.value || 0),
                  }))
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("booking.previewLabel")}
            </p>
            <div className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
              <p className="text-sm font-medium">
                {t("booking.previewRule", { hours: draft.cancellationPolicyHours })}
              </p>
              <p className="text-sm text-muted-foreground">
                {draft.cancellationPolicyText || t("booking.policyFallback")}
              </p>
              <p className="text-sm text-muted-foreground">
                {draft.staffSelectionEnabled
                  ? t("booking.staffSelectionEnabled")
                  : t("booking.staffSelectionDisabled")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.customers.title")}</CardTitle>
          <CardDescription>{t("sections.customers.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <label className="flex items-start gap-3 rounded-xl border border-border p-4">
            <input
              type="radio"
              name="customers-visibility"
              checked={draft.customersVisibility === "own"}
              onChange={() =>
                updateDraft((current) => ({
                  ...current,
                  customersVisibility: "own",
                }))
              }
              className="mt-1 size-4"
            />
            <div className="grid gap-1">
              <span className="font-medium">{t("customers.ownTitle")}</span>
              <span className="text-sm text-muted-foreground">{t("customers.ownDescription")}</span>
            </div>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-border p-4">
            <input
              type="radio"
              name="customers-visibility"
              checked={draft.customersVisibility === "all_readonly"}
              onChange={() =>
                updateDraft((current) => ({
                  ...current,
                  customersVisibility: "all_readonly",
                }))
              }
              className="mt-1 size-4"
            />
            <div className="grid gap-1">
              <span className="font-medium">{t("customers.allReadonlyTitle")}</span>
              <span className="text-sm text-muted-foreground">{t("customers.allReadonlyDescription")}</span>
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.customFields.title")}</CardTitle>
          <CardDescription>{t("sections.customFields.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{t("customFields.helper")}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateDraft((current) => ({
                    ...current,
                    customFields: [
                      ...current.customFields,
                      {
                        id: createNextCustomFieldId(current.customFields),
                        label: "",
                        type: "text",
                        required: false,
                        placeholder: "",
                      },
                    ],
                  }))
                }
              >
                {t("customFields.add")}
              </Button>
            </div>

            {draft.customFields.length ? (
              draft.customFields.map((field, index) => (
                <div key={field.id} className="grid gap-4 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{field.label || t("customFields.untitled", { index: index + 1 })}</p>
                      <p className="text-sm text-muted-foreground">{field.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={index === 0}
                        onClick={() =>
                          updateDraft((current) => {
                            const nextFields = [...current.customFields]
                            ;[nextFields[index - 1], nextFields[index]] = [nextFields[index], nextFields[index - 1]]
                            return {
                              ...current,
                              customFields: nextFields,
                            }
                          })
                        }
                      >
                        {t("customFields.moveUp")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={index === draft.customFields.length - 1}
                        onClick={() =>
                          updateDraft((current) => {
                            const nextFields = [...current.customFields]
                            ;[nextFields[index], nextFields[index + 1]] = [nextFields[index + 1], nextFields[index]]
                            return {
                              ...current,
                              customFields: nextFields,
                            }
                          })
                        }
                      >
                        {t("customFields.moveDown")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateDraft((current) => ({
                            ...current,
                            customFields: current.customFields.filter((item) => item.id !== field.id),
                          }))
                        }
                      >
                        {t("customFields.remove")}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`field-label-${field.id}`}>{t("customFields.label")}</Label>
                      <Input
                        id={`field-label-${field.id}`}
                        value={field.label}
                        onChange={(event) =>
                          updateDraft((current) => ({
                            ...current,
                            customFields: current.customFields.map((item) =>
                              item.id === field.id ? { ...item, label: event.target.value } : item
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`field-type-${field.id}`}>{t("customFields.type")}</Label>
                      <select
                        id={`field-type-${field.id}`}
                        value={field.type}
                        onChange={(event) =>
                          updateDraft((current) => ({
                            ...current,
                            customFields: current.customFields.map((item) =>
                              item.id === field.id
                                ? { ...item, type: event.target.value === "textarea" ? "textarea" : "text" }
                                : item
                            ),
                          }))
                        }
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="text">{t("customFields.typeText")}</option>
                        <option value="textarea">{t("customFields.typeTextarea")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                    <div className="grid gap-2">
                      <Label htmlFor={`field-placeholder-${field.id}`}>{t("customFields.placeholderLabel")}</Label>
                      <Input
                        id={`field-placeholder-${field.id}`}
                        value={field.placeholder ?? ""}
                        onChange={(event) =>
                          updateDraft((current) => ({
                            ...current,
                            customFields: current.customFields.map((item) =>
                              item.id === field.id ? { ...item, placeholder: event.target.value } : item
                            ),
                          }))
                        }
                      />
                    </div>
                    <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(event) =>
                          updateDraft((current) => ({
                            ...current,
                            customFields: current.customFields.map((item) =>
                              item.id === field.id ? { ...item, required: event.target.checked } : item
                            ),
                          }))
                        }
                        className="size-4"
                      />
                      <span className="text-sm font-medium">{t("customFields.required")}</span>
                    </label>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
                {t("customFields.empty")}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("customFields.previewLabel")}
            </p>
            <div className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
              <div className="grid gap-2">
                <Label>{t("customFields.baseName")}</Label>
                <Input value="Anna Novakova" readOnly />
              </div>
              <div className="grid gap-2">
                <Label>{t("customFields.baseEmail")}</Label>
                <Input value="anna@example.com" readOnly />
              </div>
              <div className="grid gap-2">
                <Label>{t("customFields.basePhone")}</Label>
                <Input value="+420777000111" readOnly />
              </div>
              {draft.customFields.map((field) => (
                <div className="grid gap-2" key={`preview-${field.id}`}>
                  <Label>
                    {field.label || t("customFields.placeholderField")}
                    {field.required ? " *" : ""}
                  </Label>
                  {field.type === "textarea" ? (
                    <textarea
                      readOnly
                      placeholder={field.placeholder}
                      className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  ) : (
                    <Input readOnly placeholder={field.placeholder} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("sections.share.title")}</CardTitle>
          <CardDescription>{t("sections.share.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4">
            <div className="grid gap-2 sm:max-w-60">
              <Label htmlFor="embed-default-service">{t("share.defaultService")}</Label>
              <select
                id="embed-default-service"
                value={draft.embedDefaults.defaultServiceId ?? ""}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    embedDefaults: {
                      ...current.embedDefaults,
                      defaultServiceId: event.target.value || null,
                    },
                  }))
                }
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("share.allServices")}</option>
                {(servicesQuery.data ?? []).map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="embed-primary-default">{t("share.widgetPrimary")}</Label>
                <Input
                  id="embed-primary-default"
                  value={draft.embedDefaults.widgetPrimary ?? ""}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      embedDefaults: {
                        ...current.embedDefaults,
                        widgetPrimary: event.target.value,
                      },
                    }))
                  }
                  placeholder="#1d4ed8"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="embed-radius-default">{t("share.widgetRadius")}</Label>
                <Input
                  id="embed-radius-default"
                  value={draft.embedDefaults.widgetRadius ?? ""}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      embedDefaults: {
                        ...current.embedDefaults,
                        widgetRadius: event.target.value,
                      },
                    }))
                  }
                  placeholder="12px"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
              <p>{t("share.helper")}</p>
              <Link href={embedSettingsHref} className="mt-3 inline-flex text-primary underline-offset-4 hover:underline">
                {t("share.openEmbed")}
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("share.previewLabel")}
            </p>
            <div className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
              <div className="grid gap-1">
                <p className="text-sm font-medium">{t("share.bookingEntryPreview")}</p>
                <code className="rounded-md bg-muted px-2 py-1 text-xs text-foreground">{bookingEntryHref}</code>
              </div>
              <div className="grid gap-1">
                <p className="text-sm font-medium">{t("share.selectedService")}</p>
                <p className="text-sm text-muted-foreground">{defaultService?.name ?? t("share.allServices")}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-medium">{t("share.widgetPreview")}</p>
                <div className="mt-3 rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-4 rounded-full border border-border"
                      style={{ backgroundColor: draft.embedDefaults.widgetPrimary || "#1d4ed8" }}
                    />
                    <div>
                      <p className="font-medium">{draft.tenantName}</p>
                      <p className="text-sm text-muted-foreground">{t("share.widgetCaption")}</p>
                    </div>
                  </div>
                  <div
                    className="mt-4 border border-border bg-muted/40 p-3 text-sm"
                    style={{ borderRadius: draft.embedDefaults.widgetRadius || "12px" }}
                  >
                    {t("share.widgetButton")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isDirty ? (
        <div
          data-testid="tenant-settings-save-bar"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 backdrop-blur"
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-medium">{t("saveBar.title")}</p>
              <p className="text-sm text-muted-foreground">{t("saveBar.description")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocalDraft(null)}
                disabled={saveMutation.isPending}
              >
                {t("discard")}
              </Button>
              <Button
                data-testid="tenant-settings-save"
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
