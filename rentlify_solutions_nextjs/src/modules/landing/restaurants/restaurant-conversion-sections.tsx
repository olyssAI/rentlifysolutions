import { ArrowRight, Building2, Check, MapPin, ShieldCheck, Store, UsersRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Reveal } from '@/components/motion-reveal'

import { growthTools, trustPoints } from './restaurant-landing-content'
import { RestaurantQuestionsAccordion } from './restaurant-questions-accordion'

export function RestaurantLiveOperationsSection() {
  return (
    <section className="scroll-mt-24 bg-[#2b0746] py-24 text-white lg:py-32" id="during-service">
      <div className="mx-auto grid w-[min(1500px,calc(100%-3rem))] items-center gap-14 max-md:w-[calc(100%-1.5rem)] lg:grid-cols-[1.15fr_.85fr]">
        <Reveal className="relative min-h-[520px] overflow-hidden rounded-[2.5rem] border border-white/10">
          <Image alt="Kitchen order display guiding restaurant preparation" className="object-cover" fill sizes="(max-width: 1024px) 94vw, 58vw" src="/images/restaurants/restaurant-kitchen-display-v1.png" />
          <div className="absolute inset-0 bg-[#190324]/20" />
          <div className="absolute inset-x-6 bottom-6 grid gap-3 sm:grid-cols-3">
            {['Orders are visible', 'Kitchen stays aligned', 'Decisions use live data'].map((label) => <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[#2b0746]/80 p-3 text-xs font-bold backdrop-blur-md" key={label}><Check className="size-4 text-[#f7c928]" />{label}</div>)}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#f7c928]">When the restaurant gets busy</p>
          <h2 className="mt-5 text-3xl font-black leading-[1.02] tracking-[-.045em] sm:text-5xl">Less chasing. More control when it gets busy.</h2>
          <p className="mt-6 text-lg leading-8 text-white/65">When an item runs out, an order changes state or one branch needs attention, the team should see it without calls, paper slips and repeated updates.</p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {[['One live order queue', 'Counter and kitchen work from the same status.'], ['Instant availability', 'Stop selling an unavailable item everywhere.'], ['Clear team access', 'Give people only the controls their role needs.'], ['A view of every branch', 'See what is happening without being in every location.']].map(([title, detail]) => <div className="border-l border-[#f7c928]/50 pl-4" key={title}><p className="font-black">{title}</p><p className="mt-2 text-sm leading-6 text-white/50">{detail}</p></div>)}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function RestaurantGrowthSection() {
  return (
    <section className="scroll-mt-24 bg-[#fffdf8] py-24 lg:py-32" id="restaurant-growth">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="grid gap-7 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#6f2da8]">Give customers a reason to return</p><h2 className="mt-5 text-3xl font-black leading-[1.02] tracking-[-.045em] text-[#27172e] sm:text-5xl">The next order should be easier than the first.</h2></div>
          <p className="max-w-xl text-lg leading-8 text-[#75677c] lg:justify-self-end">Run your own offers, recognize repeat customers and learn what people come back for, without sending them through somebody else&apos;s marketplace.</p>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {growthTools.map(({ icon: Icon, title, description }, index) => <Reveal className={`rounded-[1.8rem] border p-6 ${index === 1 ? 'border-[#f7c928] bg-[#f7c928]' : 'border-[#e8dfea] bg-white'}`} delay={index * 0.06} key={title}><span className="grid size-12 place-items-center rounded-2xl bg-[#2b0746] text-white"><Icon className="size-5" /></span><h3 className="mt-7 text-xl font-black tracking-[-.03em] text-[#27172e]">{title}</h3><p className={`mt-3 text-sm leading-6 ${index === 1 ? 'text-[#2b0746]/65' : 'text-[#75677c]'}`}>{description}</p></Reveal>)}
        </div>
      </div>
    </section>
  )
}

export function RestaurantScaleSection() {
  return (
    <section className="scroll-mt-24 border-y border-[#e5d8e9] bg-[#f1e8f6] py-24 lg:py-32" id="multiple-branches">
      <div className="mx-auto grid w-[min(1500px,calc(100%-3rem))] items-center gap-14 max-md:w-[calc(100%-1.5rem)] lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#6f2da8]">One restaurant or a growing group</p>
          <h2 className="mt-5 text-3xl font-black leading-[1.02] tracking-[-.045em] text-[#27172e] sm:text-5xl">Keep the brand consistent. Let every branch operate locally.</h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#75677c]">Each location can keep its own hours, prices, availability and orders. You can still check every branch without calling each manager.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">{trustPoints.map(({ icon: Icon, label }) => <div className="flex items-start gap-3 rounded-2xl bg-white p-4" key={label}><Icon className="mt-0.5 size-5 shrink-0 text-[#6f2da8]" /><p className="text-sm font-bold leading-6 text-[#46364d]">{label}</p></div>)}</div>
        </Reveal>
        <Reveal className="rounded-[2.5rem] bg-white p-5 shadow-[0_30px_80px_rgba(63,17,89,.13)] sm:p-8" delay={0.1}>
          <div className="flex items-center justify-between border-b border-[#eadfed] pb-5"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-[#7d6d84]">Location network</p><p className="mt-1 text-xl font-black text-[#27172e]">All branches</p></div><Building2 className="size-7 text-[#6f2da8]" /></div>
          <div className="mt-5 grid gap-3">{[['F 7 Markaz', 'Open', '18 live orders'], ['Blue Area', 'Open', '11 live orders'], ['Bahria Town', 'Opening soon', 'Setup in progress']].map(([location, status, detail], index) => <div className="flex items-center gap-4 rounded-2xl border border-[#eadfed] p-4" key={location}><span className={`grid size-12 place-items-center rounded-2xl ${index === 2 ? 'bg-[#f1e8f6] text-[#6f2da8]' : 'bg-[#f7c928] text-[#2b0746]'}`}>{index === 2 ? <Store className="size-5" /> : <MapPin className="size-5" />}</span><div className="min-w-0 flex-1"><p className="font-black text-[#27172e]">{location}</p><p className="mt-1 text-xs text-[#7d6d84]">{detail}</p></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${index === 2 ? 'bg-[#f1e8f6] text-[#6f2da8]' : 'bg-[#def7e6] text-[#176b39]'}`}>{status}</span></div>)}</div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#2b0746] p-5 text-white"><div className="flex items-center gap-3"><UsersRound className="size-5 text-[#f7c928]" /><div><p className="text-sm font-black">Protected team access</p><p className="mt-1 text-[10px] text-white/55">Roles and restaurant scope</p></div></div><ShieldCheck className="size-5 text-[#f7c928]" /></div>
        </Reveal>
      </div>
    </section>
  )
}

export function RestaurantQuestionsAndCallToActionSection() {
  return (
    <>
      <section className="bg-white py-24 lg:py-32" id="restaurant-questions"><div className="mx-auto grid w-[min(1320px,calc(100%-3rem))] gap-12 max-md:w-[calc(100%-1.5rem)] lg:grid-cols-[.7fr_1.3fr]"><Reveal><p className="text-xs font-black uppercase tracking-[.2em] text-[#6f2da8]">Before we talk</p><h2 className="mt-5 text-3xl font-black tracking-[-.045em] text-[#27172e] sm:text-4xl">Questions restaurant owners usually ask.</h2></Reveal><RestaurantQuestionsAccordion /></div></section>
      <section className="bg-[#f7c928] py-16 sm:py-20"><div className="mx-auto flex w-[min(1400px,calc(100%-3rem))] flex-col items-start justify-between gap-8 max-md:w-[calc(100%-1.5rem)] lg:flex-row lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#5e227f]">Tell us how your restaurant works today</p><h2 className="mt-4 max-w-4xl text-3xl font-black leading-[1.02] tracking-[-.045em] text-[#2b0746] sm:text-5xl">We&apos;ll show you what the setup would look like for your team.</h2></div><Link className="group inline-flex min-h-14 shrink-0 items-center gap-3 rounded-full bg-[#2b0746] px-7 text-sm font-black text-white transition hover:bg-white hover:text-[#2b0746]" href="/book-a-meeting">Book a restaurant demo<ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link></div></section>
    </>
  )
}
