import { ArrowUpRight, Check } from 'lucide-react'
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
    <section className="bg-white py-20 lg:py-28" id="complete-platform">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#6f2da8]">Built around restaurant work</p>
          <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-.04em] text-[#27172e] sm:text-5xl">
            Everything your team needs to serve customers and run the day.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#75677c] sm:text-lg">
            Start with ordering and menu management, then bring kitchen, delivery, customer activity and reporting into
            the same dependable setup.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurantCapabilities.map(({ icon: Icon, title, description }, index) => (
            <StaggerItem
              className={`group relative min-h-52 overflow-hidden rounded-[1.75rem] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(72,34,91,.12)] ${
                index === 1 || index === 7
                  ? 'border-[#f7c928] bg-[#f7c928]'
                  : index === 4
                    ? 'border-[#2b0746] bg-[#2b0746] text-white'
                    : 'border-[#e7ddea] bg-[#fffaf0]'
              }`}
              key={title}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid size-12 place-items-center rounded-2xl ${
                    index === 4 ? 'bg-white/10 text-[#f7c928]' : 'bg-white text-[#6f2da8] shadow-sm'
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <ArrowUpRight
                  className={`size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 ${
                    index === 4 ? 'text-white/45' : 'text-[#6f2da8]/45'
                  }`}
                />
              </div>
              <h3 className={`mt-8 text-xl font-black ${index === 4 ? 'text-white' : 'text-[#2d1d33]'}`}>{title}</h3>
              <p className={`mt-3 max-w-sm text-sm leading-6 ${index === 4 ? 'text-white/60' : 'text-[#75677c]'}`}>
                {description}
              </p>
              <span
                className={`absolute bottom-5 right-6 text-xs font-black ${index === 4 ? 'text-white/15' : 'text-[#6f2da8]/15'}`}
              >
                0{index + 1}
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

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
        alt="Gracio Foods customer menu and live order progress screens"
        className="object-cover"
        fill
        sizes="(max-width: 1024px) 90vw, 590px"
        src="/images/restaurants/restaurant-customer-ordering-app-v1.png"
      />
    </div>
  )
}

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
