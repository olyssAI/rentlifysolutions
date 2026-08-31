import { ArrowDownRight, ArrowRight, Check, CircleDotDashed } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from '@/components/motion-reveal'

export function RentlifyHeroSection() {
  return (
    <section className="bg-[#f4f0f6] pt-10">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <div className="flex items-center justify-between border-y border-[#2c2033] py-3 text-[10px] font-bold uppercase tracking-[.2em]">
          <span>Technology access studio</span>
          <span className="flex items-center gap-2">
            <CircleDotDashed size={14} />
            Islamabad · Pakistan
          </span>
          <span className="hidden sm:block">Est. 2025</span>
        </div>
        <div className="grid min-h-[70vh] border-b border-[#2c2033] lg:grid-cols-[78px_1fr_390px]">
          <aside className="hidden border-r border-[#2c2033] py-8 lg:flex lg:items-end lg:justify-center">
            <span className="rotate-180 text-xs font-bold uppercase tracking-[.25em] [writing-mode:vertical-rl]">
              Digital solutions · monthly access
            </span>
          </aside>
          <Reveal className="flex flex-col justify-between py-14 lg:px-10 lg:py-16">
            <div>
              <p className="mb-7 flex items-center gap-3 text-xs font-extrabold uppercase tracking-[.16em] text-[#6d35b4]">
                Rentlify Solutions
              </p>
              <h1 className="max-w-5xl text-[clamp(4rem,8.7vw,9rem)] leading-[.78] tracking-[-.075em]">
                <span className="block font-bold">Rent your</span>
                <em className="block font-normal text-[#6d35b4] [font-family:var(--font-fraunces)]">
                  digital business.
                </em>
              </h1>
            </div>
            <div className="mt-16 flex flex-wrap items-end justify-between gap-8">
              <p className="max-w-xl text-lg leading-8 text-[#5f5664]">
                We build and brand mobile apps, websites, and business software, then make them accessible through a
                flexible monthly model.
              </p>
              <ArrowDownRight className="hidden text-[#6d35b4] md:block" size={44} />
            </div>
          </Reveal>
          <Reveal
            className="flex flex-col justify-between border-t border-[#2c2033] bg-[#24162c] p-7 text-white lg:border-l lg:border-t-0"
            delay={0.1}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#f5c84c]">
                The proposition / 01
              </span>
              <blockquote className="mt-8 text-3xl leading-tight [font-family:var(--font-fraunces)]">
                “Professional digital tools should be achievable for every serious business.”
              </blockquote>
            </div>
            <div>
              <ul className="grid gap-3 border-t border-white/15 pt-6 text-sm text-white/70">
                {['No heavy upfront build cost', 'Your identity, not ours', 'One accountable technology partner'].map(
                  (promise) => (
                    <li className="flex items-center gap-2" key={promise}>
                      <Check className="text-[#f5c84c]" size={14} />
                      {promise}
                    </li>
                  ),
                )}
              </ul>
              <div className="mt-7 grid grid-cols-2 gap-2">
                <Link
                  className="group inline-flex h-11 items-center justify-center gap-2 bg-[#f5c84c] px-4 text-sm font-bold text-[#24162c]"
                  href="/book-a-meeting"
                >
                  Start a project <ArrowRight className="transition group-hover:translate-x-1" size={15} />
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center border border-white/25 px-4 text-sm font-bold"
                  href="/restaurants"
                >
                  Live solution
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
        <div className="grid border-b border-[#2c2033] sm:grid-cols-3">
          {['MOBILE APPLICATIONS', 'WEBSITES + WEB APPS', 'CUSTOM SOFTWARE'].map((capability, capabilityIndex) => (
            <div
              className="flex items-center justify-between border-b border-[#2c2033] px-5 py-4 text-xs font-bold tracking-[.12em] last:border-0 sm:border-b-0 sm:border-r sm:last:border-0"
              key={capability}
            >
              <span>{capability}</span>
              <span className="text-[#6d35b4]">0{capabilityIndex + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
