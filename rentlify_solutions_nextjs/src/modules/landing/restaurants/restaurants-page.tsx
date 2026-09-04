import {
  RestaurantGrowthSection,
  RestaurantLiveOperationsSection,
  RestaurantQuestionsAndCallToActionSection,
  RestaurantScaleSection,
} from './restaurant-conversion-sections'
import { RestaurantHeroSection } from './restaurant-hero-section'
import {
  RestaurantCompletePlatformSection,
  RestaurantConnectedExperienceSection,
  RestaurantOperatingLoopSection,
} from './restaurant-platform-sections'

export function RestaurantsPage() {
  return (
    <main className="bg-[#fffdf8] text-[#27172e] [&_h1]:[font-family:var(--font-plus-jakarta-sans)] [&_h2]:[font-family:var(--font-plus-jakarta-sans)] [&_h3]:[font-family:var(--font-plus-jakarta-sans)]">
      <RestaurantHeroSection />
      <RestaurantCompletePlatformSection />
      <RestaurantConnectedExperienceSection />
      <RestaurantOperatingLoopSection />
      <RestaurantLiveOperationsSection />
      <RestaurantGrowthSection />
      <RestaurantScaleSection />
      <RestaurantQuestionsAndCallToActionSection />
    </main>
  )
}
