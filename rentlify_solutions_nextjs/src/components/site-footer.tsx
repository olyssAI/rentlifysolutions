import { ArrowRight, ArrowUpRight, Layers3, MapPin } from 'lucide-react'
import Link from 'next/link'

const solutionLinks = [
  { label: 'Restaurants', href: '/restaurants' },
  { label: 'Upcoming solutions', href: '/upcoming-solutions' },
] as const

const companyLinks = [
  { label: 'Home', href: '/' },
  { label: 'Contact', href: '/contact' },
  { label: 'Book a meeting', href: '/book-a-meeting' },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-[#f5c84c] bg-[#18101f] text-white">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] py-12 max-md:w-[calc(100%-1.5rem)] sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.7fr_.7fr_1fr] lg:gap-8">
          <div>
            <Link className="inline-flex items-center gap-3" href="/" aria-label="Rentlify Solutions home">
              <span className="grid size-10 place-items-center bg-[#6d35b4]">
                <Layers3 size={19} aria-hidden="true" />
              </span>
              <span>
                <strong className="block text-lg leading-none">Rentlify</strong>
                <small className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-[#c99bea]">
                  Solutions
                </small>
              </span>
            </Link>
            <p className="mt-5 max-w-sm leading-7 text-white/55">
              Mobile apps, websites, and business software through practical monthly plans.
            </p>
            <p className="mt-5 flex items-center gap-2 text-sm text-white/40">
              <MapPin size={14} aria-hidden="true" />
              Islamabad, Pakistan
            </p>
          </div>

          <FooterLinkColumn title="Solutions" links={solutionLinks} />
          <FooterLinkColumn title="Company" links={companyLinks} />

          <div className="border-l border-white/15 pl-6 max-lg:border-l-0 max-lg:border-t max-lg:pt-8 max-lg:pl-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5c84c]">Have a business idea?</p>
            <p className="mt-4 max-w-xs text-xl font-semibold leading-7">
              Let&apos;s find the right digital starting point.
            </p>
            <Link
              className="group mt-6 inline-flex min-h-11 items-center gap-3 bg-white px-4 py-2.5 text-sm font-bold text-[#24152d] transition-colors hover:bg-[#f5c84c]"
              href="/book-a-meeting"
            >
              Book a meeting
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/15 pt-6 text-xs text-white/35 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Rentlify Solutions. All rights reserved.</p>
          <Link
            className="group inline-flex w-fit items-center gap-2 font-semibold text-white/60 transition-colors hover:text-white"
            href="https://app.rentlifysolutions.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            Business login
            <ArrowUpRight
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              size={14}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </footer>
  )
}

type FooterLinkColumnProps = {
  title: string
  links: ReadonlyArray<{ label: string; href: string }>
}

function FooterLinkColumn({ title, links }: FooterLinkColumnProps) {
  return (
    <nav aria-label={`${title} footer navigation`}>
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5c84c]">{title}</h2>
      <ul className="mt-5 grid gap-3">
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link className="text-sm text-white/55 transition-colors hover:text-white" href={href}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
