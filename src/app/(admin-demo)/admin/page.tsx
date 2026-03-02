import { AdminShell } from "@/components/layout/admin-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminDemoPage() {
  return (
    <AdminShell>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard placeholder</CardTitle>
            <CardDescription>KPIs and analytics modules come later.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Empty-state layout for charts and day summary widgets.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Admin modules placeholder</CardTitle>
            <CardDescription>
              Bookings, services, customers, and staff sections are next.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Role gating and permissions are intentionally not part of Milestone 1.
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
