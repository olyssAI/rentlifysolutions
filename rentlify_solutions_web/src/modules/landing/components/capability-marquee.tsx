import { capabilities } from '@/modules/landing/landing-content'

export function CapabilityMarquee() {
  const track = [...capabilities, ...capabilities]

  return (
    <section className="border-b border-border/70 py-12" aria-labelledby="capability-marquee-title">
      <div className="section-shell">
        <h2
          className="text-center text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
          id="capability-marquee-title"
        >
          What the app covers
        </h2>
      </div>

      <div className="group relative mt-7 overflow-hidden py-1.5" aria-hidden="true">
        <ul className="flex w-max animate-marquee items-stretch gap-3 group-hover:[animation-play-state:paused]">
          {track.map(({ icon: Icon, label }, index) => (
            <li
              className="flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground/80"
              key={`${label}-${index}`}
            >
              <Icon className="size-4 text-primary" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <ul className="sr-only">
        {capabilities.map(({ label }) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </section>
  )
}
