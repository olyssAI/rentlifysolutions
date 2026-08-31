import { BrandMark } from '@/components/brand-mark'

export function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-5" role="status" aria-live="polite">
      <div className="flex flex-col items-center">
        <BrandMark />
        <div className="mt-6 h-0.5 w-32 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <span className="block h-full w-1/3 animate-indeterminate rounded-full bg-primary" />
        </div>
        <span className="sr-only">Loading page</span>
      </div>
    </div>
  )
}
