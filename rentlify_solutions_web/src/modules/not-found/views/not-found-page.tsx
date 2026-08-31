import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const suggestions = [
  { label: 'The platform', description: 'What the app covers for your restaurant.', sectionId: 'platform' },
  { label: 'Getting started', description: 'The three steps to your first order.', sectionId: 'how-it-works' },
  { label: 'Common questions', description: 'Branding, branches and customer data.', sectionId: 'questions' },
] as const

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-surface-warm">
        <div className="section-shell flex h-16 items-center">
          <Link className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50" to="/">
            <BrandMark />
            <span className="sr-only">Rentlify Solutions home</span>
          </Link>
        </div>
      </header>

      <main className="section-shell flex flex-1 items-center py-20 lg:py-28">
        <div className="grid w-full gap-14 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
          <div className="max-w-xl">
            <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">Error 404</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:text-6xl">
              This page is not on the menu
            </h1>
            <p className="mt-5 leading-7 text-pretty text-muted-foreground">
              The link may be out of date, or the page may have moved. Everything about the platform is still on the
              home page.
            </p>

            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <Button size="pill-lg" asChild>
                <Link to="/">
                  <ArrowLeft data-icon="inline-start" /> Back to home
                </Link>
              </Button>
              <Button variant="outline" size="pill-lg" asChild>
                <Link to="/" state={{ scrollToSection: 'contact' }}>
                  Contact us <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-2">
            <ul>
              {suggestions.map(({ label, description, sectionId }, index) => (
                <li key={sectionId}>
                  {index > 0 ? <Separator /> : null}
                  <Link
                    className="group/suggestion flex items-center justify-between gap-4 rounded-2xl px-5 py-5 transition-colors hover:bg-muted"
                    to="/"
                    state={{ scrollToSection: sectionId }}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{label}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/suggestion:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-surface-warm">
        <div className="section-shell py-6 text-sm text-muted-foreground">
          <p>© 2026 Rentlify Solutions. Demo experience.</p>
        </div>
      </footer>
    </div>
  )
}
