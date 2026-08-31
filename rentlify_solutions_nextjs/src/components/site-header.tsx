'use client'

import { ArrowUpRight, Layers3, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const primaryNavigationItems = [
  { label: 'Home', href: '/' },
  { label: 'Restaurants', href: '/restaurants' },
  { label: 'Upcoming solutions', href: '/upcoming-solutions' },
  { label: 'Contact', href: '/contact' },
] as const

export function SiteHeader() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const [currentHash, setCurrentHash] = useState('')
  const currentPathname = usePathname()

  useEffect(() => {
    const updateCurrentHash = () => setCurrentHash(window.location.hash)

    updateCurrentHash()
    window.addEventListener('hashchange', updateCurrentHash)

    return () => window.removeEventListener('hashchange', updateCurrentHash)
  }, [currentPathname])

  const isNavigationItemActive = (href: string) => {
    const [itemPathname, itemHash = ''] = href.split('#')

    if (currentPathname !== itemPathname) return false
    return itemHash ? currentHash === `#${itemHash}` : true
  }

  const isMeetingPageActive = currentPathname === '/book-a-meeting'

  return (
    <header className="sticky top-0 z-50 border-b border-[#ddd5e4] bg-[#faf8fc]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] w-[min(1480px,calc(100%-4rem))] items-center gap-8 max-md:h-[62px] max-md:w-[calc(100%-2rem)]">
        <Link className="flex items-center gap-2.5" href="/" onClick={() => setIsNavigationOpen(false)}>
          <span className="grid size-9 place-items-center bg-[#6d35b4] text-white">
            <Layers3 size={18} />
          </span>
          <span className="flex flex-col leading-none">
            <strong className="text-[17px] tracking-tight">Rentlify</strong>
            <small className="mt-1 text-[9px] font-bold uppercase tracking-[.2em] text-[#6d35b4]">Solutions</small>
          </span>
        </Link>
        <nav
          aria-label="Primary navigation"
          className={`${isNavigationOpen ? 'grid' : 'hidden'} absolute inset-x-0 top-[62px] border-b border-[#ddd5e4] bg-white p-5 text-sm text-[#4f4855] md:static md:mx-auto md:flex md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0`}
        >
          {primaryNavigationItems.map(({ label, href }) => {
            const isActive = isNavigationItemActive(href)

            return (
              <Link
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center px-3 py-3 font-medium transition md:h-9 md:py-0 ${
                  isActive
                    ? 'bg-[#24162c] font-bold text-white shadow-[inset_0_-2px_0_#f5c84c]'
                    : 'hover:bg-[#f2edf5] hover:text-[#6d35b4]'
                }`}
                href={href}
                key={href}
                onClick={() => setIsNavigationOpen(false)}
              >
                {isActive ? <span aria-hidden="true" className="mr-2 size-1.5 rounded-full bg-[#f5c84c]" /> : null}
                {label}
              </Link>
            )
          })}
          <a
            className="group mx-2 mt-2 flex h-10 items-center justify-center gap-2 border border-[#6d35b4] px-4 font-bold text-[#6d35b4] transition hover:bg-[#ede5f4] md:hidden"
            href="https://app.rentlifysolutions.com"
          >
            Login <ArrowUpRight size={16} />
          </a>
          <Link
            aria-current={isMeetingPageActive ? 'page' : undefined}
            className={`mx-2 mt-2 inline-flex h-10 items-center justify-center px-4 font-bold md:hidden ${
              isMeetingPageActive ? 'border-2 border-[#6d35b4] bg-[#ede5f4] text-[#6d35b4]' : 'bg-[#6d35b4] text-white'
            }`}
            href="/book-a-meeting"
          >
            Book a meeting
          </Link>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <a
            className="group inline-flex h-9 items-center gap-2 border border-[#6d35b4] px-4 text-sm font-bold text-[#6d35b4] transition hover:bg-[#ede5f4]"
            href="https://app.rentlifysolutions.com"
          >
            Login{' '}
            <ArrowUpRight className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={16} />
          </a>
          <Link
            aria-current={isMeetingPageActive ? 'page' : undefined}
            className={`inline-flex h-9 items-center px-4 text-sm font-bold ${
              isMeetingPageActive ? 'border-2 border-[#6d35b4] bg-[#ede5f4] text-[#6d35b4]' : 'bg-[#6d35b4] text-white'
            }`}
            href="/book-a-meeting"
          >
            Book a meeting
          </Link>
        </div>
        <button
          aria-expanded={isNavigationOpen}
          aria-label={isNavigationOpen ? 'Close navigation' : 'Open navigation'}
          className="ml-auto grid size-10 place-items-center border border-[#ddd5e4] md:hidden"
          onClick={() => setIsNavigationOpen((currentState) => !currentState)}
          type="button"
        >
          {isNavigationOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}
