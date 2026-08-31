import {
  AppWindow,
  ArrowUpRight,
  Blocks,
  BriefcaseBusiness,
  Building2,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  House,
  ShoppingBag,
  Smartphone,
  Store,
  Warehouse,
} from 'lucide-react'
import Link from 'next/link'
import { Reveal, Stagger, StaggerItem } from '@/components/motion-reveal'

const services = [
  {
    icon: Smartphone,
    title: 'Mobile applications',
    type: 'Customer access',
    description: 'Branded mobile experiences designed around the action customers need to take.',
  },
  {
    icon: AppWindow,
    title: 'Websites & web applications',
    type: 'Digital presence',
    description: 'Fast websites and browser platforms that stay open for business.',
  },
  {
    icon: Blocks,
    title: 'Custom business software',
    type: 'Operations',
    description: 'Purpose-built systems that remove friction from the way teams already work.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Digital business solutions',
    type: 'Connected growth',
    description: 'One strategy connecting customer experience, internal tools, and ongoing support.',
  },
] as const
const industries = [
  { icon: Store, label: 'Restaurants & fast food', status: 'Available now' },
  { icon: ShoppingBag, label: 'Retail shops' },
  { icon: HeartPulse, label: 'Clinics' },
  { icon: Dumbbell, label: 'Gyms & fitness' },
  { icon: House, label: 'Salons & beauty' },
  { icon: Warehouse, label: 'Warehouses' },
  { icon: Building2, label: 'Manufacturers' },
  { icon: GraduationCap, label: 'Educational businesses' },
] as const

export function RentlifyServicesSection() {
  return (
    <section className="scroll-mt-20 bg-[#24162c] py-24 text-white lg:py-32" id="services">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="grid gap-8 border-b border-white/20 pb-10 lg:grid-cols-[180px_1fr]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.2em] text-[#f5c84c]">Service index</span>
            <strong className="mt-3 block text-5xl [font-family:var(--font-fraunces)]">03</strong>
          </div>
          <h2 className="max-w-5xl text-5xl leading-[.95] tracking-[-.06em] md:text-7xl">
            Everything your business needs to{' '}
            <em className="font-normal text-[#c99bea] [font-family:var(--font-fraunces)]">become digital.</em>
          </h2>
        </Reveal>
        <Stagger>
          {services.map(({ icon: ServiceIcon, title, type, description }, serviceIndex) => (
            <StaggerItem
              className="group grid items-center gap-5 border-b border-white/20 py-7 transition hover:bg-white hover:px-5 hover:text-[#24162c] md:grid-cols-[70px_1fr_180px_1fr_30px]"
              key={title}
            >
              <span className="text-xs font-bold text-[#f5c84c] group-hover:text-[#6d35b4]">0{serviceIndex + 1}</span>
              <h3 className="text-2xl font-bold md:text-3xl">{title}</h3>
              <span className="text-xs font-bold uppercase tracking-wider text-white/45 group-hover:text-[#6d35b4]">
                {type}
              </span>
              <p className="leading-7 text-white/55 group-hover:text-[#655e6b]">{description}</p>
              <ServiceIcon className="text-[#c99bea] group-hover:text-[#6d35b4]" size={22} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export function RentlifyAudienceSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="grid gap-10 lg:grid-cols-[180px_1fr_350px]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.2em] text-[#6d35b4]">Who it serves</span>
            <strong className="mt-3 block text-5xl [font-family:var(--font-fraunces)]">06</strong>
          </div>
          <h2 className="text-5xl leading-[.96] tracking-[-.06em] md:text-7xl">
            One idea.
            <br />
            <em className="font-normal text-[#6d35b4] [font-family:var(--font-fraunces)]">Many industries.</em>
          </h2>
          <p className="self-end leading-7 text-[#655e6b]">
            For small businesses taking their first digital step and growing companies ready for better systems.
          </p>
        </Reveal>
        <Stagger className="mt-14 grid border-l border-t border-[#2c2033] sm:grid-cols-2 lg:grid-cols-4">
          {industries.map(({ icon: IndustryIcon, label, ...industry }, industryIndex) => (
            <StaggerItem
              className={`relative min-h-48 border-b border-r border-[#2c2033] p-5 ${industryIndex === 0 ? 'bg-[#f5c84c]' : ''}`}
              key={label}
            >
              <div className="flex justify-between">
                <IndustryIcon className={industryIndex === 0 ? 'text-[#24162c]' : 'text-[#6d35b4]'} size={22} />
                <span className="text-[10px] font-bold">0{industryIndex + 1}</span>
              </div>
              <h3 className="mt-16 max-w-36 font-bold">{label}</h3>
              {'status' in industry ? (
                <span className="absolute bottom-4 right-4 text-[9px] font-black uppercase tracking-wider">
                  {industry.status}
                </span>
              ) : null}
            </StaggerItem>
          ))}
        </Stagger>
        <div className="mt-8 text-right">
          <Link
            className="group inline-flex h-11 items-center gap-2 border border-[#6d35b4] bg-white px-5 text-sm font-bold text-[#6d35b4] transition hover:bg-[#6d35b4] hover:text-white"
            href="/upcoming-solutions"
          >
            Explore upcoming solutions
            <ArrowUpRight className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

export function RentlifyClosingSection() {
  return (
    <section className="bg-[#6d35b4] text-white">
      <div className="mx-auto grid w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)] lg:grid-cols-[180px_1fr]">
        <div className="border-b border-white/25 py-10 lg:border-b-0 lg:border-r">
          <span className="text-xs font-bold uppercase tracking-[.2em] text-[#f5c84c]">The promise</span>
          <strong className="mt-3 block text-5xl [font-family:var(--font-fraunces)]">07</strong>
        </div>
        <Reveal className="py-14 lg:p-14">
          <h2 className="max-w-5xl text-5xl leading-[.96] tracking-[-.06em] md:text-7xl">
            Make your business digital{' '}
            <em className="font-normal text-[#f5c84c] [font-family:var(--font-fraunces)]">
              without buying everything upfront.
            </em>
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/25 pt-7">
            <p className="text-lg text-white/70">Mobile apps · Websites · Software · Monthly plans</p>
            <Link
              className="inline-flex h-11 items-center bg-white px-5 text-sm font-bold text-[#6d35b4]"
              href="/book-a-meeting"
            >
              Book a meeting
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
