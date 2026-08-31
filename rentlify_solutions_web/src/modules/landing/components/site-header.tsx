import { ChevronRight, LayoutDashboard, LogIn, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { usePageScrolled } from '@/modules/landing/hooks/use-page-scrolled'
import { navigationLinks } from '@/modules/landing/landing-content'
import { SectionNavigationButton } from '@/modules/landing/components/section-navigation-button'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const isScrolled = usePageScrolled()

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-colors duration-200',
        isScrolled
          ? 'border-b border-border bg-background/85 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/70'
          : 'border-b border-transparent bg-surface-warm',
      )}
    >
      <div className="section-shell flex h-16 items-center justify-between gap-6">
        <SectionNavigationButton
          className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          sectionId="top"
        >
          <BrandMark />
          <span className="sr-only">Rentlify Solutions home</span>
        </SectionNavigationButton>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navigationLinks.map((link) => (
            <SectionNavigationButton
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              sectionId={link.href.slice(1)}
              key={link.href}
            >
              {link.label}
            </SectionNavigationButton>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="pill" className="h-9" asChild>
            <Link to="/login">
              <LogIn data-icon="inline-start" /> Login
            </Link>
          </Button>
          <Button size="pill" className="h-9" asChild>
            <Link to="/dashboard">
              Dashboard <LayoutDashboard data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button className="rounded-full md:hidden" variant="outline" size="icon" aria-label="Open navigation">
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>

          <SheetContent className="w-[min(19rem,86vw)] gap-0 p-0" showCloseButton={false}>
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle>
                <BrandMark />
              </SheetTitle>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>
            </SheetHeader>

            <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile navigation">
              <ul className="grid gap-1">
                {navigationLinks.map((link) => (
                  <li key={link.href}>
                    <SheetClose asChild>
                      <SectionNavigationButton
                        className="flex items-center justify-between rounded-xl px-4 py-3 text-[0.95rem] font-medium transition-colors hover:bg-muted active:bg-muted"
                        sectionId={link.href.slice(1)}
                      >
                        {link.label}
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </SectionNavigationButton>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </nav>

            <SheetFooter className="gap-2 border-t border-border p-4">
              <SheetClose asChild>
                <Button variant="outline" size="pill" className="w-full" asChild>
                  <Link to="/login">
                    <LogIn data-icon="inline-start" /> Login
                  </Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button size="pill" className="w-full" asChild>
                  <Link to="/dashboard">
                    Dashboard <LayoutDashboard data-icon="inline-end" />
                  </Link>
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
