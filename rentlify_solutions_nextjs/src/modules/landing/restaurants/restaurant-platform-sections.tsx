import {
  BadgeCheck,
  BarChart3,
  BellRing,
  Check,
  ChefHat,
  ListChecks,
  Search,
  ShoppingBag,
  Store,
  UtensilsCrossed,
} from 'lucide-react'
import Image from 'next/image'

import { Reveal, Stagger, StaggerItem } from '@/components/motion-reveal'

import {
  customerExperienceFeatures,
  operatingLoop,
  ownerControlFeatures,
  restaurantCapabilities,
} from './restaurant-landing-content'

export function RestaurantCompletePlatformSection() {
  return (
    <section className="relative overflow-hidden bg-[#f4ebf6] py-16 lg:py-24" id="complete-platform">
      <div aria-hidden="true" className="absolute -left-20 top-20 size-44 rounded-full border-[32px] border-white/55" />
      <div className="relative mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#6f2da8]">Built around the whole shift</p>
          <h2 className="mt-4 text-3xl font-black leading-[1.04] tracking-[-.04em] text-[#27172e] sm:text-4xl lg:text-[3.15rem]">
            One system for customers, service and growth.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#75677c]">
            Bring every important part of the restaurant into one clear flow, without adding more tools for your team
            to manage.
          </p>
        </Reveal>

        <Stagger className="mt-11 overflow-hidden rounded-[1.75rem] border border-[#d8c9dd] shadow-[0_24px_65px_rgba(59,28,72,.12)]">
          {restaurantCapabilityGroups.map(
            ({ icon: GroupIcon, eyebrow, title, description, capabilityIndexes }, groupIndex) => (
              <StaggerItem
                className={`group relative grid gap-6 overflow-hidden px-5 py-7 transition-colors duration-500 sm:px-7 lg:grid-cols-[4rem_.72fr_1.28fr] lg:items-center lg:gap-8 lg:px-9 lg:py-8 ${
                  groupIndex === 0
                    ? 'bg-white text-[#2d1d33]'
                    : groupIndex === 1
                      ? 'bg-[#2b0746] text-white'
                      : 'bg-[#f7c928] text-[#2b0746]'
                }`}
                key={title}
              >
                <span
                  className={`text-4xl font-black tracking-[-.08em] lg:text-5xl ${
                    groupIndex === 0 ? 'text-[#6f2da8]/18' : groupIndex === 1 ? 'text-white/15' : 'text-[#2b0746]/18'
                  }`}
                >
                  0{groupIndex + 1}
                </span>

                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-10 place-items-center rounded-xl transition-transform duration-500 group-hover:rotate-3 group-hover:scale-105 ${
                        groupIndex === 0
                          ? 'bg-[#eee2f4] text-[#6f2da8]'
                          : groupIndex === 1
                            ? 'bg-[#f7c928] text-[#2b0746]'
                            : 'bg-[#2b0746] text-white'
                      }`}
                    >
                      <GroupIcon className="size-[1.1rem]" strokeWidth={2.25} />
                    </span>
                    <p
                      className={`text-[10px] font-black uppercase tracking-[.15em] ${
                        groupIndex === 0 ? 'text-[#806887]' : groupIndex === 1 ? 'text-[#f7c928]' : 'text-[#2b0746]/55'
                      }`}
                    >
                      {eyebrow}
                    </p>
                  </div>
                  <h3 className="mt-4 text-xl font-black tracking-[-.025em] sm:text-2xl">{title}</h3>
                  <p
                    className={`mt-2 max-w-md text-sm leading-6 ${
                      groupIndex === 0 ? 'text-[#78677e]' : groupIndex === 1 ? 'text-white/58' : 'text-[#2b0746]/65'
                    }`}
                  >
                    {description}
                  </p>
                </div>

                <ul className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
                  {capabilityIndexes.map((capabilityIndex) => {
                    const capability = restaurantCapabilities[capabilityIndex]

                    if (!capability) return null

                    const CapabilityIcon = capability.icon

                    return (
                      <li className="flex items-start gap-3" key={capability.title}>
                        <span
                          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                            groupIndex === 0
                              ? capabilityIconToneClassNames[capability.tone]
                              : groupIndex === 1
                                ? 'bg-white/10 text-[#f7c928]'
                                : 'bg-white/55 text-[#2b0746]'
                          }`}
                        >
                          <CapabilityIcon className="size-3.5" strokeWidth={2.25} />
                        </span>
                        <span>
                          <span className="block text-sm font-black">{capability.title}</span>
                          <span
                            className={`mt-1 block text-xs leading-5 ${
                              groupIndex === 0
                                ? 'text-[#806f86]'
                                : groupIndex === 1
                                  ? 'text-white/50'
                                  : 'text-[#2b0746]/58'
                            }`}
                          >
                            {capability.description}
                          </span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </StaggerItem>
            ),
          )}
        </Stagger>
      </div>
    </section>
  )
}

const restaurantCapabilityGroups = [
  {
    icon: ShoppingBag,
    eyebrow: 'Customer channels',
    title: 'Bring orders in',
    description: 'Give customers direct ways to discover your menu and place an order.',
    capabilityIndexes: [0, 1, 2],
  },
  {
    icon: ChefHat,
    eyebrow: 'Daily operations',
    title: 'Keep service moving',
    description: 'Connect table, kitchen and delivery work around the same live order.',
    capabilityIndexes: [3, 4, 5],
  },
  {
    icon: BarChart3,
    eyebrow: 'Business growth',
    title: 'See what needs attention',
    description: 'Understand stock, returning customers and performance without assembling reports.',
    capabilityIndexes: [6, 7, 8],
  },
] as const

const capabilityIconToneClassNames = {
  purple: 'bg-[#2b0746] text-[#f7c928]',
  yellow: 'bg-[#f7c928] text-[#2b0746]',
  light: 'bg-[#eee2f4] text-[#6f2da8]',
} as const

export function RestaurantConnectedExperienceSection() {
  return (
    <section className="scroll-mt-24 overflow-hidden bg-[#f3eaf6] py-20 lg:py-28" id="customer-and-team">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="grid gap-6 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#6f2da8]">Two sides of every order</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-.04em] text-[#27172e] sm:text-5xl">
              Simple for customers. Clear for your team.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-[#75677c] sm:text-lg lg:justify-self-end">
            Customers get a polished ordering experience. Your restaurant gets the controls needed to keep service
            moving without turning every task into a technical job.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <Reveal className="relative overflow-hidden rounded-[2rem] bg-[#2b0746] p-6 text-white sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#f7c928]">Customer experience</p>
            <h3 className="mt-4 max-w-lg text-2xl font-black tracking-[-.035em] sm:text-3xl">
              Ordering that feels like your restaurant.
            </h3>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {customerExperienceFeatures.map((feature) => (
                <li className="flex items-center gap-2 text-sm text-white/70" key={feature}>
                  <Check className="size-4 text-[#f7c928]" /> {feature}
                </li>
              ))}
            </ul>
            <CustomerAppMockup />
            <CustomerOrderJourneyPanel />
          </Reveal>

          <Reveal className="relative overflow-hidden rounded-[2rem] border border-[#dfcee6] bg-white p-6 sm:p-8" delay={0.08}>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#6f2da8]">Restaurant control</p>
            <h3 className="mt-4 max-w-lg text-2xl font-black tracking-[-.035em] text-[#27172e] sm:text-3xl">
              Today&apos;s work and the wider business in one view.
            </h3>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {ownerControlFeatures.map((feature) => (
                <li className="flex items-center gap-2 text-sm text-[#75677c]" key={feature}>
                  <Check className="size-4 text-[#6f2da8]" /> {feature}
                </li>
              ))}
            </ul>
            <OwnerDashboardMockup />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function RestaurantOperatingLoopSection() {
  return (
    <section className="scroll-mt-24 bg-white py-20 lg:py-28" id="order-journey">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#6f2da8]">From order to report</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-.04em] text-[#27172e] sm:text-5xl">
              Every person sees what they need next.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#75677c] sm:text-lg">
              The customer, counter, kitchen and manager each receive the right view while the same order moves through
              service.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {operatingLoop.map(({ icon: Icon, label, detail }, index) => (
              <li
                className={`flex items-center gap-4 rounded-2xl border p-5 ${
                  index === 4
                    ? 'border-[#f7c928] bg-[#f7c928] text-[#2b0746] sm:col-span-2'
                    : 'border-[#e8dfea] bg-[#fffaf0]'
                }`}
                key={label}
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                    index === 4 ? 'bg-[#2b0746] text-white' : 'bg-[#efe2f5] text-[#6f2da8]'
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-black">{label}</p>
                  <p className={`mt-1 text-sm ${index === 4 ? 'text-[#2b0746]/65' : 'text-[#75677c]'}`}>{detail}</p>
                </div>
                <span className="ml-auto text-xs font-black opacity-35">0{index + 1}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}

function CustomerAppMockup() {
  return (
    <div className="relative mt-10 aspect-[1.6/1] overflow-hidden rounded-[1.6rem] border border-white/10 shadow-2xl">
      <Image
        alt="Branded customer menu and live order progress screens"
        className="object-cover"
        fill
        sizes="(max-width: 1024px) 90vw, 590px"
        src="/images/restaurants/restaurant-customer-ordering-app-v1.png"
      />
      <div className="absolute left-3 top-1/2 hidden w-32 -translate-y-1/2 space-y-2 sm:block lg:left-4 lg:w-36">
        {customerAppHighlights.map(({ icon: Icon, label }, index) => (
          <div
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2.5 shadow-lg backdrop-blur-md ${
              index === 1
                ? 'border-[#f7c928] bg-[#f7c928] text-[#2b0746]'
                : 'border-white/20 bg-[#2b0746]/90 text-white'
            }`}
            key={label}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-lg ${index === 1 ? 'bg-white/55' : 'bg-white/10'}`}
            >
              <Icon className="size-3.5" strokeWidth={2.25} />
            </span>
            <span className="text-[10px] font-black leading-4">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const customerAppHighlights = [
  { icon: Store, label: 'Your own brand' },
  { icon: BadgeCheck, label: 'Direct orders' },
  { icon: BellRing, label: 'Live updates' },
] as const

function CustomerOrderJourneyPanel() {
  return (
    <div className="mt-4 rounded-[1.35rem] border border-white/12 bg-white/[.07] p-4 sm:p-5">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#f7c928]">A complete order journey</p>
          <h4 className="mt-1.5 text-base font-black text-white">Easy from choosing to collection.</h4>
        </div>
        <p className="text-xs text-white/45">No marketplace detour</p>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-3">
        {customerOrderJourneySteps.map(({ icon: Icon, title, description }) => (
          <li className="rounded-xl bg-white/[.07] p-3" key={title}>
            <span className="grid size-8 place-items-center rounded-lg bg-[#f7c928] text-[#2b0746]">
              <Icon className="size-3.5" strokeWidth={2.3} />
            </span>
            <p className="mt-3 text-xs font-black text-white">{title}</p>
            <p className="mt-1 text-[10px] leading-4 text-white/50">{description}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

const customerOrderJourneySteps = [
  { icon: Search, title: 'Choose', description: 'Browse a clear, current menu.' },
  { icon: UtensilsCrossed, title: 'Make it yours', description: 'Select options before checkout.' },
  { icon: ListChecks, title: 'Stay informed', description: 'Follow each order status.' },
] as const

function OwnerDashboardMockup() {
  return (
    <div className="mt-10 overflow-hidden rounded-[1.6rem] border border-[#dfd1e5] bg-[#f8f4fa] p-4 shadow-xl sm:p-5">
      <div className="relative mb-5 aspect-[1.6/1] overflow-hidden rounded-[1.2rem] bg-[#fffaf0]">
        <Image
          alt="Restaurant analytics dashboard with sales, order and branch reporting"
          className="object-cover"
          fill
          sizes="(max-width: 1024px) 90vw, 650px"
          src="/images/restaurants/restaurant-control-dashboard-v2.png"
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#7b6a82]">Today&apos;s operation</p>
          <p className="mt-1 text-lg font-black text-[#27172e]">Live overview</p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-[#def7e6] px-3 py-2 text-[10px] font-black text-[#176b39]">
          <span className="size-2 rounded-full bg-[#26a95b]" /> Open
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          ['Orders', '42'],
          ['Sales', '58k'],
          ['Ready', '7'],
        ].map(([label, value]) => (
          <div className="rounded-2xl bg-white p-3" key={label}>
            <p className="text-[9px] text-[#806f87]">{label}</p>
            <p className="mt-2 text-xl font-black text-[#2b0746]">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-white p-4">
        <div className="flex h-40 items-end gap-2 sm:h-48">
          {[42, 64, 38, 78, 54, 92, 68, 84].map((height, index) => (
            <span
              className={`flex-1 rounded-t-md ${index === 5 ? 'bg-[#f7c928]' : 'bg-[#7d36ae]'}`}
              key={index}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-[9px] text-[#8a798f]">
          <span>12 pm</span><span>4 pm</span><span>8 pm</span>
        </div>
      </div>
    </div>
  )
}
