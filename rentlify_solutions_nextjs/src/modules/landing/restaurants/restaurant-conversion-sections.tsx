import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { scenarios } from './restaurant-landing-content'
import { RestaurantQuestionsAccordion } from './restaurant-questions-accordion'

export function RestaurantScenariosSection() {
  return (
    <section className="py-24 lg:py-32" id="restaurant-scenarios">
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl lg:text-5xl">
            Built around everyday situations
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#746b66]">
            The ordinary things that happen in a restaurant every week, and what the platform does about them.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {scenarios.map(({ tag, title, description }) => (
            <article
              className="h-full rounded-xl border border-[#e7ddd4] bg-white p-4 transition hover:border-[#dc3b2f]/40"
              key={title}
            >
              <span className="inline-block rounded-full bg-[#f1ece7] px-3 py-1 text-xs font-medium text-[#746b66]">
                {tag}
              </span>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-[#746b66]">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function RestaurantQuestionsSection() {
  return (
    <section className="border-y border-[#e7ddd4] bg-[#fcf7ef] py-24 lg:py-32" id="restaurant-questions">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 lg:grid-cols-[.8fr_1.2fr] lg:gap-16 lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl lg:text-5xl">Common questions</h2>
          <p className="mt-4 text-lg leading-8 text-[#746b66]">
            If something here is not covered, it is usually a short conversation.
          </p>
          <Link
            className="mt-7 inline-flex h-10 items-center rounded-full border border-[#e0d6ce] bg-white px-5 text-sm font-semibold"
            href="/contact"
          >
            Ask us directly
          </Link>
        </div>
        <RestaurantQuestionsAccordion />
      </div>
    </section>
  )
}

export function RestaurantCallToActionSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
        <div className="grid gap-8 rounded-3xl bg-[#302b28] px-6 py-14 text-white sm:px-12 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:py-16">
          <div>
            <h2 className="max-w-xl text-3xl font-semibold tracking-[-.045em] sm:text-4xl lg:text-5xl">
              Talk to us about your restaurant
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-white/60">
              Rentlify Solutions is opening to a first group of restaurants. Tell us how you serve today and we will
              show you what the app would look like with your name on it.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row lg:justify-end">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#dc3b2f] px-6 text-sm font-semibold text-white"
              href="/book-a-meeting"
            >
              Start a conversation <ArrowRight size={16} />
            </Link>
            <a
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-sm font-semibold"
              href="#restaurant-top"
            >
              Back to the top
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
