import { ArrowLeft, BellRing } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from '@/components/motion-reveal'
import { landingPageShellClassName } from '@/modules/landing/components/landing-section-components'

type ComingSoonPageProps = { eyebrow: string; title: string; description: string }

export function ComingSoonPage({ eyebrow, title, description }: ComingSoonPageProps) {
  return (
    <main className="grid min-h-[68vh] items-center bg-[#fbf8f2] py-20">
      <div className={`${landingPageShellClassName} grid items-center gap-14 lg:grid-cols-[1fr_.75fr] lg:gap-24`}>
        <Reveal>
          <span className="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-[#6d35b4] text-white">
            <BellRing size={22} />
          </span>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6d35b4]">{eyebrow}</p>
          <h1 className="my-4 max-w-3xl text-5xl font-bold leading-none tracking-[-.06em] md:text-7xl">{title}</h1>
          <p className="max-w-2xl text-lg leading-8 text-[#655e6b]">{description}</p>
          <Link
            className="mt-7 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#cfc5d4] bg-white px-4 text-sm font-bold transition hover:border-[#6d35b4] hover:text-[#6d35b4]"
            href="/"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>
        </Reveal>
        <Reveal className="border border-[#e6e0e8] bg-white p-8 shadow-[18px_18px_0_#f2edf5] md:p-11" delay={0.1}>
          <span className="text-[11px] font-extrabold uppercase text-[#6d35b4]">In progress</span>
          <strong className="my-5 block text-2xl">Something useful is being prepared.</strong>
          <p className="leading-7 text-[#655e6b]">
            We will publish this page when it can help you take a real next step.
          </p>
        </Reveal>
      </div>
    </main>
  )
}
