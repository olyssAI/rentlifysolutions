import {
  RestaurantCallToActionSection,
  RestaurantQuestionsSection,
  RestaurantScenariosSection,
} from './restaurant-conversion-sections'
import { RestaurantHeroSection } from './restaurant-hero-section'
import {
  RestaurantBenefitsSection,
  RestaurantCapabilityMarquee,
  RestaurantGettingStartedSection,
  RestaurantPlatformShowcaseSection,
} from './restaurant-platform-sections'

export function RestaurantsPage() {
  return (
    <main className="bg-[#fffdfa] text-[#312b27] [&_h1]:[font-family:var(--font-plus-jakarta-sans)] [&_h2]:[font-family:var(--font-plus-jakarta-sans)] [&_h3]:[font-family:var(--font-plus-jakarta-sans)]">
      <RestaurantHeroSection />
      <RestaurantCapabilityMarquee />
      <RestaurantBenefitsSection />
      <RestaurantGettingStartedSection />
      <RestaurantPlatformShowcaseSection />
      <RestaurantScenariosSection />
      <RestaurantQuestionsSection />
      <RestaurantCallToActionSection />
    </main>
  )
}
