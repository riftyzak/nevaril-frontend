import { cn } from "@/lib/utils"

interface BookingProgressProps {
  labels: {
    service: string
    slot: string
    details: string
    confirm: string
  }
  current: "service" | "slot" | "details" | "confirm"
}

const order = ["service", "slot", "details", "confirm"] as const

export function BookingProgress({ labels, current }: Readonly<BookingProgressProps>) {
  const currentIndex = order.indexOf(current)

  return (
    <ol className="mb-6 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      {order.map((step, index) => {
        const isActive = index === currentIndex
        const isDone = index < currentIndex

        return (
          <li
            key={step}
            className={cn(
              "rounded-lg border px-3 py-2 text-center",
              isActive && "border-primary bg-primary/10 text-foreground",
              isDone && "border-border bg-muted text-foreground",
              !isActive && !isDone && "border-border text-muted-foreground"
            )}
          >
            {labels[step]}
          </li>
        )
      })}
    </ol>
  )
}
