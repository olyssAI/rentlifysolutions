import { useHashScroll } from '@/app/hooks/use-hash-scroll'
import { BenefitsSection } from '@/modules/landing/components/benefits-section'
import { CallToActionSection } from '@/modules/landing/components/call-to-action-section'
import { CapabilityMarquee } from '@/modules/landing/components/capability-marquee'
import { HeroSection } from '@/modules/landing/components/hero-section'
import { HowItWorksSection } from '@/modules/landing/components/how-it-works-section'
import { PlatformShowcaseSection } from '@/modules/landing/components/platform-showcase-section'
import { QuestionsSection } from '@/modules/landing/components/questions-section'
import { ScenariosSection } from '@/modules/landing/components/scenarios-section'
import { SiteFooter } from '@/modules/landing/components/site-footer'
import { SiteHeader } from '@/modules/landing/components/site-header'
import { SectionNavigationButton } from '@/modules/landing/components/section-navigation-button'

export function LandingPage() {
  useHashScroll()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SectionNavigationButton
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
        sectionId="main-content"
      >
        Skip to content
      </SectionNavigationButton>

      <SiteHeader />

      <main id="main-content">
        <HeroSection />
        <CapabilityMarquee />
        <BenefitsSection />
        <HowItWorksSection />
        <PlatformShowcaseSection />
        <ScenariosSection />
        <QuestionsSection />
        <CallToActionSection />
      </main>

      <SiteFooter />
    </div>
  )
}
