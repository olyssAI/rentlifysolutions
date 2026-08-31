import { BrandMark } from '@/components/brand-mark'

export function AuthenticationLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-5">
      <div className="flex flex-col items-center" role="status" aria-live="polite">
        <BrandMark />
        <div className="mt-6 h-0.5 w-32 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <span className="block h-full w-1/3 animate-indeterminate rounded-full bg-primary" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Checking your account</p>
      </div>
    </div>
  )
}
