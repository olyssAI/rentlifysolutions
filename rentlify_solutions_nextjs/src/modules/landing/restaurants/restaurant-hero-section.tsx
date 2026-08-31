import { ArrowRight, Bell, Check, ChevronRight, PackageX, Utensils } from 'lucide-react'
import Link from 'next/link'
import { RestaurantMobileAppPreview } from './restaurant-mobile-app-preview'

const restaurantAssurances = [
  'One app per restaurant',
  'Dine-in, takeaway and delivery',
  'Managed from a phone',
] as const

export function RestaurantHeroSection() {
  return (
    <section className="border-b border-[#e7ddd4] bg-[#fcf7ef] pb-20 pt-12 lg:pb-28 lg:pt-16" id="restaurant-top">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-16 px-5 lg:grid-cols-[1.05fr_.95fr] lg:gap-12 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-semibold leading-[.96] tracking-[-.055em] text-balance sm:text-6xl lg:text-7xl">
            Your restaurant.
            <br />
            <span className="text-[#dc3b2f]">Their favourite app.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#746b66]">
            A branded ordering app for your restaurant, with the menu, offers and orders managed from one place. Your
            customers order from you, not from a marketplace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#dc3b2f] px-6 text-base font-semibold text-white hover:bg-[#c93127]"
              href="/book-a-meeting"
            >
              Book a demo <ArrowRight size={16} />
            </Link>
            <a
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#e0d6ce] bg-white px-6 text-base font-semibold hover:bg-[#f1ece7]"
              href="#restaurant-platform"
            >
              See the platform <ChevronRight size={16} />
            </a>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#746b66]">
            {restaurantAssurances.map((assurance) => (
              <li className="flex items-center gap-2" key={assurance}>
                <span className="grid size-5 place-items-center rounded-full bg-[#e4f6e9] text-[#32865c]">
                  <Check className="size-3" />
                </span>
                {assurance}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex items-center gap-4 border-t border-[#e7ddd4] pt-7">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#2c2825] text-white">
              <Utensils className="size-5" />
            </span>
            <p className="max-w-sm text-sm leading-6 text-[#746b66]">
              Now opening to a first group of restaurants shaping the platform alongside us.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-end">
          <div className="order-2 grid w-full max-w-[330px] gap-3 sm:max-w-none sm:grid-cols-2 lg:order-1 lg:w-56 lg:shrink-0 lg:grid-cols-1">
            {[
              [Bell, 'New order', '#1048 received', 'bg-[#e4f6e9] text-[#32865c]'],
              [PackageX, 'Buffalo Wings', 'Marked sold out', 'bg-[#f1ece7] text-[#746b66]'],
            ].map(([Icon, eyebrow, title, iconClassName]) => (
              <div
                className="flex items-center gap-3 rounded-xl border border-[#e7ddd4] bg-white p-3"
                key={title as string}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconClassName as string}`}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-[#746b66]">{eyebrow as string}</p>
                  <p className="font-semibold">{title as string}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="order-1 w-[330px] max-w-full shrink-0 lg:order-2">
            <RestaurantMobileAppPreview />
          </div>
        </div>
      </div>
    </section>
  )
}
