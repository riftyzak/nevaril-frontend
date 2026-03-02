import { PublicShell } from "@/components/layout/public-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PublicDemoPage() {
  return (
    <PublicShell>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Public booking shell</CardTitle>
            <CardDescription>
              Customer booking modules will be added in later milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>Placeholder for service cards, slot picker, and booking forms.</p>
            <p>Theme and spacing are now token-driven for both light and dark mode.</p>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  )
}
