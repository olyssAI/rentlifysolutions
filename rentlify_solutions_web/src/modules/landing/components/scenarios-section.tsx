import { Card, CardContent } from '@/components/ui/card'
import { SectionHeading } from '@/modules/landing/components/section-heading'
import { scenarios } from '@/modules/landing/landing-content'

export function ScenariosSection() {
  return (
    <section className="scroll-mt-16 py-24 lg:py-32" id="scenarios">
      <div className="section-shell">
        <SectionHeading
          title="Built around everyday situations"
          description="The ordinary things that happen in a restaurant every week, and what the platform does about them."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {scenarios.map(({ tag, title, description }) => (
            <Card
              className="h-full border border-border bg-card ring-0 transition-colors duration-200 hover:border-primary/40"
              key={title}
            >
              <CardContent className="flex h-full flex-col">
                <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {tag}
                </span>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="mt-3 leading-7 text-pretty text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
