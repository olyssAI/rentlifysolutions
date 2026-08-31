import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, MapPin, Pencil } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

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
import type { RestaurantLocation } from '@/modules/restaurants/api/restaurant-api'
import {
  locationDetailsFormSchema,
  type LocationDetailsFormValues,
} from '@/modules/restaurants/validation/location-details-form-schema'

interface EditLocationDialogProps {
  isOpen: boolean
  isSubmitting: boolean
  location: RestaurantLocation
  onOpenChange: (open: boolean) => void
  onSubmit: (values: LocationDetailsFormValues) => Promise<void>
}

export function EditLocationDialog({
  isOpen,
  isSubmitting,
  location,
  onOpenChange,
  onSubmit,
}: EditLocationDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<LocationDetailsFormValues>({
    resolver: zodResolver(locationDetailsFormSchema),
    defaultValues: getDefaultValues(location),
  })

  useEffect(() => {
    if (isOpen) reset(getDefaultValues(location))
  }, [isOpen, location, reset])

  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting) onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={() => onOpenChange(true)}>
          <Pencil data-icon="inline-start" /> Edit location
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
            <MapPin className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Edit location details</DialogTitle>
          <DialogDescription>Update this branch’s identity, contact information, and address.</DialogDescription>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-destructive" aria-hidden="true">
              *
            </span>{' '}
            Required fields
          </p>
        </DialogHeader>

        <form
          id={`edit-location-form-${location.id}`}
          className="grid gap-4"
          noValidate
          onSubmit={handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, onSubmit, setError, {
              name: 'name',
              slug: 'slug',
              phone: 'phone',
              email: 'email',
              addressLine1: 'addressLine1',
              addressLine2: 'addressLine2',
              city: 'city',
              province: 'province',
              postalCode: 'postalCode',
            }),
          )}
        >
          <fieldset className="grid gap-4" disabled={isSubmitting}>
            <LocationField error={errors.name?.message} htmlFor="edit-location-name" label="Location name" required>
              <Input
                id="edit-location-name"
                aria-describedby={errors.name ? 'edit-location-name-error' : undefined}
                aria-invalid={Boolean(errors.name)}
                autoComplete="organization"
                required
                {...register('name')}
              />
            </LocationField>
            <LocationField
              error={errors.slug?.message}
              htmlFor="edit-location-slug"
              label="Location identifier"
              required
            >
              <Input
                id="edit-location-slug"
                aria-describedby={
                  errors.slug ? 'edit-location-slug-error edit-location-slug-help' : 'edit-location-slug-help'
                }
                aria-invalid={Boolean(errors.slug)}
                autoCapitalize="none"
                required
                spellCheck={false}
                {...register('slug')}
              />
              <p className="text-xs text-muted-foreground" id="edit-location-slug-help">
                Used in internal references. Change it only when necessary.
              </p>
            </LocationField>
            <LocationField error={errors.phone?.message} htmlFor="edit-location-phone" label="Phone" required>
              <Input
                id="edit-location-phone"
                aria-describedby={errors.phone ? 'edit-location-phone-error' : undefined}
                aria-invalid={Boolean(errors.phone)}
                autoComplete="tel"
                inputMode="tel"
                placeholder="+92 300 1234567"
                required
                {...register('phone')}
              />
            </LocationField>
            <LocationField error={errors.email?.message} htmlFor="edit-location-email" label="Email">
              <Input
                id="edit-location-email"
                aria-describedby={errors.email ? 'edit-location-email-error' : undefined}
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                inputMode="email"
                type="email"
                {...register('email')}
              />
            </LocationField>
            <LocationField
              error={errors.addressLine1?.message}
              htmlFor="edit-location-address-line-1"
              label="Street address"
              required
            >
              <Input
                id="edit-location-address-line-1"
                aria-describedby={errors.addressLine1 ? 'edit-location-address-line-1-error' : undefined}
                aria-invalid={Boolean(errors.addressLine1)}
                autoComplete="address-line1"
                required
                {...register('addressLine1')}
              />
            </LocationField>
            <LocationField
              error={errors.addressLine2?.message}
              htmlFor="edit-location-address-line-2"
              label="Address line 2"
            >
              <Input
                id="edit-location-address-line-2"
                aria-describedby={errors.addressLine2 ? 'edit-location-address-line-2-error' : undefined}
                aria-invalid={Boolean(errors.addressLine2)}
                autoComplete="address-line2"
                {...register('addressLine2')}
              />
            </LocationField>
            <LocationField error={errors.city?.message} htmlFor="edit-location-city" label="City" required>
              <Input
                id="edit-location-city"
                aria-describedby={errors.city ? 'edit-location-city-error' : undefined}
                aria-invalid={Boolean(errors.city)}
                autoComplete="address-level2"
                required
                {...register('city')}
              />
            </LocationField>
            <LocationField error={errors.province?.message} htmlFor="edit-location-province" label="Province" required>
              <Input
                id="edit-location-province"
                aria-describedby={errors.province ? 'edit-location-province-error' : undefined}
                aria-invalid={Boolean(errors.province)}
                autoComplete="address-level1"
                required
                {...register('province')}
              />
            </LocationField>
            <LocationField error={errors.postalCode?.message} htmlFor="edit-location-postal-code" label="Postal code">
              <Input
                id="edit-location-postal-code"
                aria-describedby={errors.postalCode ? 'edit-location-postal-code-error' : undefined}
                aria-invalid={Boolean(errors.postalCode)}
                autoComplete="postal-code"
                {...register('postalCode')}
              />
            </LocationField>
          </fieldset>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form={`edit-location-form-${location.id}`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
            {isSubmitting ? 'Saving changes' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getDefaultValues(location: RestaurantLocation): LocationDetailsFormValues {
  return {
    name: location.name,
    slug: location.slug,
    phone: location.phone,
    email: location.email ?? '',
    addressLine1: location.addressLine1,
    addressLine2: location.addressLine2 ?? '',
    city: location.city,
    province: location.province,
    postalCode: location.postalCode ?? '',
  }
}

interface LocationFieldProps {
  children: React.ReactNode
  error?: string
  htmlFor: string
  label: string
  required?: boolean
}

function LocationField({ children, error, htmlFor, label, required = false }: LocationFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <>
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </Label>
      {children}
      <p className="text-xs leading-5 text-muted-foreground">{locationFieldDescriptionByLabel[label]}</p>
      {error ? (
        <p className="text-xs text-destructive" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const locationFieldDescriptionByLabel: Record<string, string> = {
  'Location name': 'The branch name shown to administrators, owners, and customers.',
  'Location identifier': 'A stable lowercase identifier unique within this restaurant.',
  Phone: 'The direct business number used to contact this branch.',
  Email: 'An optional branch contact address; this does not control account access.',
  'Street address': 'Building, street, and area information needed to find the branch.',
  'Address line 2': 'Optional floor, suite, landmark, or additional address information.',
  City: 'The city where this branch serves customers.',
  Province: 'The Pakistani province or territory for this address.',
  'Postal code': 'Optional postal code used to improve address precision.',
}
