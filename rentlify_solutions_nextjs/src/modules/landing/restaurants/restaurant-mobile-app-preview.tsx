import { Clock3, Heart, Home, MapPin, Search, ShoppingBag, Star } from 'lucide-react'
import Image from 'next/image'

export function RestaurantMobileAppPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[330px] rounded-[2.7rem] border-[7px] border-stone-950 bg-[#fffaf4] p-3 shadow-[0_40px_100px_-30px_rgba(54,15,12,.6)]">
      <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-stone-950" />
      <div className="flex items-center justify-between px-2 pb-3">
        <div>
          <p className="text-[10px] font-medium text-stone-500">Delivering to</p>
          <p className="flex items-center gap-1 text-xs font-semibold text-stone-900">
            <MapPin className="size-3 text-red-600" /> Islamabad
          </p>
        </div>
        <button
          aria-label="Search menu"
          className="grid size-8 place-items-center rounded-full border border-stone-200 bg-white"
        >
          <Search className="size-4" />
        </button>
      </div>
      <div className="relative h-44 overflow-hidden rounded-[1.5rem]">
        <Image alt="Crispy chicken meal" className="object-cover" fill sizes="320px" src="/restaurant-hero.png" />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <span className="mb-2 inline-block rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-bold text-stone-950">
            20% off today
          </span>
          <p className="text-xl font-bold tracking-[-.04em]">The golden crunch</p>
          <p className="text-[11px] text-white/80">Hot, crispy and made when you order.</p>
        </div>
      </div>
      <div className="flex items-center justify-between py-4">
        <div>
          <p className="text-sm font-bold text-stone-950">Ember Chicken</p>
          <p className="mt-1 flex gap-2 text-[10px] text-stone-500">
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              4.8
            </span>
            <span className="flex items-center gap-1">
              <Clock3 className="size-3" />
              25–35 min
            </span>
          </p>
        </div>
        <Heart className="size-5 text-red-600" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['Chicken', 'Meals', 'Sides'].map((category, categoryIndex) => (
          <div
            className={`rounded-xl px-2 py-2 text-center text-[10px] font-semibold ${categoryIndex === 0 ? 'bg-red-600 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`}
            key={category}
          >
            {category}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-stone-100">
        <Image alt="" className="size-14 rounded-xl object-cover" height={56} src="/restaurant-hero.png" width={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-stone-950">Firecracker Box</p>
          <p className="mt-1 text-[10px] text-stone-500">2 pcs · wedges · dip</p>
          <p className="mt-1 text-xs font-bold text-red-600">Rs 1,190</p>
        </div>
        <span className="grid size-8 place-items-center rounded-full bg-red-600 text-white">
          <ShoppingBag className="size-4" />
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 border-t border-stone-200 pt-3 text-stone-400">
        {[
          [Home, 'Home'],
          [Search, 'Menu'],
          [ShoppingBag, 'Orders'],
        ].map(([Icon, label], navigationIndex) => (
          <div
            className={`flex flex-col items-center gap-1 ${navigationIndex === 0 ? 'text-red-600' : ''}`}
            key={label as string}
          >
            <Icon className="size-4" />
            <span className="text-[9px]">{label as string}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
