import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { submitApiFormWithFieldErrors } from '@/api/apply-api-field-errors-to-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RestaurantDetails, RestaurantLocation } from '@/modules/restaurants/api/restaurant-api'
import {
  type FulfillmentMethodValue,
  type LocationWeeklyOpeningHoursFormValues,
  locationWeeklyOpeningHoursFormSchema,
} from '@/modules/restaurants/validation/location-weekly-opening-hours-form-schema'

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const fulfillmentLabels: Record<FulfillmentMethodValue, string> = {
  DELIVERY: 'Delivery',
  PICKUP: 'Pickup',
  DINE_IN: 'Dine-in',
}
const timeOptions = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4)
  const minutes = (index % 4) * 15
  const value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  const displayHours = hours % 12 || 12
  return { value, label: `${displayHours}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}` }
})

interface ConfigureLocationWeeklyOpeningHoursDialogProps {
  enabledFulfillmentMethods: FulfillmentMethodValue[]
  isOpen: boolean
  isSubmitting: boolean
  location: RestaurantLocation
  openingHours: RestaurantDetails['openingHours']
  onOpenChange: (open: boolean) => void
  onSubmit: (values: LocationWeeklyOpeningHoursFormValues) => Promise<void>
}

export function ConfigureLocationWeeklyOpeningHoursDialog({
  enabledFulfillmentMethods,
  isOpen,
  isSubmitting,
  location,
  openingHours,
  onOpenChange,
  onSubmit,
}: ConfigureLocationWeeklyOpeningHoursDialogProps) {
  const [selectedFulfillmentMethods, setSelectedFulfillmentMethods] =
    useState<FulfillmentMethodValue[]>(enabledFulfillmentMethods)
  const [selectedRegularScheduleDays, setSelectedRegularScheduleDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0])
  const [regularScheduleOpeningTime, setRegularScheduleOpeningTime] = useState('09:00')
  const [regularScheduleClosingTime, setRegularScheduleClosingTime] = useState('22:00')
  const {
    control,
    getValues,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<LocationWeeklyOpeningHoursFormValues>({
    resolver: zodResolver(locationWeeklyOpeningHoursFormSchema),
    defaultValues: {
      hours: openingHours.map(({ dayOfWeek, fulfillmentType, opensAt, closesAt }) => ({
        dayOfWeek,
        fulfillmentType,
        opensAt,
        closesAt,
      })),
    },
  })
  const { replace } = useFieldArray({ control, name: 'hours' })
  const watchedHours = useWatch({ control, name: 'hours' })

  useEffect(() => {
    if (isOpen)
      reset({
        hours: openingHours.map(({ dayOfWeek, fulfillmentType, opensAt, closesAt }) => ({
          dayOfWeek,
          fulfillmentType,
          opensAt,
          closesAt,
        })),
      })
  }, [isOpen, openingHours, reset])

  const availableSelectedFulfillmentMethods = selectedFulfillmentMethods.filter((method) =>
    enabledFulfillmentMethods.includes(method),
  )
  const effectiveSelectedFulfillmentMethods =
    availableSelectedFulfillmentMethods.length > 0 ? availableSelectedFulfillmentMethods : enabledFulfillmentMethods

  const applyRegularSchedule = () => {
    const retainedRanges = getValues('hours').filter(
      ({ dayOfWeek, fulfillmentType }) =>
        !effectiveSelectedFulfillmentMethods.includes(fulfillmentType) ||
        !selectedRegularScheduleDays.includes(dayOfWeek),
    )
    const appliedRanges = effectiveSelectedFulfillmentMethods.flatMap((fulfillmentType) =>
      selectedRegularScheduleDays.map((dayOfWeek) => ({
        dayOfWeek,
        fulfillmentType,
        opensAt: regularScheduleOpeningTime,
        closesAt: regularScheduleClosingTime,
      })),
    )
    replace([...retainedRanges, ...appliedRanges])
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isSubmitting) onOpenChange(open)
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={() => onOpenChange(true)}>
          <CalendarClock data-icon="inline-start" /> Opening hours
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (isDirty) event.preventDefault()
        }}
        onInteractOutside={(event) => {
          if (isDirty) event.preventDefault()
        }}
      >
        <DialogHeader>
          <div className="mb-1 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="size-5" />
          </div>
          <DialogTitle>Configure weekly opening hours</DialogTitle>
          <DialogDescription>
            Select fulfillment methods and days, then apply their opening and closing time together. To set a special
            day, select only that day and apply its different time. A closing time earlier than opening time means
            service continues overnight.
          </DialogDescription>
        </DialogHeader>
        <form
          id={`weekly-opening-hours-form-${location.id}`}
          className="grid gap-6"
          noValidate
          onSubmit={handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, onSubmit, setError, {
              hours: 'hours',
              'hours.*': 'hours.0.opensAt',
            }),
          )}
        >
          {errors.hours?.[0]?.opensAt?.message ? (
            <p className="text-sm text-destructive">{errors.hours[0]?.opensAt?.message}</p>
          ) : null}
          <div className="flex flex-wrap gap-2" aria-label="Fulfillment schedule">
            {enabledFulfillmentMethods.map((fulfillmentType) => (
              <Button
                aria-pressed={effectiveSelectedFulfillmentMethods.includes(fulfillmentType)}
                key={fulfillmentType}
                type="button"
                variant={effectiveSelectedFulfillmentMethods.includes(fulfillmentType) ? 'default' : 'outline'}
                onClick={() =>
                  setSelectedFulfillmentMethods((current) =>
                    current.includes(fulfillmentType)
                      ? current.filter((method) => method !== fulfillmentType)
                      : [...current, fulfillmentType],
                  )
                }
              >
                {fulfillmentLabels[fulfillmentType]}
              </Button>
            ))}
          </div>
          {enabledFulfillmentMethods.length > 0 ? (
            <>
              <section className="grid gap-5 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
                <div>
                  <h3 className="text-sm font-semibold">Regular weekly schedule</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Select the days that normally use the same hours, then apply them together.
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {weekdays.map((weekday, dayOfWeek) => (
                    <Button
                      aria-pressed={selectedRegularScheduleDays.includes(dayOfWeek)}
                      key={weekday}
                      size="sm"
                      type="button"
                      variant={selectedRegularScheduleDays.includes(dayOfWeek) ? 'default' : 'outline'}
                      onClick={() =>
                        setSelectedRegularScheduleDays((current) =>
                          current.includes(dayOfWeek)
                            ? current.filter((value) => value !== dayOfWeek)
                            : [...current, dayOfWeek],
                        )
                      }
                    >
                      {weekday.slice(0, 3)}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <StandaloneTimeSelect
                    label="Opens"
                    value={regularScheduleOpeningTime}
                    onValueChange={setRegularScheduleOpeningTime}
                  />
                  <StandaloneTimeSelect
                    label="Closes"
                    value={regularScheduleClosingTime}
                    onValueChange={setRegularScheduleClosingTime}
                  />
                  <Button
                    type="button"
                    disabled={
                      effectiveSelectedFulfillmentMethods.length === 0 ||
                      selectedRegularScheduleDays.length === 0 ||
                      regularScheduleOpeningTime === regularScheduleClosingTime
                    }
                    onClick={applyRegularSchedule}
                  >
                    Apply schedule
                  </Button>
                </div>
              </section>
              {enabledFulfillmentMethods.map((fulfillmentType) => (
                <section className="grid gap-3 rounded-2xl border border-border p-4" key={fulfillmentType}>
                  <h3 className="text-sm font-semibold">{fulfillmentLabels[fulfillmentType]} schedule</h3>
                  {weekdays.map((weekday, dayOfWeek) => {
                    const matchingRanges = watchedHours.filter(
                      (range) => range.dayOfWeek === dayOfWeek && range.fulfillmentType === fulfillmentType,
                    )
                    return (
                      <div className="grid gap-2 border-b border-border py-3 last:border-0" key={weekday}>
                        <div>
                          <p className="text-sm font-medium">{weekday}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {matchingRanges.length === 0
                              ? 'Closed'
                              : matchingRanges
                                  .map((range) => `${formatTime(range.opensAt)}–${formatTime(range.closesAt)}`)
                                  .join(', ')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </section>
              ))}
            </>
          ) : null}
          {enabledFulfillmentMethods.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Enable a fulfillment method before adding opening hours.
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            form={`weekly-opening-hours-form-${location.id}`}
            type="submit"
            disabled={isSubmitting || enabledFulfillmentMethods.length === 0}
          >
            {isSubmitting ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
            {isSubmitting ? 'Saving hours' : 'Save opening hours'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StandaloneTimeSelect({
  label,
  onValueChange,
  value,
}: {
  label: string
  onValueChange: (value: string) => void
  value: string
}) {
  const identifier = `regular-schedule-${label.toLowerCase()}`
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={identifier}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={identifier} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {timeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs leading-5 text-muted-foreground">
        {label === 'Opening time'
          ? 'When selected services begin accepting orders.'
          : 'When selected services stop accepting orders.'}
      </p>
    </div>
  )
}

function formatTime(value: string | undefined) {
  if (!value) return 'Time unavailable'
  const normalizedValue = value.slice(0, 5)
  return timeOptions.find((option) => option.value === normalizedValue)?.label ?? 'Time unavailable'
}
