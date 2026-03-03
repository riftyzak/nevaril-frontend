function TokenChip({ label, variable }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 h-12 rounded-md border border-border" style={{ backgroundColor: `var(${variable})` }} />
      <p className="text-xs font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{variable}</p>
    </div>
  )
}

function ThemePreview() {
  const tokens = [
    ["Background", "--background"],
    ["Foreground", "--foreground"],
    ["Primary", "--primary"],
    ["Primary FG", "--primary-foreground"],
    ["Card", "--card"],
    ["Muted", "--muted"],
    ["Border", "--border"],
    ["Ring", "--ring"],
  ]

  return (
    <main className="grid gap-6 p-6">
      <section className="grid gap-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Typography</p>
        <h1 className="text-4xl font-semibold">Poppins Display</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Antique-brass design tokens in light/dark variants. Switch theme via Storybook toolbar.
        </p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tokens.map(([label, variable]) => (
          <TokenChip key={variable} label={label} variable={variable} />
        ))}
      </section>
    </main>
  )
}

const meta = {
  title: "Design/ThemePreview",
}

export default meta

export const Default = {
  render: () => <ThemePreview />,
}
