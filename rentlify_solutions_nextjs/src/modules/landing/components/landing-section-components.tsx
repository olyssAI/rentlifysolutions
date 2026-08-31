import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { PropsWithChildren } from 'react'

export const landingPageShellClassName = 'mx-auto w-[min(1440px,calc(100%-4rem))] max-md:w-[calc(100%-2rem)]'

export function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="mb-12 max-w-3xl">
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6d35b4]">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-bold leading-[1.05] tracking-[-.05em] md:text-6xl">{title}</h2>
      {copy ? <p className="mt-5 max-w-2xl text-base leading-7 text-[#655e6b]">{copy}</p> : null}
    </div>
  )
}

export function PrimaryLink({ children, href }: PropsWithChildren<{ href: string }>) {
  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6d35b4] px-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(77,35,123,.18)] transition hover:-translate-y-0.5 hover:bg-[#35165d]"
      href={href}
    >
      {children}
      <ArrowRight aria-hidden="true" size={16} />
    </Link>
  )
}

export function SecondaryLink({ children, href }: PropsWithChildren<{ href: string }>) {
  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#cfc5d4] bg-white px-4 text-sm font-bold transition hover:-translate-y-0.5 hover:border-[#6d35b4] hover:text-[#6d35b4]"
      href={href}
    >
      {children}
    </Link>
  )
}
