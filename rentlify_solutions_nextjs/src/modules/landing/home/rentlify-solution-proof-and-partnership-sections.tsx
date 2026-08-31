import {
  ArrowRight,
  BadgeCheck,
  ChartNoAxesCombined,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquareText,
  Rocket,
  Smartphone,
  UtensilsCrossed,
} from 'lucide-react'
import Link from 'next/link'
import { Reveal, Stagger, StaggerItem } from '@/components/motion-reveal'

const restaurantSolutionSurfaces = [
  {
    icon: Smartphone,
    label: 'Customer experience',
    detail: 'A branded mobile journey for menu discovery and ordering.',
  },
  {
    icon: LayoutDashboard,
    label: 'Business control',
    detail: 'A practical workspace for menus, locations, orders, and insights.',
  },
  {
    icon: ChartNoAxesCombined,
    label: 'Useful visibility',
    detail: 'Real activity and performance signals in one clear view.',
  },
] as const

const partnershipSteps = [
  {
    icon: MessageSquareText,
    number: '01',
    title: 'Understand',
    description: 'We identify the business problem, customer journey, and smallest useful release.',
  },
  {
    icon: ClipboardCheck,
    number: '02',
    title: 'Shape',
    description: 'We agree the scope, brand direction, monthly plan, and a clear delivery path.',
  },
  {
    icon: Rocket,
    number: '03',
    title: 'Launch',
    description: 'We build, verify, and introduce the solution with your business identity.',
  },
  {
    icon: BadgeCheck,
    number: '04',
    title: 'Improve',
    description: 'Real customer feedback guides the next practical improvement after launch.',
  },
] as const

export function RentlifySolutionProofSection() {
  return (
    <section className="bg-[#f4f0f6] py-24 lg:py-32">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="grid border-y border-[#2c2033] lg:grid-cols-[180px_1fr]">
          <div className="border-b border-[#2c2033] p-5 lg:border-b-0 lg:border-r">
            <span className="text-xs font-bold uppercase tracking-[.2em] text-[#6d35b4]">Proof in practice</span>
            <strong className="mt-3 block text-5xl [font-family:var(--font-fraunces)]">04</strong>
          </div>
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="p-7 md:p-10 lg:p-14">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[#34865c]">
                <span className="size-2 rounded-full bg-[#34865c]" /> Available now
              </span>
              <h2 className="mt-7 max-w-4xl text-5xl leading-[.95] tracking-[-.06em] md:text-7xl">
                Our restaurant solution is not an idea.{' '}
                <em className="font-normal text-[#6d35b4] [font-family:var(--font-fraunces)]">
                  It is a working system.
                </em>
              </h2>
            </div>
            <div className="flex min-h-80 flex-col justify-between border-t border-[#2c2033] bg-[#f5c84c] p-7 lg:border-l lg:border-t-0">
              <UtensilsCrossed size={36} />
              <div>
                <p className="text-sm leading-6 text-[#4d4326]">
                  See how one focused solution connects the customer experience with daily restaurant operations.
                </p>
                <Link
                  className="group mt-7 inline-flex h-11 items-center gap-2 border border-[#2c2033] px-4 text-sm font-bold"
                  href="/restaurants"
                >
                  Explore restaurants <ArrowRight className="transition group-hover:translate-x-1" size={15} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
        <Stagger className="grid md:grid-cols-3">
          {restaurantSolutionSurfaces.map(({ icon: SurfaceIcon, label, detail }, surfaceIndex) => (
            <StaggerItem className="border-b border-x border-[#2c2033] p-7 md:border-l-0 md:first:border-l" key={label}>
              <div className="flex items-center justify-between">
                <SurfaceIcon className="text-[#6d35b4]" size={24} />
                <span className="text-xs font-bold text-[#8d8491]">0{surfaceIndex + 1}</span>
              </div>
              <h3 className="mt-10 text-2xl font-bold">{label}</h3>
              <p className="mt-3 max-w-sm leading-7 text-[#655e6b]">{detail}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export function RentlifyPartnershipJourneySection() {
  return (
    <section className="bg-[#fffdf8] py-24 lg:py-32">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="grid gap-10 lg:grid-cols-[180px_1fr_380px]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.2em] text-[#6d35b4]">Working together</span>
            <strong className="mt-3 block text-5xl [font-family:var(--font-fraunces)]">05</strong>
          </div>
          <h2 className="text-5xl leading-[.96] tracking-[-.06em] md:text-7xl">
            From business need to{' '}
            <em className="font-normal text-[#6d35b4] [font-family:var(--font-fraunces)]">useful launch.</em>
          </h2>
          <p className="self-end leading-7 text-[#655e6b]">
            A simple process keeps the first release focused, understandable, and ready for real customer feedback.
          </p>
        </Reveal>
        <Stagger className="mt-14 grid border-l border-t border-[#2c2033] md:grid-cols-2 xl:grid-cols-4">
          {partnershipSteps.map(({ icon: StepIcon, number, title, description }) => (
            <StaggerItem className="min-h-72 border-b border-r border-[#2c2033] p-6" key={title}>
              <div className="flex items-start justify-between">
                <StepIcon className="text-[#6d35b4]" size={25} />
                <span className="text-xs font-black">{number}</span>
              </div>
              <h3 className="mt-20 text-3xl font-bold">{title}</h3>
              <p className="mt-4 leading-7 text-[#655e6b]">{description}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-8 flex flex-wrap items-center justify-between gap-5 border-b border-[#2c2033] pb-8">
          <p className="text-sm font-bold">Have a business problem that needs a practical digital solution?</p>
          <Link
            className="group inline-flex h-11 items-center gap-2 bg-[#6d35b4] px-5 text-sm font-bold text-white"
            href="/book-a-meeting"
          >
            Talk through your idea <ArrowRight className="transition group-hover:translate-x-1" size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
