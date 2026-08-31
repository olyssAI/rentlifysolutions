import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SectionNavigationButton } from '@/modules/landing/components/section-navigation-button'

export function CallToActionSection() {
  return (
    <section className="scroll-mt-16 py-24 lg:py-32" id="contact">
      <div className="section-shell">
        <div className="grid gap-8 rounded-3xl bg-surface-inverted px-6 py-14 text-surface-inverted-foreground sm:px-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-16">
          <div>
            <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.045em] text-balance text-white sm:text-4xl lg:text-5xl">
              Talk to us about your restaurant
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-pretty text-white/60">
              Rentlify Solutions is opening to a first group of restaurants. Tell us how you serve today and we will
              show you what the app would look like with your name on it.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row lg:justify-end">
            <Button size="pill-lg">
              Start a conversation <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              variant="outline"
              size="pill-lg"
              className="border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10 hover:text-white"
              asChild
            >
              <SectionNavigationButton sectionId="top">Back to the top</SectionNavigationButton>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
