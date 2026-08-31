import { ArrowRight, BadgeDollarSign, KeyRound, TrendingUp } from 'lucide-react'
import { Reveal } from '@/components/motion-reveal'

export function RentlifyBusinessModelSection() {
  return (
    <section className="scroll-mt-20 bg-[#fffdf8] py-24 lg:py-32" id="monthly-model">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="grid border-y border-[#2c2033] lg:grid-cols-[180px_1fr]">
          <div className="border-b border-[#2c2033] p-5 lg:border-b-0 lg:border-r">
            <span className="text-xs font-bold uppercase tracking-[.2em] text-[#6d35b4]">The model</span>
            <strong className="mt-3 block text-5xl [font-family:var(--font-fraunces)]">02</strong>
          </div>
          <div className="p-6 md:p-10">
            <p className="max-w-5xl text-[clamp(2.6rem,5vw,5.8rem)] leading-[.95] tracking-[-.06em]">
              Stop waiting to{' '}
              <span className="text-[#8d8491] line-through decoration-[#f5c84c] decoration-[5px]">buy</span> technology.{' '}
              <em className="font-normal text-[#6d35b4] [font-family:var(--font-fraunces)]">Access it.</em>
            </p>
          </div>
        </Reveal>
        <div className="grid lg:grid-cols-[1fr_88px_1fr]">
          <Reveal className="border-b border-x border-[#2c2033] p-7 md:p-10">
            <BadgeDollarSign className="text-[#8d8491]" size={28} />
            <span className="mt-10 block text-xs font-bold uppercase tracking-[.18em] text-[#8d8491]">
              Traditional route
            </span>
            <h3 className="mt-3 text-3xl font-bold">Large upfront cost</h3>
            <p className="mt-4 max-w-lg leading-7 text-[#655e6b]">
              A major development bill before the business has learned whether customers will adopt the solution.
            </p>
          </Reveal>
          <div className="hidden items-center justify-center border-b border-r border-[#2c2033] lg:flex">
            <ArrowRight size={27} />
          </div>
          <Reveal className="border-b border-x border-[#2c2033] bg-[#f5c84c] p-7 md:p-10" delay={0.08}>
            <KeyRound size={28} />
            <span className="mt-10 block text-xs font-bold uppercase tracking-[.18em]">Rentlify route</span>
            <h3 className="mt-3 text-3xl font-bold">Monthly digital access</h3>
            <p className="mt-4 max-w-lg leading-7 text-[#433b25]">
              A focused, branded solution that starts working for the business without the heavy beginning.
            </p>
          </Reveal>
        </div>
        <div className="grid md:grid-cols-3">
          {[
            ['BUILD', 'We turn the business need into a focused digital product.'],
            ['BRAND', 'The customer sees your name, identity, and experience.'],
            ['RENT', 'You access the solution through a predictable monthly plan.'],
          ].map(([title, description], processIndex) => (
            <div
              className="relative border-b border-x border-[#2c2033] p-7 md:border-l-0 md:first:border-l"
              key={title}
            >
              <span className="text-xs font-bold text-[#6d35b4]">0{processIndex + 1}</span>
              <h3 className="mt-7 text-xl font-black tracking-[.12em]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#655e6b]">{description}</p>
              {processIndex < 2 ? (
                <span className="absolute right-5 top-5 grid size-9 place-items-center border border-[#cfc5d4] bg-[#f4f0f6] text-[#6d35b4]">
                  <ArrowRight className="rotate-90 md:rotate-0" size={17} />
                </span>
              ) : (
                <TrendingUp className="absolute bottom-5 right-5 text-[#34865c]" size={19} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
