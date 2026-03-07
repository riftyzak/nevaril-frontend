"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateTenantConfig } from "@/lib/api"
import type { TenantConfig } from "@/lib/api/types"
import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"
import { queryKeys } from "@/lib/query/keys"

interface TenantSettingsPanelProps {
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

function SectionShell({
  title,
  description,
  placeholder,
}: Readonly<{
  title: string
  description: string
  placeholder: string
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
          {placeholder}
        </div>
      </CardContent>
    </Card>
  )
}

export function TenantSettingsPanel({ tenantSlug }: Readonly<TenantSettingsPanelProps>) {
  const t = useTranslations("adminCore.tenantSettings")
  const queryClient = useQueryClient()
  const configQuery = useTenantConfig(tenantSlug)
  const [localDraft, setLocalDraft] = useState<TenantSettingsDraft | null>(null)

  const draft = useMemo(() => {
    if (!configQuery.data) return null
    return localDraft ?? createDraft(configQuery.data)
  }, [configQuery.data, localDraft])

  const isDirty = useMemo(() => {
    if (!configQuery.data || !draft) return false
    return JSON.stringify(createDraft(configQuery.data)) !== JSON.stringify(draft)
  }, [configQuery.data, draft])

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

  return (
    <div className="grid gap-6 pb-28">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
      </Card>

      <SectionShell
        title={t("sections.profile.title")}
        description={t("sections.profile.description")}
        placeholder={t("sections.profile.placeholder")}
      />
      <SectionShell
        title={t("sections.booking.title")}
        description={t("sections.booking.description")}
        placeholder={t("sections.booking.placeholder")}
      />
      <SectionShell
        title={t("sections.customFields.title")}
        description={t("sections.customFields.description")}
        placeholder={t("sections.customFields.placeholder")}
      />
      <SectionShell
        title={t("sections.customers.title")}
        description={t("sections.customers.description")}
        placeholder={t("sections.customers.placeholder")}
      />
      <SectionShell
        title={t("sections.share.title")}
        description={t("sections.share.description")}
        placeholder={t("sections.share.placeholder")}
      />

      {isDirty ? (
        <div
          data-testid="tenant-settings-save-bar"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur"
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
