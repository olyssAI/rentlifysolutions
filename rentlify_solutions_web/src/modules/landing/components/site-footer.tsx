import { BrandMark } from '@/components/brand-mark'
import { Separator } from '@/components/ui/separator'
import { footerColumns } from '@/modules/landing/landing-content'
import { SectionNavigationButton } from '@/modules/landing/components/section-navigation-button'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-surface-warm">
      <div className="section-shell py-14">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          <div className="max-w-xs">
            <BrandMark size="lg" />
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Branded ordering apps for restaurants, with the menu, offers and orders managed in one place.
            </p>
          </div>

          {footerColumns.map(({ title, links }) => (
            <nav aria-label={title} key={title}>
              <h2 className="text-xs font-semibold tracking-[0.16em] text-foreground uppercase">{title}</h2>
              <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
                {links.map((link) => (
                  <li key={`${title}-${link.label}`}>
                    <SectionNavigationButton
                      className="transition-colors hover:text-foreground"
                      sectionId={link.href.slice(1)}
                    >
                      {link.label}
                    </SectionNavigationButton>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Rentlify Solutions</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <SectionNavigationButton className="transition-colors hover:text-foreground" sectionId="questions">
                Privacy
              </SectionNavigationButton>
            </li>
            <li>
              <SectionNavigationButton className="transition-colors hover:text-foreground" sectionId="questions">
                Terms
              </SectionNavigationButton>
            </li>
            <li>
              <SectionNavigationButton className="transition-colors hover:text-foreground" sectionId="contact">
                hello@rentlify.solutions
              </SectionNavigationButton>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
