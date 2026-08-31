import { ArrowRight, Check, MessagesSquare, SearchCheck, Shapes, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { Reveal, Stagger, StaggerItem } from '@/components/motion-reveal'

const selectionPrinciples = [
  {
    icon: UsersRound,
    title: 'A repeated need',
    description: 'The same important problem appears across several businesses in one sector.',
  },
  {
    icon: SearchCheck,
    title: 'A clear first outcome',
    description: 'The first release can create visible value without pretending to solve everything.',
  },
  {
    icon: Shapes,
    title: 'A reusable foundation',
    description: 'The core system can serve multiple businesses while protecting each brand and its data.',
  },
  {
    icon: MessagesSquare,
    title: 'Real feedback access',
    description: 'Business owners and customers are willing to test, respond, and shape what follows.',
  },
] as const

export function UpcomingSolutionsSelectionProcessSection() {
  return (
    <section className="bg-[#24162c] py-24 text-white lg:py-32">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <Reveal className="grid gap-10 border-b border-white/20 pb-12 lg:grid-cols-[180px_1fr]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.2em] text-[#f5c84c]">What moves forward</span>
            <strong className="mt-3 block text-5xl [font-family:var(--font-fraunces)]">02</strong>
          </div>
          <h2 className="max-w-5xl text-5xl leading-[.96] tracking-[-.06em] md:text-7xl">
            We choose usefulness before{' '}
            <em className="font-normal text-[#c99bea] [font-family:var(--font-fraunces)]">feature volume.</em>
          </h2>
        </Reveal>
        <Stagger className="grid md:grid-cols-2 xl:grid-cols-4">
          {selectionPrinciples.map(({ icon: PrincipleIcon, title, description }) => (
            <StaggerItem className="border-b border-white/20 p-6 md:border-r" key={title}>
              <PrincipleIcon className="text-[#f5c84c]" size={24} />
              <h3 className="mt-14 text-2xl font-bold">{title}</h3>
              <p className="mt-4 leading-7 text-white/55">{description}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-14 grid items-end gap-10 bg-white p-7 text-[#24162c] md:p-10 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="text-xs font-black uppercase tracking-[.18em] text-[#6d35b4]">
              Help shape the next one
            </span>
            <h2 className="mt-4 max-w-4xl text-4xl leading-none tracking-[-.05em] md:text-6xl">
              Tell us where your business loses time, customers, or clarity.
            </h2>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#655e6b]">
              {['No sales pressure', 'Focused discovery', 'Honest next steps'].map((assurance) => (
                <li className="flex items-center gap-2" key={assurance}>
                  <Check className="text-[#34865c]" size={15} /> {assurance}
                </li>
              ))}
            </ul>
          </div>
          <Link
            className="group inline-flex h-11 items-center justify-center gap-2 bg-[#6d35b4] px-5 text-sm font-bold text-white"
            href="/book-a-meeting"
          >
            Book a conversation <ArrowRight className="transition group-hover:translate-x-1" size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
