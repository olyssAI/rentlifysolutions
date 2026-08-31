import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, LoaderCircle, Map, Plus, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'

import { submitApiFormWithFieldErrors } from '@/api/apply-api-field-errors-to-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  deliveryZonesFormSchema,
  specialHoursFormSchema,
  type DeliveryZonesFormValues,
  type SpecialHoursFormValues,
} from '@/modules/restaurant-owner-dashboard/validation/restaurant-owner-location-advanced-settings-form-schemas'

type CommonProps<T> = {
  open: boolean
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: T) => Promise<void>
}

export function ConfigureRestaurantOwnerSpecialHoursDialog({
  initialValues,
  enabledFulfillmentMethods,
  ...props
}: CommonProps<SpecialHoursFormValues> & {
  initialValues: SpecialHoursFormValues
  enabledFulfillmentMethods: Array<'DELIVERY' | 'PICKUP' | 'DINE_IN'>
}) {
  const form = useForm<SpecialHoursFormValues>({ resolver: zodResolver(specialHoursFormSchema), values: initialValues })
  const fields = useFieldArray({ control: form.control, name: 'specialHours' })
  const watchedSpecialHours = useWatch({ control: form.control, name: 'specialHours' })
  return (
    <Dialog open={props.open} onOpenChange={(open) => !props.submitting && props.onOpenChange(open)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={() => props.onOpenChange(true)}>
          <CalendarDays /> Special hours
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Special hours</DialogTitle>
          <DialogDescription>
            Add holiday closures or different hours for a specific service and date.
          </DialogDescription>
        </DialogHeader>
        <form
          id="owner-special-hours"
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, props.onSubmit, form.setError, {
              specialHours: 'specialHours',
              'specialHours.*': 'specialHours.0.opensAt',
            }),
          )}
        >
          {fields.fields.map((field, index) => (
            <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2" key={field.id}>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" {...form.register(`specialHours.${index}.date`)} />
                <p className="text-xs leading-5 text-muted-foreground">
                  Choose the calendar date this exception applies to.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Fulfillment</Label>
                <Controller
                  control={form.control}
                  name={`specialHours.${index}.fulfillmentType`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {enabledFulfillmentMethods.includes('DELIVERY') ? (
                          <SelectItem value="DELIVERY">Delivery</SelectItem>
                        ) : null}
                        {enabledFulfillmentMethods.includes('PICKUP') ? (
                          <SelectItem value="PICKUP">Pickup</SelectItem>
                        ) : null}
                        {enabledFulfillmentMethods.includes('DINE_IN') ? (
                          <SelectItem value="DINE_IN">Dine-in</SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  Select the service whose regular hours should be overridden.
                </p>
              </div>
              <Controller
                control={form.control}
                name={`specialHours.${index}.isClosed`}
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} />{' '}
                    Closed all day
                  </label>
                )}
              />
              <div className="grid gap-2">
                <Label>Reason</Label>
                <Input placeholder="Public holiday" {...form.register(`specialHours.${index}.reason`)} />
                <p className="text-xs leading-5 text-muted-foreground">
                  Optional internal explanation for this schedule exception.
                </p>
              </div>
              {!watchedSpecialHours[index]?.isClosed ? (
                <>
                  <div className="grid gap-2">
                    <Label>Opening time</Label>
                    <Input type="time" {...form.register(`specialHours.${index}.opensAt`)} />
                    {form.formState.errors.specialHours?.[index]?.opensAt?.message ? (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.specialHours[index]?.opensAt?.message}
                      </p>
                    ) : null}
                    <p className="text-xs leading-5 text-muted-foreground">The service start time on this date.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Closing time</Label>
                    <Input type="time" {...form.register(`specialHours.${index}.closesAt`)} />
                    <p className="text-xs leading-5 text-muted-foreground">The service end time on this date.</p>
                  </div>
                </>
              ) : null}
              <Button
                className="sm:col-span-2 sm:justify-self-end"
                type="button"
                variant="outline"
                onClick={() => fields.remove(index)}
              >
                <Trash2 /> Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              fields.append({
                date: '',
                fulfillmentType: enabledFulfillmentMethods[0] ?? 'DELIVERY',
                isClosed: true,
                opensAt: null,
                closesAt: null,
                reason: '',
              })
            }
          >
            <Plus /> Add special date
          </Button>
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={props.submitting} onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="owner-special-hours" disabled={props.submitting}>
            {props.submitting ? <LoaderCircle className="animate-spin" /> : null}
            {props.submitting ? 'Saving special hours' : 'Save special hours'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ConfigureRestaurantOwnerDeliveryZonesDialog({
  initialValues,
  ...props
}: CommonProps<DeliveryZonesFormValues> & { initialValues: DeliveryZonesFormValues }) {
  const form = useForm<DeliveryZonesFormValues>({
    resolver: zodResolver(deliveryZonesFormSchema),
    values: initialValues,
  })
  const fields = useFieldArray({ control: form.control, name: 'deliveryZones' })
  const watchedDeliveryZones = useWatch({ control: form.control, name: 'deliveryZones' })
  return (
    <Dialog open={props.open} onOpenChange={(open) => !props.submitting && props.onOpenChange(open)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={() => props.onOpenChange(true)}>
          <Map /> Delivery zones
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delivery zones</DialogTitle>
          <DialogDescription>
            Define postal-code or radius coverage. All money values are entered in PKR.
          </DialogDescription>
        </DialogHeader>
        <form
          id="owner-delivery-zones"
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, props.onSubmit, form.setError, {
              deliveryZones: 'deliveryZones',
              'deliveryZones.*': 'deliveryZones.0.name',
            }),
          )}
        >
          {fields.fields.map((field, index) => (
            <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2" key={field.id}>
              <div className="grid gap-2">
                <Label>Zone name</Label>
                <Input {...form.register(`deliveryZones.${index}.name`)} />
                {form.formState.errors.deliveryZones?.[index]?.name?.message ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.deliveryZones[index]?.name?.message}
                  </p>
                ) : null}
                <p className="text-xs leading-5 text-muted-foreground">
                  Use a recognizable coverage name, such as Central Lahore.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Coverage type</Label>
                <Controller
                  control={form.control}
                  name={`deliveryZones.${index}.type`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POSTAL_CODE">Postal codes</SelectItem>
                        <SelectItem value="RADIUS">Radius</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  Define coverage with a code list or distance from the branch.
                </p>
              </div>
              {watchedDeliveryZones[index]?.type === 'POSTAL_CODE' ? (
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Postal codes</Label>
                  <Input placeholder="54000, 54010" {...form.register(`deliveryZones.${index}.postalCodesText`)} />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Enter comma-separated postal codes served by this zone.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Radius (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...form.register(`deliveryZones.${index}.radiusKilometers`, {
                      setValueAs: (value) => (value === '' ? null : Number(value)),
                    })}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Maximum delivery distance measured from the branch.
                  </p>
                </div>
              )}
              <MoneyInput
                label="Delivery fee"
                registration={form.register(`deliveryZones.${index}.deliveryFee`, { valueAsNumber: true })}
              />
              <MoneyInput
                label="Minimum order"
                registration={form.register(`deliveryZones.${index}.minimumOrderAmount`, { valueAsNumber: true })}
              />
              <MoneyInput
                label="Free delivery threshold"
                nullable
                registration={form.register(`deliveryZones.${index}.freeDeliveryThreshold`, {
                  setValueAs: (value) => (value === '' ? null : Number(value)),
                })}
              />
              <Controller
                control={form.control}
                name={`deliveryZones.${index}.isActive`}
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} />{' '}
                    Active
                  </label>
                )}
              />
              <Button type="button" variant="outline" onClick={() => fields.remove(index)}>
                <Trash2 /> Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              fields.append({
                name: '',
                type: 'POSTAL_CODE',
                postalCodesText: '',
                radiusKilometers: null,
                deliveryFee: 0,
                minimumOrderAmount: 0,
                freeDeliveryThreshold: null,
                isActive: true,
              })
            }
          >
            <Plus /> Add delivery zone
          </Button>
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={props.submitting} onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="owner-delivery-zones" disabled={props.submitting}>
            {props.submitting ? <LoaderCircle className="animate-spin" /> : null}
            {props.submitting ? 'Saving delivery zones' : 'Save delivery zones'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MoneyInput({
  label,
  registration,
  nullable = false,
}: {
  label: string
  nullable?: boolean
  registration: ReturnType<ReturnType<typeof useForm<DeliveryZonesFormValues>>['register']>
}) {
  return (
    <div className="grid gap-2">
      <Label>{label} (PKR)</Label>
      <Input type="number" min={0} step="0.01" placeholder={nullable ? 'No threshold' : undefined} {...registration} />
      <p className="text-xs leading-5 text-muted-foreground">{moneyFieldDescriptions[label]}</p>
    </div>
  )
}

const moneyFieldDescriptions: Record<string, string> = {
  'Delivery fee': 'Amount charged for deliveries inside this zone.',
  'Minimum order': 'Smallest order subtotal accepted for this zone.',
  'Free delivery threshold': 'Optional subtotal at which the delivery fee becomes zero.',
}
