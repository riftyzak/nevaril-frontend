function LockedNavItem() {
  return (
    <div className="max-w-sm rounded-lg border border-dashed border-border p-4">
      <p className="mb-2 text-sm text-muted-foreground">Locked nav item tooltip</p>
      <div title="Only owner can access this module" className="flex cursor-not-allowed items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground/70">
        Billing (locked)
      </div>
    </div>
  )
}

function NotAuthorizedMock() {
  return (
    <main className="mx-auto flex min-h-[420px] w-full max-w-xl items-center px-4">
      <section data-testid="not-authorized-screen" className="w-full rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">You do not have permission to access this route.</p>
        <button type="button" className="mt-5 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Back home
        </button>
      </section>
    </main>
  )
}

function LockedByPlanMock() {
  return (
    <section data-testid="locked-plan-screen" className="max-w-xl rounded-xl border border-border bg-card p-6">
      <h1 className="text-xl font-semibold">Locked by plan</h1>
      <p className="mt-2 text-sm text-muted-foreground">Upgrade to BUSINESS to access this module.</p>
      <div className="mt-4 flex gap-2">
        <button type="button" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Upgrade
        </button>
        <button type="button" className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm">
          Back
        </button>
      </div>
    </section>
  )
}

const meta = {
  title: "Guards/UX",
}

export default meta

export const LockedNavTooltip = {
  render: () => <LockedNavItem />,
}

export const NotAuthorized = {
  render: () => <NotAuthorizedMock />,
}

export const LockedByPlan = {
  render: () => <LockedByPlanMock />,
}
