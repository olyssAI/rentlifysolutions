import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, MapPin, Plus } from 'lucide-react'
import { useRef } from 'react'
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
import {
  locationDetailsFormSchema,
  type LocationDetailsFormValues,
} from '@/modules/restaurants/validation/location-details-form-schema'

export function CreateRestaurantLocationDialog({
  open,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: LocationDetailsFormValues) => Promise<void>
}) {
  const form = useForm<LocationDetailsFormValues>({
    resolver: zodResolver(locationDetailsFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      phone: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      province: '',
      postalCode: '',
    },
  })
  const automaticallyUpdateIdentifier = useRef(true)
  const nameRegistration = form.register('name')
  const slugRegistration = form.register('slug')
  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return
    if (nextOpen) {
      automaticallyUpdateIdentifier.current = true
      form.reset({
        name: '',
        slug: '',
        phone: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        province: '',
        postalCode: '',
      })
    }
    onOpenChange(nextOpen)
  }
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => handleOpenChange(true)}>
          <Plus /> Add location
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <span className="grid size-10 place-items-center rounded-xl bg-muted">
            <MapPin className="size-5" />
          </span>
          <DialogTitle>Add location</DialogTitle>
          <DialogDescription>Create the branch first, then configure its operations and hours.</DialogDescription>
        </DialogHeader>
        <form
          id="create-restaurant-location"
          className="grid gap-4"
          noValidate
          onSubmit={form.handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, onSubmit, form.setError, {
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
          <fieldset className="grid gap-4" disabled={submitting}>
            {(
              [
                ['name', 'Location name'],
                ['slug', 'Location identifier'],
                ['phone', 'Phone'],
                ['email', 'Email'],
                ['addressLine1', 'Street address'],
                ['addressLine2', 'Address line 2'],
                ['city', 'City'],
                ['province', 'Province'],
                ['postalCode', 'Postal code'],
              ] as const
            ).map(([name, label]) => (
              <div className="grid gap-2" key={name}>
                <Label htmlFor={`create-${name}`}>
                  {label}
                  {['name', 'slug', 'phone', 'addressLine1', 'city', 'province'].includes(name) ? (
                    <span className="text-destructive"> *</span>
                  ) : null}
                </Label>
                <Input
                  id={`create-${name}`}
                  type={name === 'email' ? 'email' : 'text'}
                  aria-invalid={Boolean(form.formState.errors[name])}
                  {...(name === 'name'
                    ? {
                        ...nameRegistration,
                        onChange: (event) => {
                          void nameRegistration.onChange(event)
                          if (automaticallyUpdateIdentifier.current) {
                            form.setValue('slug', toLocationIdentifier(event.target.value), {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        },
                      }
                    : name === 'slug'
                      ? {
                          ...slugRegistration,
                          onChange: (event) => {
                            automaticallyUpdateIdentifier.current = false
                            void slugRegistration.onChange(event)
                          },
                        }
                      : form.register(name))}
                />
                <p className="text-xs leading-5 text-muted-foreground">{locationFieldDescriptions[name]}</p>
                {form.formState.errors[name]?.message ? (
                  <p className="text-sm text-destructive">{form.formState.errors[name]?.message}</p>
                ) : null}
              </div>
            ))}
          </fieldset>
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="create-restaurant-location" type="submit" disabled={submitting}>
            {submitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
            {submitting ? 'Creating location' : 'Create location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const toLocationIdentifier = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const locationFieldDescriptions = {
  name: 'A customer-friendly branch name, such as Main branch or DHA Phase 5.',
  slug: 'A stable lowercase identifier used internally and in application routes.',
  phone: 'The direct number customers and riders can use for this branch.',
  email: 'An optional branch-specific contact email; it does not create a login.',
  addressLine1: 'Building, street, and area information needed to locate the branch.',
  addressLine2: 'Optional floor, suite, landmark, or other address detail.',
  city: 'The city where this branch operates.',
  province: 'The Pakistani province or territory for this address.',
  postalCode: 'Optional postal code for more precise delivery and address records.',
} as const
