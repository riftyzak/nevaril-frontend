import { PublicShell } from "@/components/layout/public-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function PublicDemoPage({
  params,
}: Readonly<{
  params: Promise<{ locale: "cs" | "sk" | "en"; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params

  return (
    <PublicShell homeHref={tenantUrl({ locale, tenantSlug })}>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Public booking shell</CardTitle>
            <CardDescription>
              Customer booking modules will be added in later milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>Tenant slug in URL: {tenantSlug}</p>
            <p>Path and subdomain requests render through the same route tree.</p>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  )
}
