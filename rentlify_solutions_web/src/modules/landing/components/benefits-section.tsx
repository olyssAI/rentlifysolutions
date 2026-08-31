import { Check } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { SectionHeading } from '@/modules/landing/components/section-heading'
import { benefits } from '@/modules/landing/landing-content'

export function BenefitsSection() {
  return (
    <section className="scroll-mt-16 bg-surface-inverted py-24 text-surface-inverted-foreground lg:py-32" id="platform">
      <div className="section-shell">
        <SectionHeading
          tone="inverted"
          title="What customers see, and what your team runs"
          description="Customers order from an app with your name on it. Your team manages the menu, availability and orders from one screen."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description, points }) => (
            <Card
              className="group/benefit border border-white/10 bg-white/[0.045] text-white ring-0 transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.075]"
              key={title}
            >
              <CardContent className="flex h-full flex-col">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-3 leading-6 text-white/55">{description}</p>
                <ul className="mt-6 grid gap-2.5 border-t border-white/10 pt-5 text-sm text-white/70">
                  {points.map((point) => (
                    <li className="flex items-center gap-2.5" key={point}>
                      <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-white/10">
                        <Check className="size-2.5" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
