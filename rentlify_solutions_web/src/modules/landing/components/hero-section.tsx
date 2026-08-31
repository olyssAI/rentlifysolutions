import { ArrowRight, Bell, Check, ChevronRight, PackageX, Utensils } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MobileAppPreview } from '@/modules/landing/components/mobile-app-preview'
import { SectionNavigationButton } from '@/modules/landing/components/section-navigation-button'

const assurances = ['One app per restaurant', 'Dine-in, takeaway and delivery', 'Managed from a phone'] as const

export function HeroSection() {
  return (
    <section className="border-b border-border/70 bg-surface-warm pb-20 pt-12 lg:pb-28 lg:pt-16" id="top">
      <div className="section-shell grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div className="max-w-2xl animate-rise">
          <h1 className="text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
            Your restaurant.
            <br />
            <span className="text-primary">Their favourite app.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-pretty text-muted-foreground">
            A branded ordering app for your restaurant, with the menu, offers and orders managed from one place. Your
            customers order from you, not from a marketplace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="pill-lg" asChild>
              <SectionNavigationButton sectionId="contact">
                Book a demo <ArrowRight data-icon="inline-end" />
              </SectionNavigationButton>
            </Button>
            <Button variant="outline" size="pill-lg" asChild>
              <SectionNavigationButton sectionId="platform">
                See the platform <ChevronRight data-icon="inline-end" />
              </SectionNavigationButton>
            </Button>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {assurances.map((item) => (
              <li className="flex items-center gap-2" key={item}>
                <span className="grid size-5 place-items-center rounded-full bg-success-soft text-success">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-4 border-t border-border/70 pt-7">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-foreground text-background">
              <Utensils className="size-5" />
            </span>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Now opening to a first group of restaurants shaping the platform alongside us.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-end">
          <div className="order-2 grid w-full max-w-[330px] gap-3 sm:max-w-none sm:grid-cols-2 lg:order-1 lg:w-56 lg:shrink-0 lg:grid-cols-1">
            <Card size="sm" className="border border-border bg-card ring-0">
              <CardContent className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
                  <Bell className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">New order</p>
                  <p className="truncate font-semibold">#1048 received</p>
                </div>
              </CardContent>
            </Card>

            <Card size="sm" className="border border-border bg-card ring-0">
              <CardContent className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <PackageX className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Buffalo Wings</p>
                  <p className="truncate font-semibold">Marked sold out</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="order-1 lg:order-2">
            <MobileAppPreview />
          </div>
        </div>
      </div>
    </section>
  )
}
