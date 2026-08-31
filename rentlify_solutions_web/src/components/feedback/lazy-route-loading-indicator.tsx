export function LazyRouteLoadingIndicator() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-muted">
        <span className="block h-full w-1/3 animate-[route-progress_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid size-12 place-items-center rounded-2xl border border-border bg-white shadow-sm">
          <span className="absolute inset-1.5 animate-spin rounded-xl border-2 border-transparent border-r-primary/30 border-t-primary" />
          <span className="size-2 rounded-full bg-primary" />
        </span>
        <p className="text-sm font-medium text-muted-foreground">Opening page…</p>
      </div>
    </div>
  )
}
