import { zodResolver } from '@hookform/resolvers/zod'
import { Clock3, LoaderCircle, Settings2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm, type Control } from 'react-hook-form'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { RestaurantLocation } from '@/modules/restaurants/api/restaurant-api'
import {
  locationOperationalSettingsFormSchema,
  type LocationOperationalSettingsFormValues,
} from '@/modules/restaurants/validation/location-operational-settings-form-schema'

interface ConfigureLocationOperationalSettingsDialogProps {
  availableFeatures: {
    delivery: boolean
    dineIn: boolean
    pickup: boolean
    scheduledOrders: boolean
  }
  isOpen: boolean
  isSubmitting: boolean
  location: RestaurantLocation
  onOpenChange: (open: boolean) => void
  onSubmit: (values: LocationOperationalSettingsFormValues) => Promise<void>
}

export function ConfigureLocationOperationalSettingsDialog({
  availableFeatures,
  isOpen,
  isSubmitting,
  location,
  onOpenChange,
  onSubmit,
}: ConfigureLocationOperationalSettingsDialogProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<LocationOperationalSettingsFormValues>({
    resolver: zodResolver(locationOperationalSettingsFormSchema),
    defaultValues: getLocationOperationalSettingsDefaultValues(location),
  })

  useEffect(() => {
    if (isOpen) reset(getLocationOperationalSettingsDefaultValues(location))
  }, [isOpen, location, reset])

  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting) onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={() => onOpenChange(true)}>
          <Settings2 data-icon="inline-start" /> Operations
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
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
            <Clock3 className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Configure location operations</DialogTitle>
          <DialogDescription>
            Choose how customers can order and set realistic kitchen limits for this branch.
          </DialogDescription>
        </DialogHeader>

        <form
          id={`configure-location-operational-settings-form-${location.id}`}
          className="grid gap-6"
          noValidate
          onSubmit={handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, onSubmit, setError, {
              preparationTimeMinutes: 'preparationTimeMinutes',
              orderCapacityPerSlot: 'orderCapacityPerSlot',
              deliveryEnabled: 'deliveryEnabled',
              pickupEnabled: 'pickupEnabled',
              dineInEnabled: 'dineInEnabled',
              scheduledOrdersEnabled: 'scheduledOrdersEnabled',
            }),
          )}
        >
          <fieldset className="grid gap-3" disabled={isSubmitting}>
            <legend className="mb-1 text-sm font-semibold">Fulfillment methods</legend>
            <p className="mb-1 text-xs leading-5 text-muted-foreground">
              Enable at least one way for customers to receive their order.
            </p>
            <OperationalToggleField
              control={control}
              description="Deliver orders to customer addresses."
              isAvailable={availableFeatures.delivery}
              label="Delivery"
              name="deliveryEnabled"
            />
            <OperationalToggleField
              control={control}
              description="Let customers collect orders from this branch."
              isAvailable={availableFeatures.pickup}
              label="Pickup"
              name="pickupEnabled"
            />
            <OperationalToggleField
              control={control}
              description="Allow orders intended for service inside the restaurant."
              isAvailable={availableFeatures.dineIn}
              label="Dine-in"
              name="dineInEnabled"
            />
            {errors.deliveryEnabled?.message ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.deliveryEnabled.message}
              </p>
            ) : null}
          </fieldset>

          <fieldset className="grid gap-4 border-t border-border pt-5" disabled={isSubmitting}>
            <legend className="mb-1 text-sm font-semibold">Order handling</legend>
            <div className="grid gap-2">
              <Label htmlFor="location-preparation-time">Preparation time (minutes)</Label>
              <Input
                id="location-preparation-time"
                aria-describedby={errors.preparationTimeMinutes ? 'location-preparation-time-error' : undefined}
                aria-invalid={Boolean(errors.preparationTimeMinutes)}
                inputMode="numeric"
                min={1}
                max={480}
                type="number"
                {...register('preparationTimeMinutes', { valueAsNumber: true })}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                The typical number of minutes the kitchen needs before an order is ready.
              </p>
              {errors.preparationTimeMinutes?.message ? (
                <p className="text-xs text-destructive" id="location-preparation-time-error" role="alert">
                  {errors.preparationTimeMinutes.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location-order-capacity">Orders accepted per time slot</Label>
              <Input
                id="location-order-capacity"
                aria-describedby={errors.orderCapacityPerSlot ? 'location-order-capacity-error' : undefined}
                aria-invalid={Boolean(errors.orderCapacityPerSlot)}
                inputMode="numeric"
                min={1}
                max={10_000}
                type="number"
                {...register('orderCapacityPerSlot', { valueAsNumber: true })}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Prevents more orders being promised than the kitchen can prepare in one slot.
              </p>
              {errors.orderCapacityPerSlot?.message ? (
                <p className="text-xs text-destructive" id="location-order-capacity-error" role="alert">
                  {errors.orderCapacityPerSlot.message}
                </p>
              ) : null}
            </div>
            <OperationalToggleField
              control={control}
              description="Let customers choose a later available order time."
              isAvailable={availableFeatures.scheduledOrders}
              label="Scheduled orders"
              name="scheduledOrdersEnabled"
            />
          </fieldset>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            form={`configure-location-operational-settings-form-${location.id}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
            {isSubmitting ? 'Saving settings' : 'Save operational settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface OperationalToggleFieldProps {
  control: Control<LocationOperationalSettingsFormValues>
  description: string
  isAvailable: boolean
  label: string
  name: 'deliveryEnabled' | 'pickupEnabled' | 'dineInEnabled' | 'scheduledOrdersEnabled'
}

function OperationalToggleField({ control, description, isAvailable, label, name }: OperationalToggleFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-border p-4">
          <div>
            <Label htmlFor={`location-${name}`}>{label}</Label>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {isAvailable ? description : 'Not available in this restaurant’s current feature access.'}
            </p>
          </div>
          <Switch
            id={`location-${name}`}
            checked={field.value}
            disabled={!isAvailable && !field.value}
            onBlur={field.onBlur}
            onCheckedChange={field.onChange}
            ref={field.ref}
          />
        </div>
      )}
    />
  )
}

function getLocationOperationalSettingsDefaultValues(
  location: RestaurantLocation,
): LocationOperationalSettingsFormValues {
  return {
    preparationTimeMinutes: location.preparationTimeMinutes,
    orderCapacityPerSlot: location.orderCapacityPerSlot,
    deliveryEnabled: location.deliveryEnabled,
    pickupEnabled: location.pickupEnabled,
    dineInEnabled: location.dineInEnabled,
    scheduledOrdersEnabled: location.scheduledOrdersEnabled,
  }
}
