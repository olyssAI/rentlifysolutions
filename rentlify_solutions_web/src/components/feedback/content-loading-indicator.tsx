import { LoaderCircle } from 'lucide-react'

export function ContentLoadingIndicator({
  label = 'Loading',
  fillViewport = true,
}: {
  label?: string
  fillViewport?: boolean
}) {
  return (
    <div
      className={
        fillViewport
          ? 'flex min-h-[calc(100vh-9.5rem)] items-center justify-center px-5'
          : 'flex min-h-48 items-center justify-center px-5'
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-11 place-items-center rounded-full border border-border bg-white shadow-xs">
          <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
