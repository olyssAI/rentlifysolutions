import { Clock3, MapPin, MessagesSquare, ShieldCheck } from 'lucide-react'
import { Reveal } from '@/components/motion-reveal'
import { ContactEnquiryForm } from './contact-enquiry-form'

const contactExpectations = [
  {
    icon: MessagesSquare,
    title: 'Useful context first',
    description: 'Tell us the problem before discussing features.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    description: 'Your enquiry is not published or used for marketing.',
  },
  { icon: Clock3, title: 'Reply within 24 hours', description: 'Our team will respond within one business day.' },
] as const

export function ContactPage() {
  return (
    <main className="bg-[#f4f0f6] py-14 lg:py-24">
      <div className="mx-auto w-[min(1500px,calc(100%-3rem))] max-md:w-[calc(100%-1.5rem)]">
        <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#6d35b4]">Contact Rentlify</p>
            <h1 className="mt-6 text-6xl leading-[.88] tracking-[-.07em] md:text-8xl">
              Start with the{' '}
              <em className="font-normal text-[#6d35b4] [font-family:var(--font-fraunces)]">real problem.</em>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#655e6b]">
              Share what your business is trying to improve. We will use the detail to decide whether Rentlify is a
              useful fit and what the next conversation should cover.
            </p>
            <div className="mt-10 flex items-center gap-3 border-y border-[#2c2033] py-4 text-sm font-bold">
              <MapPin className="text-[#6d35b4]" size={18} /> Islamabad, Pakistan
            </div>
            <div className="mt-8 grid gap-5">
              {contactExpectations.map(({ icon: ExpectationIcon, title, description }) => (
                <div className="grid grid-cols-[36px_1fr] gap-3" key={title}>
                  <ExpectationIcon className="mt-1 text-[#6d35b4]" size={20} />
                  <div>
                    <h2 className="font-bold">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#655e6b]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <ContactEnquiryForm />
          </Reveal>
        </div>
      </div>
    </main>
  )
}
