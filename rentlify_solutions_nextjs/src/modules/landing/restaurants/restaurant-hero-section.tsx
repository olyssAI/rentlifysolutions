import { ArrowRight, Check, ChefHat, CircleDollarSign } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Reveal } from '@/components/motion-reveal'

const restaurantHeroBenefits = [
  'Direct customer ordering',
  'Menu and kitchen control',
  'Live restaurant reporting',
] as const

export function RestaurantHeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#2b0746] text-white" id="restaurant-top">
      <div className="absolute right-0 top-0 h-56 w-32 rounded-bl-[7rem] bg-[#f7c928] sm:w-52 lg:h-full lg:w-[12%] lg:rounded-bl-[12rem]" />
      <div className="absolute bottom-0 left-0 h-3 w-2/5 bg-[#f7c928]" />
      <div aria-hidden="true" className="absolute left-[47%] top-16 hidden grid-cols-4 gap-3 opacity-20 lg:grid">
        {Array.from({ length: 16 }, (_, index) => (
          <span className="size-1.5 rounded-full bg-[#f7c928]" key={index} />
        ))}
      </div>

      <div className="relative mx-auto grid min-h-[720px] w-[min(1540px,calc(100%-3rem))] items-center gap-16 py-16 max-md:w-[calc(100%-1.5rem)] lg:grid-cols-[.76fr_1.24fr] lg:py-20">
        <Reveal className="relative z-10 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[.17em] text-[#f7c928]">
            Restaurant software without the upfront build
          </p>
          <h1 className="mt-6 text-[clamp(2.7rem,4.5vw,4.8rem)] font-black leading-[.95] tracking-[-.05em] text-balance">
            Run your restaurant <span className="text-[#f7c928]">from one place.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            Your own ordering experience for customers, with practical tools for menus, orders, kitchen work,
            locations and daily performance.
          </p>

          <ul className="mt-7 grid gap-3 text-sm sm:grid-cols-2">
            {restaurantHeroBenefits.map((benefit) => (
              <li className="flex items-center gap-3 text-white/80" key={benefit}>
                <span className="grid size-6 place-items-center rounded-full bg-[#f7c928] text-[#2b0746]">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f7c928] px-5 text-sm font-black text-[#2b0746] transition hover:-translate-y-0.5 hover:bg-white"
              href="/book-a-meeting"
            >
              Book a restaurant demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
              href="#complete-platform"
            >
              See what is included
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/15 pt-6 text-xs text-white/55">
            <span className="flex items-center gap-2"><CircleDollarSign className="size-4 text-[#f7c928]" /> No marketplace commission</span>
            <span className="flex items-center gap-2"><ChefHat className="size-4 text-[#f7c928]" /> Built for restaurant teams</span>
          </div>
        </Reveal>

        <Reveal className="relative z-10 mx-auto w-full max-w-[900px] lg:mr-[-2vw]" delay={0.12}>
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_38px_90px_rgba(13,2,18,.38)]">
            <Image
              alt="Restaurant owner dashboard with customer ordering app"
              className="object-cover"
              fill
              priority
              sizes="(max-width: 1024px) 94vw, 58vw"
              src="/images/restaurants/restaurant-platform-real-dashboard-v5.png"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
