import { ArrowUpRight, Dumbbell, GraduationCap, HeartPulse, Scissors, ShoppingBag, Store } from 'lucide-react'
import Link from 'next/link'
import { Reveal, Stagger, StaggerItem } from '@/components/motion-reveal'

const industryResearchDirections = [
  {
    icon: HeartPulse,
    number: '01',
    name: 'Clinics',
    question: 'Can appointments, patient communication, and daily administration feel simpler?',
    signals: ['Appointments', 'Patient access', 'Staff workflow'],
  },
  {
    icon: Dumbbell,
    number: '02',
    name: 'Gyms & fitness',
    question: 'Can memberships, class schedules, and member engagement live in one useful experience?',
    signals: ['Memberships', 'Classes', 'Engagement'],
  },
  {
    icon: GraduationCap,
    number: '03',
    name: 'Academies',
    question: 'Can enrolment, schedules, communication, and progress become easier to manage?',
    signals: ['Enrolment', 'Schedules', 'Communication'],
  },
  {
    icon: ShoppingBag,
    number: '04',
    name: 'Retail',
    question: 'Can independent shops connect discovery, repeat customers, and daily operations?',
    signals: ['Catalogue', 'Customers', 'Operations'],
  },
  {
    icon: Scissors,
    number: '05',
    name: 'Salons & beauty',
    question: 'Can bookings, services, staff availability, and customer retention work together?',
    signals: ['Bookings', 'Services', 'Retention'],
  },
  {
    icon: Store,
    number: '06',
    name: 'Service businesses',
    question: 'Can enquiries, scheduling, customer records, and follow up become one clear flow?',
    signals: ['Enquiries', 'Scheduling', 'Follow up'],
  },
] as const

export function UpcomingSolutionsIndustryRoadmapSection() {
  return (
    <section className="bg-[#fffdf8] py-24 lg:py-32">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="grid gap-10 lg:grid-cols-[180px_1fr_370px]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.2em] text-[#6d35b4]">Research map</span>
            <strong className="mt-3 block text-5xl [font-family:var(--font-fraunces)]">01</strong>
          </div>
          <h2 className="text-5xl leading-[.96] tracking-[-.06em] md:text-7xl">
            Six sectors.
            <br />
            <em className="font-normal text-[#6d35b4] [font-family:var(--font-fraunces)]">Six open questions.</em>
          </h2>
          <p className="self-end leading-7 text-[#655e6b]">
            We are listening for repeated, expensive problems that a focused digital product could solve well.
          </p>
        </Reveal>
        <Stagger className="mt-14 grid border-l border-t border-[#2c2033] md:grid-cols-2 xl:grid-cols-3">
          {industryResearchDirections.map(({ icon: IndustryIcon, number, name, question, signals }) => (
            <StaggerItem
              className="group flex min-h-[360px] flex-col border-b border-r border-[#2c2033] p-6 transition hover:bg-[#24162c] hover:text-white"
              key={name}
            >
              <div className="flex items-start justify-between">
                <IndustryIcon className="text-[#6d35b4] group-hover:text-[#f5c84c]" size={26} />
                <span className="text-xs font-black">{number}</span>
              </div>
              <div className="mt-auto">
                <h3 className="text-3xl font-bold">{name}</h3>
                <p className="mt-4 leading-7 text-[#655e6b] group-hover:text-white/65">{question}</p>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-[#2c2033]/30 pt-5 group-hover:border-white/20">
                  {signals.map((signal) => (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider text-[#6d35b4] group-hover:text-[#f5c84c]"
                      key={signal}
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-8 flex justify-end">
          <Link
            className="group inline-flex h-11 items-center gap-2 border border-[#6d35b4] px-5 text-sm font-bold text-[#6d35b4] transition hover:bg-[#6d35b4] hover:text-white"
            href="/contact"
          >
            Suggest another industry
            <ArrowUpRight className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
