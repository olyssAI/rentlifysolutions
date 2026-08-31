import { SectionHeading } from '@/modules/landing/components/section-heading'
import { steps } from '@/modules/landing/landing-content'

export function HowItWorksSection() {
  return (
    <section className="scroll-mt-16 py-24 lg:py-32" id="how-it-works">
      <div className="section-shell">
        <SectionHeading
          align="center"
          title="Getting started"
          description="Setup is handled with you. There is nothing to install and no new hardware to buy."
        />

        <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
          <div aria-hidden="true" className="absolute inset-x-[16%] top-7 hidden h-px bg-border md:block" />

          {steps.map(({ number, icon: Icon, title, description }) => (
            <li className="relative flex flex-col items-center text-center md:items-start md:text-left" key={number}>
              <span className="grid size-14 place-items-center rounded-2xl border border-border bg-card text-primary">
                <Icon className="size-6" />
              </span>
              <span className="mt-6 text-xs font-semibold tracking-[0.2em] text-primary uppercase">Step {number}</span>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em]">{title}</h3>
              <p className="mt-3 max-w-sm leading-7 text-pretty text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
