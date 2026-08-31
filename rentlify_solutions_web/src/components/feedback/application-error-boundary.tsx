import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'

type ApplicationErrorBoundaryProps = { children: ReactNode }
type ApplicationErrorBoundaryState = { hasError: boolean }

/**
 * Catches render and lazy-chunk failures. Without this, a failed code-split import leaves
 * the user on a blank page with nothing but a console message.
 */
export class ApplicationErrorBoundary extends Component<ApplicationErrorBoundaryProps, ApplicationErrorBoundaryState> {
  state: ApplicationErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ApplicationErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled interface error.', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="grid min-h-screen place-items-center bg-surface-warm px-5">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <div className="flex justify-center">
            <BrandMark />
          </div>
          <h1 className="mt-6 text-xl font-semibold">This page did not load</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Something interrupted the page while it was loading. Reloading usually resolves it.
          </p>
          <Button className="mt-6" size="pill" onClick={() => window.location.reload()}>
            <RefreshCw data-icon="inline-start" /> Reload the page
          </Button>
        </div>
      </div>
    )
  }
}
