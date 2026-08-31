import { Check } from 'lucide-react'
import { benefits, capabilities, steps } from './restaurant-landing-content'
import { RestaurantPlatformTabs } from './restaurant-platform-tabs'

function RestaurantSectionHeading({
  title,
  description,
  inverted = false,
  centered = false,
}: {
  title: string
  description: string
  inverted?: boolean
  centered?: boolean
}) {
  return (
    <div className={`flex max-w-2xl flex-col ${centered ? 'mx-auto items-center text-center' : ''}`}>
      <h2
        className={`text-3xl font-semibold tracking-[-.045em] text-balance sm:text-4xl lg:text-5xl ${inverted ? 'text-white' : ''}`}
      >
        {title}
      </h2>
      <p
        className={`mt-4 text-base leading-7 sm:text-lg sm:leading-8 ${inverted ? 'text-white/60' : 'text-[#746b66]'}`}
      >
        {description}
      </p>
    </div>
  )
}

export function RestaurantCapabilityMarquee() {
  const repeatedCapabilities = [...capabilities, ...capabilities]
  return (
    <section className="border-b border-[#e7ddd4] py-12">
      <h2 className="text-center text-xs font-semibold uppercase tracking-[.18em] text-[#746b66]">
        What the app covers
      </h2>
      <div className="group mt-7 overflow-hidden py-1.5">
        <ul className="flex w-max animate-[restaurant-marquee_42s_linear_infinite] items-stretch gap-3 group-hover:[animation-play-state:paused]">
          {repeatedCapabilities.map(({ icon: Icon, label }, capabilityIndex) => (
            <li
              className="flex shrink-0 items-center gap-2.5 rounded-full border border-[#e7ddd4] bg-white px-5 py-2.5 text-sm font-medium text-[#312b27]"
              key={`${label}-${capabilityIndex}`}
            >
              <Icon className="size-4 text-[#dc3b2f]" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function RestaurantBenefitsSection() {
  return (
    <section className="bg-[#302b28] py-24 text-white lg:py-32" id="restaurant-platform">
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
        <RestaurantSectionHeading
          inverted
          title="What customers see, and what your team runs"
          description="Customers order from an app with your name on it. Your team manages the menu, availability and orders from one screen."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description, points }) => (
            <article
              className="rounded-xl border border-white/10 bg-white/[.045] p-4 transition hover:border-white/25 hover:bg-white/[.075]"
              key={title}
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-[#dc3b2f]">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-3 leading-6 text-white/55">{description}</p>
              <ul className="mt-6 grid gap-2.5 border-t border-white/10 pt-5 text-sm text-white/70">
                {points.map((point) => (
                  <li className="flex items-center gap-2.5" key={point}>
                    <span className="grid size-4 place-items-center rounded-full bg-white/10">
                      <Check className="size-2.5" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function RestaurantGettingStartedSection() {
  return (
    <section className="py-24 lg:py-32" id="restaurant-getting-started">
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
        <RestaurantSectionHeading
          centered
          title="Getting started"
          description="Setup is handled with you. There is nothing to install and no new hardware to buy."
        />
        <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
          <div className="absolute inset-x-[16%] top-7 hidden h-px bg-[#e7ddd4] md:block" />
          {steps.map(({ number, icon: Icon, title, description }) => (
            <li className="relative flex flex-col items-center text-center md:items-start md:text-left" key={number}>
              <span className="grid size-14 place-items-center rounded-2xl border border-[#e7ddd4] bg-white text-[#dc3b2f]">
                <Icon className="size-6" />
              </span>
              <span className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-[#dc3b2f]">Step {number}</span>
              <h3 className="mt-2 text-xl font-semibold">{title}</h3>
              <p className="mt-3 max-w-sm leading-7 text-[#746b66]">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function RestaurantPlatformShowcaseSection() {
  return (
    <section className="border-y border-[#e7ddd4] bg-[#fcf7ef] py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
        <RestaurantSectionHeading
          centered
          title="Menu, orders, offers and insight"
          description="Four areas, split the way a restaurant already thinks about its day."
        />
        <RestaurantPlatformTabs />
      </div>
    </section>
  )
}
