import { RentlifyBusinessModelSection } from './rentlify-business-model-section'
import { RentlifyHeroSection } from './rentlify-hero-section'
import {
  RentlifyPartnershipJourneySection,
  RentlifySolutionProofSection,
} from './rentlify-solution-proof-and-partnership-sections'
import {
  RentlifyAudienceSection,
  RentlifyClosingSection,
  RentlifyServicesSection,
} from './rentlify-services-and-audience-sections'

export function HomePage() {
  return (
    <main>
      <RentlifyHeroSection />
      <RentlifyBusinessModelSection />
      <RentlifyServicesSection />
      <RentlifySolutionProofSection />
      <RentlifyPartnershipJourneySection />
      <RentlifyAudienceSection />
      <RentlifyClosingSection />
    </main>
  )
}
