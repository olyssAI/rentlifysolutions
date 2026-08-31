'use client'

import { ArrowUpRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { showcasePanels } from './restaurant-landing-content'

export function RestaurantPlatformTabs() {
  const [activePanelValue, setActivePanelValue] = useState(showcasePanels[0]?.value ?? 'menu')
  const activePanel = showcasePanels.find((panel) => panel.value === activePanelValue) ?? showcasePanels[0]
  if (!activePanel) return null
  const ActivePanelIcon = activePanel.icon
  return (
    <div className="mt-12">
      <div className="w-full overflow-x-auto px-1 py-2">
        <div className="mx-auto flex w-max gap-1 rounded-full border border-[#e7ddd4] bg-white p-1.5">
          {showcasePanels.map(({ value, label, icon: PanelIcon }) => (
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium ${activePanelValue === value ? 'bg-[#dc3b2f] text-white' : 'text-[#746b66] hover:bg-[#f1ece7]'}`}
              key={value}
              onClick={() => setActivePanelValue(value)}
              type="button"
            >
              <PanelIcon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-6 overflow-hidden rounded-3xl border border-[#e7ddd4] bg-white p-6 sm:p-9 lg:grid-cols-[1.1fr_.9fr] lg:gap-10">
        <div>
          <h3 className="text-2xl font-semibold tracking-[-.03em] sm:text-3xl">{activePanel.headline}</h3>
          <p className="mt-4 leading-7 text-[#746b66]">{activePanel.description}</p>
          <ul className="mt-7 grid gap-3">
            {activePanel.highlights.map((highlight) => (
              <li className="flex gap-3 text-sm leading-6" key={highlight}>
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#e4f6e9] text-[#32865c]">
                  <Check className="size-3" />
                </span>
                {highlight}
              </li>
            ))}
          </ul>
          <Link
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#dc3b2f]"
            href="/book-a-meeting"
          >
            Book a walkthrough <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="rounded-2xl bg-[#302b28] p-5 text-white sm:p-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <span className="grid size-9 place-items-center rounded-lg border border-white/15 bg-white/10">
              <ActivePanelIcon className="size-4" />
            </span>
            <p className="text-sm font-medium">{activePanel.previewTitle}</p>
          </div>
          <ul className="mt-2 divide-y divide-white/10">
            {activePanel.previewRows.map(({ primary, secondary, trailing, tone }) => (
              <li className="flex items-center justify-between gap-4 py-3.5" key={primary}>
                <div className="min-w-0">
                  <p className={`truncate text-sm font-medium ${tone === 'muted' ? 'text-white/45' : ''}`}>{primary}</p>
                  <p className="mt-1 truncate text-xs text-white/45">{secondary}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${tone === 'active' ? 'bg-[#dc3b2f]' : tone === 'muted' ? 'bg-white/5 text-white/40' : 'bg-white/10 text-white/80'}`}
                >
                  {trailing}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
