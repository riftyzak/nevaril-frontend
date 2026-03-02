import Link from "next/link"

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-4 sm:px-6">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Nevaril demo</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Locale redirect entry
        </h1>
        <p className="mt-3 text-muted-foreground">
          Middleware redirects unprefixed routes to <code>/cs</code>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/cs"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Open locale index
          </Link>
        </div>
      </section>
    </main>
  )
}
