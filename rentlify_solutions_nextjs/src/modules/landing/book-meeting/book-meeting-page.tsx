import { ArrowUpRight, CalendarDays, Check, Clock3, MessageSquareText, Video } from 'lucide-react'
import { Reveal } from '@/components/motion-reveal'

const calendlyBookingUrl = 'https://calendly.com/olysstech/30min'

const meetingDetails = [
  { icon: Clock3, label: 'Focused introduction', detail: 'A short conversation about your current business need.' },
  {
    icon: Video,
    label: 'Online meeting',
    detail: 'Join from a phone or computer using the link in your confirmation.',
  },
  {
    icon: MessageSquareText,
    label: 'Practical next step',
    detail: 'Leave knowing whether Rentlify is relevant and what follows.',
  },
] as const

export function BookMeetingPage() {
  return (
    <main className="bg-[#f4f0f6] py-14 lg:py-24">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <div className="grid gap-10 lg:grid-cols-[430px_1fr] lg:gap-14">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#6d35b4]">Book a meeting</p>
            <h1 className="mt-6 text-6xl leading-[.88] tracking-[-.07em] md:text-7xl">
              Let us talk about the{' '}
              <em className="font-normal text-[#6d35b4] [font-family:var(--font-fraunces)]">business first.</em>
            </h1>
            <p className="mt-7 text-lg leading-8 text-[#655e6b]">
              Choose a suitable time to explain what you are trying to improve. You do not need a finished feature list
              or technical brief.
            </p>
            <div className="mt-9 grid gap-6 border-y border-[#2c2033] py-8">
              {meetingDetails.map(({ icon: DetailIcon, label, detail }) => (
                <div className="grid grid-cols-[34px_1fr] gap-3" key={label}>
                  <DetailIcon className="mt-1 text-[#6d35b4]" size={20} />
                  <div>
                    <h2 className="font-bold">{label}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#655e6b]">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7">
              <p className="text-xs leading-5 text-[#655e6b]">
                If the calendar does not load, open the scheduling page directly.
              </p>
              <a
                className="group mt-3 inline-flex h-11 items-center gap-2 border border-[#6d35b4] bg-white px-5 text-sm font-bold text-[#6d35b4] transition hover:bg-[#6d35b4] hover:text-white"
                href={calendlyBookingUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open Calendly
                <ArrowUpRight
                  className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  size={15}
                />
              </a>
            </div>
          </Reveal>

          <Reveal className="overflow-hidden border border-[#2c2033] bg-white" delay={0.08}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ded6e2] p-5 md:px-7">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center bg-[#6d35b4] text-white">
                  <CalendarDays size={19} />
                </span>
                <div>
                  <h2 className="font-bold">Choose your meeting time</h2>
                  <p className="text-xs text-[#655e6b]">Times are displayed by Calendly in your local timezone.</p>
                </div>
              </div>
              <span className="flex items-center gap-2 text-xs font-bold text-[#34865c]">
                <Check size={14} /> Live availability
              </span>
            </div>
            <iframe
              allow="fullscreen"
              className="h-[760px] w-full bg-white"
              loading="lazy"
              src={calendlyBookingUrl}
              title="Schedule a meeting with Rentlify Solutions using Calendly"
            />
          </Reveal>
        </div>
      </div>
    </main>
  )
}
