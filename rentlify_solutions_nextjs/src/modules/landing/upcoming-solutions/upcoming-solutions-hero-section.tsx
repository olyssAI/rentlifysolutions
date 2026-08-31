import { ArrowDownRight, ArrowRight, CircleDotDashed, Lightbulb, ScanSearch } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from '@/components/motion-reveal'

export function UpcomingSolutionsHeroSection() {
  return (
    <section className="bg-[#f4f0f6] pt-10">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <div className="flex items-center justify-between border-y border-[#2c2033] py-3 text-[10px] font-bold uppercase tracking-[.2em]">
          <span>Research desk</span>
          <span className="flex items-center gap-2">
            <CircleDotDashed size={14} /> New sectors under study
          </span>
          <span className="hidden sm:block">Open to business insight</span>
        </div>
        <div className="grid min-h-[72vh] border-b border-[#2c2033] lg:grid-cols-[1fr_390px]">
          <Reveal className="flex flex-col justify-between py-14 lg:p-14 lg:pl-0">
            <div>
              <p className="mb-7 text-xs font-extrabold uppercase tracking-[.16em] text-[#6d35b4]">
                Upcoming solutions
              </p>
              <h1 className="max-w-5xl text-[clamp(4rem,8vw,8.5rem)] leading-[.8] tracking-[-.075em]">
                <span className="block font-bold">Built around</span>
                <em className="block font-normal text-[#6d35b4] [font-family:var(--font-fraunces)]">real work.</em>
              </h1>
            </div>
            <div className="mt-16 flex flex-wrap items-end justify-between gap-8">
              <p className="max-w-2xl text-lg leading-8 text-[#5f5664]">
                Rentlify will expand into new industries only when we understand the daily problems, customer journey,
                and smallest solution that can create genuine value.
              </p>
              <ArrowDownRight className="hidden text-[#6d35b4] md:block" size={44} />
            </div>
          </Reveal>
          <Reveal
            className="flex flex-col justify-between border-t border-[#2c2033] bg-[#f5c84c] p-7 lg:border-l lg:border-t-0"
            delay={0.1}
          >
            <ScanSearch size={36} />
            <div>
              <span className="text-[10px] font-black uppercase tracking-[.18em]">The rule</span>
              <blockquote className="mt-5 text-3xl leading-tight [font-family:var(--font-fraunces)]">
                “No generic templates. Every solution must earn its place.”
              </blockquote>
              <p className="mt-6 border-t border-[#2c2033]/30 pt-5 text-sm leading-6 text-[#4d4326]">
                The sectors below are research directions, not promised release dates or finished products.
              </p>
              <Link
                className="group mt-7 inline-flex h-11 items-center gap-2 bg-[#24162c] px-5 text-sm font-bold text-white"
                href="/book-a-meeting"
              >
                Share your business need
                <ArrowRight className="transition group-hover:translate-x-1" size={15} />
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="flex items-center gap-3 border-b border-[#2c2033] px-5 py-4 text-xs font-bold uppercase tracking-[.15em]">
          <Lightbulb className="text-[#6d35b4]" size={16} /> Feedback decides what moves forward
        </div>
      </div>
    </section>
  )
}
