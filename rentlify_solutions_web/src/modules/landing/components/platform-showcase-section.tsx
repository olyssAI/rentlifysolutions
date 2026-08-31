import { ArrowUpRight, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SectionNavigationButton } from '@/modules/landing/components/section-navigation-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionHeading } from '@/modules/landing/components/section-heading'
import { showcasePanels } from '@/modules/landing/landing-content'
import { cn } from '@/lib/utils'

export function PlatformShowcaseSection() {
  return (
    <section className="border-y border-border/70 bg-surface-warm py-24 lg:py-32" aria-labelledby="showcase-title">
      <div className="section-shell">
        <SectionHeading
          align="center"
          title={<span id="showcase-title">Menu, orders, offers and insight</span>}
          description="Four areas, split the way a restaurant already thinks about its day."
        />

        <Tabs className="mt-12 items-center gap-10" defaultValue={showcasePanels[0]?.value}>
          <div className="w-full max-w-full overflow-x-auto px-1 py-2">
            <TabsList
              className="mx-auto w-max gap-1 rounded-full border border-border bg-card p-1.5 group-data-horizontal/tabs:h-auto"
              variant="default"
            >
              {showcasePanels.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  className="h-10 flex-none rounded-full px-5 text-sm font-medium after:hidden hover:bg-muted data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none data-active:hover:bg-primary"
                  key={value}
                  value={value}
                >
                  <Icon /> {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {showcasePanels.map(({ value, headline, description, highlights, previewTitle, previewRows, icon: Icon }) => (
            <TabsContent className="w-full" key={value} value={value}>
              <div className="grid gap-6 overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-balance sm:text-3xl">{headline}</h3>
                  <p className="mt-4 max-w-xl leading-7 text-pretty text-muted-foreground">{description}</p>

                  <ul className="mt-7 grid gap-3">
                    {highlights.map((highlight) => (
                      <li className="flex items-start gap-3 text-sm leading-6" key={highlight}>
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                          <Check className="size-3" />
                        </span>
                        {highlight}
                      </li>
                    ))}
                  </ul>

                  <Button variant="link" size="sm" className="mt-7 h-auto w-fit p-0" asChild>
                    <SectionNavigationButton sectionId="contact">
                      Book a walkthrough <ArrowUpRight data-icon="inline-end" />
                    </SectionNavigationButton>
                  </Button>
                </div>

                <div className="rounded-2xl bg-surface-inverted p-5 text-surface-inverted-foreground sm:p-6">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <span className="grid size-9 place-items-center rounded-lg border border-white/15 bg-white/10">
                      <Icon className="size-4" />
                    </span>
                    <p className="text-sm font-medium">{previewTitle}</p>
                  </div>

                  <ul className="mt-2 divide-y divide-white/10">
                    {previewRows.map(({ primary, secondary, trailing, tone }) => (
                      <li className="flex items-center justify-between gap-4 py-3.5" key={primary}>
                        <div className="min-w-0">
                          <p className={cn('truncate text-sm font-medium', tone === 'muted' && 'text-white/45')}>
                            {primary}
                          </p>
                          <p className="mt-1 truncate text-xs text-white/45">{secondary}</p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums',
                            tone === 'active' && 'bg-primary text-primary-foreground',
                            tone === 'default' && 'bg-white/10 text-white/80',
                            tone === 'muted' && 'bg-white/5 text-white/40',
                          )}
                        >
                          {trailing}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
