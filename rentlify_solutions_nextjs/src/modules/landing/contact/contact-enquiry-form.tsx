'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CalendarDays, Check, CheckCircle2, LoaderCircle, RefreshCw, Send } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useState } from 'react'
import { Controller, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { ContactEnquiryRequestError, submitContactEnquiry } from './contact-enquiry-api'
import { contactEnquirySchema, type ContactEnquiryInput } from './contact-enquiry-schema'

const industryOptions = [
  ['RESTAURANT', 'Restaurant or fast food'],
  ['CLINIC', 'Clinic'],
  ['GYM', 'Gym or fitness'],
  ['ACADEMY', 'Academy or education'],
  ['RETAIL', 'Retail'],
  ['SALON', 'Salon or beauty'],
  ['OTHER', 'Other'],
] as const

const helpTypeOptions = [
  ['MOBILE_APP', 'Mobile application'],
  ['WEBSITE', 'Website or web application'],
  ['BUSINESS_SOFTWARE', 'Business software'],
  ['COMPLETE_SOLUTION', 'Complete digital solution'],
  ['NOT_SURE', 'I need guidance'],
] as const

const defaultValues: DefaultValues<ContactEnquiryInput> = {
  name: '',
  email: '',
  phone: '',
  businessName: '',
  message: '',
  website: '',
}

function RequiredMarker() {
  return <span className="text-red-600">*</span>
}

function FieldMessage({ error, description }: { error?: string; description: string }) {
  return (
    <p className={`mt-1.5 text-xs leading-5 ${error ? 'font-medium text-red-600' : 'text-[#746b66]'}`}>
      {error ?? description}
    </p>
  )
}

export function ContactEnquiryForm() {
  const reduceMotion = useReducedMotion()
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'error' | 'success'>('idle')
  const [submissionError, setSubmissionError] = useState('')
  const form = useForm<ContactEnquiryInput>({ resolver: zodResolver(contactEnquirySchema), defaultValues })
  const messageValue = useWatch({ control: form.control, name: 'message' }) ?? ''

  const submitValidEnquiry = async (values: ContactEnquiryInput) => {
    setSubmissionStatus('idle')
    setSubmissionError('')
    try {
      await submitContactEnquiry(values)
      form.reset(defaultValues)
      setSubmissionStatus('success')
    } catch (error) {
      setSubmissionStatus('error')
      setSubmissionError(
        error instanceof ContactEnquiryRequestError
          ? error.message
          : 'We could not send your enquiry. Check your connection and try again.',
      )
    }
  }

  const handleSubmit = form.handleSubmit(submitValidEnquiry)

  if (submissionStatus === 'success') {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[680px] overflow-hidden border border-[#2c2033] bg-white"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative overflow-hidden bg-[#24162c] p-8 text-white md:p-11">
          <div className="absolute -right-16 -top-16 size-48 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-8 size-32 rounded-full border border-white/10" />
          <motion.span
            animate={reduceMotion ? undefined : { scale: [0.8, 1.08, 1] }}
            className="relative grid size-16 place-items-center bg-[#f5c84c] text-[#24162c]"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <CheckCircle2 size={31} />
          </motion.span>
          <p className="relative mt-8 text-xs font-black uppercase tracking-[.18em] text-[#f5c84c]">Enquiry received</p>
          <h2 className="relative mt-3 max-w-xl text-5xl leading-[.95] tracking-[-.06em]">
            Thank you. Your context is now with Rentlify.
          </h2>
          <p className="relative mt-5 max-w-xl leading-7 text-white/65">
            Your details were recorded securely for human review. Nothing else is required from you right now.
          </p>
        </div>
        <div className="p-8 md:p-11">
          <h3 className="text-xs font-black uppercase tracking-[.18em] text-[#6d35b4]">What happens next</h3>
          <div className="mt-6 grid gap-4">
            {[
              'We review the business problem and outcome you described.',
              'We decide whether Rentlify is a useful fit for the need.',
              'The next conversation can focus on decisions instead of repeated context.',
            ].map((nextStep, nextStepIndex) => (
              <div className="grid grid-cols-[32px_1fr] gap-3 border-b border-[#ded6e2] pb-4" key={nextStep}>
                <span className="grid size-7 place-items-center bg-[#e4f6e9] text-xs font-black text-[#34865c]">
                  {nextStepIndex + 1}
                </span>
                <p className="text-sm leading-6 text-[#655e6b]">{nextStep}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="group inline-flex h-11 items-center gap-2 bg-[#6d35b4] px-5 text-sm font-bold text-white"
              href="/book-a-meeting"
            >
              <CalendarDays size={16} /> Book a meeting
              <ArrowRight className="transition group-hover:translate-x-1" size={15} />
            </Link>
            <Button
              className="h-11 rounded-none border-[#6d35b4] px-5 font-bold text-[#6d35b4] hover:bg-[#ede5f4]"
              onClick={() => setSubmissionStatus('idle')}
              type="button"
              variant="outline"
            >
              Send another enquiry
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <form className="border border-[#2c2033] bg-white p-6 md:p-9" noValidate onSubmit={handleSubmit}>
      <div className="flex items-end justify-between gap-5 border-b border-[#ded6e2] pb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#6d35b4]">Business enquiry</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Tell us what you need.</h2>
        </div>
        <span className="text-xs text-[#746b66]">
          <RequiredMarker /> Required
        </span>
      </div>

      {submissionStatus === 'error' ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 border border-[#b73a4a] bg-[#fff1f2]"
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          role="alert"
        >
          <div className="flex gap-4 p-5">
            <span className="grid size-10 shrink-0 place-items-center bg-[#b73a4a] text-white">
              <RefreshCw size={18} />
            </span>
            <div>
              <h3 className="font-bold text-[#7c2430]">Your details are still here.</h3>
              <p className="mt-1 text-sm leading-6 text-[#7c2430]">{submissionError}</p>
              <p className="mt-2 text-xs leading-5 text-[#8f5960]">
                Nothing was cleared. Review the fields or retry the same enquiry.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e8b7bd] px-5 py-3">
            <span className="flex items-center gap-2 text-xs font-bold text-[#7c2430]">
              <Check size={14} /> Your information is preserved
            </span>
            <Button
              className="h-9 rounded-none bg-[#7c2430] px-4 font-bold text-white hover:bg-[#651c27]"
              disabled={form.formState.isSubmitting}
              onClick={() => void handleSubmit()}
              type="button"
            >
              {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
              Try again
            </Button>
          </div>
        </motion.div>
      ) : null}

      <div className="mt-7 grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold">
            Full name <RequiredMarker />
          </span>
          <Input
            aria-invalid={Boolean(form.formState.errors.name)}
            autoComplete="name"
            className="mt-2 h-11 rounded-none border-[#cfc5d4]"
            placeholder="Your full name"
            {...form.register('name')}
          />
          <FieldMessage
            description="The person we should address in our reply."
            error={form.formState.errors.name?.message}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold">
            Work email <RequiredMarker />
          </span>
          <Input
            aria-invalid={Boolean(form.formState.errors.email)}
            autoComplete="email"
            className="mt-2 h-11 rounded-none border-[#cfc5d4]"
            inputMode="email"
            placeholder="you@business.com"
            type="email"
            {...form.register('email')}
          />
          <FieldMessage
            description="We use this only to respond to your enquiry."
            error={form.formState.errors.email?.message}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold">Phone number</span>
          <Input
            aria-invalid={Boolean(form.formState.errors.phone)}
            autoComplete="tel"
            className="mt-2 h-11 rounded-none border-[#cfc5d4]"
            inputMode="tel"
            placeholder="+92 300 0000000"
            type="tel"
            {...form.register('phone')}
          />
          <FieldMessage
            description="Optional. Include it if a call is easier for you."
            error={form.formState.errors.phone?.message}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold">
            Business name <RequiredMarker />
          </span>
          <Input
            aria-invalid={Boolean(form.formState.errors.businessName)}
            autoComplete="organization"
            className="mt-2 h-11 rounded-none border-[#cfc5d4]"
            placeholder="Your business name"
            {...form.register('businessName')}
          />
          <FieldMessage
            description="This helps us understand who the solution is for."
            error={form.formState.errors.businessName?.message}
          />
        </label>
        <fieldset>
          <legend className="text-sm font-bold" id="industry-label">
            Industry <RequiredMarker />
          </legend>
          <Controller
            control={form.control}
            name="industry"
            render={({ field }) => (
              <RadioGroup
                aria-invalid={Boolean(form.formState.errors.industry)}
                aria-labelledby="industry-label"
                className="mt-2 grid grid-cols-2 gap-2"
                onValueChange={field.onChange}
                value={field.value ?? null}
              >
                {industryOptions.map(([value, label]) => (
                  <label
                    className="flex min-h-11 cursor-pointer items-center gap-3 border border-[#cfc5d4] px-3 py-2 text-sm transition-colors has-data-checked:border-[#6d35b4] has-data-checked:bg-[#f2ebf8] has-data-checked:font-semibold"
                    key={value}
                  >
                    <RadioGroupItem value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </RadioGroup>
            )}
          />
          <FieldMessage
            description="Choose the closest match so we can prepare relevant questions."
            error={form.formState.errors.industry?.message}
          />
        </fieldset>
        <fieldset>
          <legend className="text-sm font-bold" id="help-type-label">
            What do you need? <RequiredMarker />
          </legend>
          <Controller
            control={form.control}
            name="helpType"
            render={({ field }) => (
              <RadioGroup
                aria-invalid={Boolean(form.formState.errors.helpType)}
                aria-labelledby="help-type-label"
                className="mt-2 grid grid-cols-2 gap-2"
                onValueChange={field.onChange}
                value={field.value ?? null}
              >
                {helpTypeOptions.map(([value, label]) => (
                  <label
                    className="flex min-h-11 cursor-pointer items-center gap-3 border border-[#cfc5d4] px-3 py-2 text-sm transition-colors has-data-checked:border-[#6d35b4] has-data-checked:bg-[#f2ebf8] has-data-checked:font-semibold"
                    key={value}
                  >
                    <RadioGroupItem value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </RadioGroup>
            )}
          />
          <FieldMessage
            description="It is fine to choose guidance if you are still deciding."
            error={form.formState.errors.helpType?.message}
          />
        </fieldset>
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-bold">
          Business need <RequiredMarker />
        </span>
        <Textarea
          aria-invalid={Boolean(form.formState.errors.message)}
          className="mt-2 min-h-36 resize-y rounded-none border-[#cfc5d4]"
          maxLength={2_000}
          placeholder="Describe the problem, who experiences it, and what a useful outcome would look like."
          {...form.register('message')}
        />
        <div className="flex items-start justify-between gap-4">
          <FieldMessage
            description="Include enough context for a useful first conversation."
            error={form.formState.errors.message?.message}
          />
          <span className="mt-1.5 shrink-0 text-xs text-[#746b66]">{messageValue.length}/2000</span>
        </div>
      </label>

      <div aria-hidden="true" className="absolute -left-[10000px]" tabIndex={-1}>
        <label>
          Website
          <Input autoComplete="off" tabIndex={-1} {...form.register('website')} />
        </label>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#ded6e2] pt-6">
        <p className="max-w-md text-xs leading-5 text-[#746b66]">
          Your details are used only to assess and respond to this enquiry. They are not added to a marketing list.
        </p>
        <Button
          className="h-11 rounded-none bg-[#6d35b4] px-5 font-bold text-white hover:bg-[#4d237b]"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <Send />}
          {form.formState.isSubmitting ? 'Sending enquiry' : 'Send enquiry'}
        </Button>
      </div>
    </form>
  )
}
