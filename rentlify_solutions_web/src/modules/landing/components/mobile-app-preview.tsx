import { Clock3, Heart, Home, MapPin, Search, ShoppingBag, Star } from 'lucide-react'

import restaurantHero from '@/assets/restaurant-hero.png'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function MobileAppPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[330px] rounded-[2.7rem] border-[7px] border-stone-950 bg-[#fffaf4] p-3 shadow-[0_40px_100px_-30px_rgba(54,15,12,0.6)]">
      <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-stone-950" />
      <div className="flex items-center justify-between px-2 pb-3">
        <div>
          <p className="text-[10px] font-medium text-stone-500">Delivering to</p>
          <p className="flex items-center gap-1 text-xs font-semibold text-stone-900">
            <MapPin className="size-3 text-red-600" /> Gulberg, Lahore
          </p>
        </div>
        <Button variant="outline" size="icon-sm" className="rounded-full bg-white" aria-label="Search menu">
          <Search aria-hidden="true" />
        </Button>
      </div>

      <div className="relative h-44 overflow-hidden rounded-[1.5rem]">
        <img className="h-full w-full object-cover" src={restaurantHero} alt="Crispy chicken meal" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <Badge className="mb-2 bg-amber-300 text-stone-950">20% off today</Badge>
          <p className="text-xl font-bold tracking-[-0.04em]">The golden crunch</p>
          <p className="text-[11px] text-white/75">Hot, crispy and made when you order.</p>
        </div>
      </div>

      <div className="flex items-center justify-between py-4">
        <div>
          <p className="text-sm font-bold text-stone-950">Ember Chicken</p>
          <p className="mt-0.5 flex items-center gap-2 text-[10px] text-stone-500">
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" /> 4.8
            </span>
            <span className="flex items-center gap-1">
              <Clock3 className="size-3" /> 25–35 min
            </span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-red-600"
          aria-label="Add restaurant to favorites"
        >
          <Heart className="fill-red-50" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {['Chicken', 'Meals', 'Sides'].map((category, index) => (
          <div
            key={category}
            className={`rounded-xl px-2 py-2 text-center text-[10px] font-semibold ${index === 0 ? 'bg-red-600 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`}
          >
            {category}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-stone-100">
        <img className="size-14 rounded-xl object-cover" src={restaurantHero} alt="" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-stone-950">Firecracker Box</p>
          <p className="mt-1 text-[10px] text-stone-500">2 pcs · wedges · dip</p>
          <p className="mt-1 text-xs font-bold text-red-600">Rs 1,190</p>
        </div>
        <Button
          size="icon-sm"
          className="rounded-full bg-red-600 hover:bg-red-700"
          aria-label="Add Firecracker Box to cart"
        >
          <ShoppingBag aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-3 border-t border-stone-200 pt-3 text-stone-400">
        <div className="flex flex-col items-center gap-1 text-red-600">
          <Home className="size-4" />
          <span className="text-[9px] font-semibold">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Search className="size-4" />
          <span className="text-[9px]">Menu</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ShoppingBag className="size-4" />
          <span className="text-[9px]">Orders</span>
        </div>
      </div>
    </div>
  )
}
