function PublicShellMock({ widget = false }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className={`border-b border-border ${widget ? "border-b-0" : ""}`}>
        <div className={`mx-auto flex w-full items-center justify-between gap-4 ${widget ? "max-w-none px-3 py-2" : "max-w-6xl px-4 py-3 sm:px-6"}`}>
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/20 ring-1 ring-border" />
            <div>
              <p className="text-sm font-semibold">Nevaril</p>
              <p className="text-xs text-muted-foreground">Public shell mock</p>
            </div>
          </div>
          {!widget ? <div className="text-xs text-muted-foreground">Locale + Theme controls</div> : null}
        </div>
      </header>
      <main className={`mx-auto w-full ${widget ? "max-w-none px-3 py-3" : "max-w-6xl px-4 py-6 sm:px-6"}`}>
        <div className="rounded-lg border border-border bg-card p-4">Mocked public content</div>
      </main>
    </div>
  )
}

function AdminShellMock() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-b border-border p-4 md:border-r md:border-b-0">
          <p className="text-base font-semibold">Nevaril</p>
          <p className="mb-4 text-xs text-muted-foreground">Admin shell mock</p>
          <div className="grid gap-2 text-sm">
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">Dashboard</div>
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">Bookings</div>
            <div title="Locked by role" className="cursor-not-allowed rounded-lg border border-dashed border-border px-3 py-2 text-muted-foreground/70">
              Billing (locked)
            </div>
          </div>
        </aside>
        <section className="flex min-h-screen flex-col">
          <header className="border-b border-border px-4 py-3 sm:px-6">
            <h1 className="text-lg font-semibold">Workspace</h1>
          </header>
          <main className="flex-1 p-4 sm:p-6">
            <div className="rounded-lg border border-border bg-card p-4">Mocked admin content</div>
          </main>
        </section>
      </div>
    </div>
  )
}

const meta = {
  title: "Layout/Shells",
}

export default meta

export const PublicShell = {
  render: () => <PublicShellMock />,
}

export const PublicShellWidget = {
  render: () => <PublicShellMock widget />,
}

export const AdminShell = {
  render: () => <AdminShellMock />,
}
