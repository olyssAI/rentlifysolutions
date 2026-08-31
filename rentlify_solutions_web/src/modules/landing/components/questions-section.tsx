import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/modules/landing/components/section-heading'
import { SectionNavigationButton } from '@/modules/landing/components/section-navigation-button'
import { questions } from '@/modules/landing/landing-content'

export function QuestionsSection() {
  return (
    <section className="scroll-mt-16 border-y border-border/70 bg-surface-warm py-24 lg:py-32" id="questions">
      <div className="section-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <SectionHeading
            title="Common questions"
            description="If something here is not covered, it is usually a short conversation."
          />
          <Button variant="outline" size="pill" className="mt-7" asChild>
            <SectionNavigationButton sectionId="contact">Ask us directly</SectionNavigationButton>
          </Button>
        </div>

        <Accordion className="rounded-2xl border border-border bg-card px-6" type="single" collapsible>
          {questions.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`question-${index}`}>
              <AccordionTrigger className="gap-6 py-5 text-base font-medium hover:no-underline">
                {question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 pr-8 leading-7 text-muted-foreground">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
