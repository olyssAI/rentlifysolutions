import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Plus, Store } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SubscriptionPackage } from '@/modules/restaurants/api/restaurant-api'
import {
  restaurantFormSchema,
  type RestaurantFormValues,
} from '@/modules/restaurants/validation/restaurant-form-schema'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

interface CreateRestaurantDialogProps {
  isOpen: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RestaurantFormValues) => Promise<void>
  packages: SubscriptionPackage[]
}

export function CreateRestaurantDialog({
  isOpen,
  isSubmitting,
  onOpenChange,
  onSubmit,
  packages,
}: CreateRestaurantDialogProps) {
  const [generatedSlug, setGeneratedSlug] = useState('')
  const {
    register,
    control,
    getValues,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      contactEmail: '',
      contactPhone: '',
      packageId: '',
      locationName: 'Main branch',
      locationSlug: 'main-branch',
      addressLine1: '',
      city: '',
      province: 'Punjab',
    },
  })

  const handleOpenChange = (open: boolean) => {
    if (isSubmitting) return
    if (!open) {
      setGeneratedSlug('')
      reset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>
          <Plus data-icon="inline-start" /> Add restaurant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Store className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Create a restaurant</DialogTitle>
          <DialogDescription>
            Add the restaurant and its first physical location. It remains a draft until you activate it.
          </DialogDescription>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-destructive" aria-hidden="true">
              *
            </span>{' '}
            Required fields
          </p>
        </DialogHeader>

        <form
          id="create-restaurant-form"
          className="grid gap-6"
          onSubmit={handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, onSubmit, setError, {
              name: 'name',
              slug: 'slug',
              contactEmail: 'contactEmail',
              contactPhone: 'contactPhone',
              packageId: 'packageId',
              'initialLocation.name': 'locationName',
              'initialLocation.slug': 'locationSlug',
              'initialLocation.addressLine1': 'addressLine1',
              'initialLocation.city': 'city',
              'initialLocation.province': 'province',
            }),
          )}
          noValidate
        >
          <fieldset className="grid gap-4" disabled={isSubmitting}>
            <legend className="mb-3 text-sm font-semibold">Restaurant identity</legend>
            <div className="grid gap-4">
              <FormField
                description="The customer-facing name used across dashboards and apps."
                error={errors.name?.message}
                label="Restaurant name"
                htmlFor="restaurant-name"
              >
                <Input
                  id="restaurant-name"
                  aria-describedby={errors.name ? 'restaurant-name-error' : undefined}
                  aria-invalid={Boolean(errors.name)}
                  autoComplete="organization"
                  required
                  {...register('name', {
                    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                      const currentSlug = getValues('slug')
                      if (currentSlug === generatedSlug) {
                        const nextSlug = slugify(event.target.value)
                        setGeneratedSlug(nextSlug)
                        setValue('slug', nextSlug, {
                          shouldDirty: true,
                          shouldValidate: Boolean(errors.slug),
                        })
                      }
                    },
                  })}
                />
              </FormField>
              <FormField
                description="A permanent lowercase identifier for app builds and API records."
                error={errors.slug?.message}
                label="App identifier"
                htmlFor="restaurant-slug"
              >
                <Input
                  id="restaurant-slug"
                  aria-describedby={errors.slug ? 'restaurant-slug-error restaurant-slug-help' : 'restaurant-slug-help'}
                  aria-invalid={Boolean(errors.slug)}
                  autoCapitalize="none"
                  required
                  spellCheck={false}
                  {...register('slug')}
                />
              </FormField>
              <FormField
                description="The restaurant's operational contact email; this is not the owner's login."
                error={errors.contactEmail?.message}
                label="Contact email"
                htmlFor="restaurant-email"
              >
                <Input
                  id="restaurant-email"
                  aria-describedby={errors.contactEmail ? 'restaurant-email-error' : undefined}
                  aria-invalid={Boolean(errors.contactEmail)}
                  type="email"
                  autoComplete="email"
                  required
                  {...register('contactEmail')}
                />
              </FormField>
              <FormField
                description="A reachable business number, including Pakistan country code when applicable."
                error={errors.contactPhone?.message}
                label="Contact phone"
                htmlFor="restaurant-phone"
              >
                <Input
                  id="restaurant-phone"
                  aria-describedby={errors.contactPhone ? 'restaurant-phone-error' : undefined}
                  aria-invalid={Boolean(errors.contactPhone)}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+92 300 1234567"
                  required
                  {...register('contactPhone')}
                />
              </FormField>
              <FormField
                description="Controls the features Rentlify makes available to this restaurant."
                error={errors.packageId?.message}
                label="Package"
                htmlFor="restaurant-package"
              >
                <Controller
                  control={control}
                  name="packageId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={packages.length === 0}>
                      <SelectTrigger
                        id="restaurant-package"
                        className="w-full"
                        aria-describedby={errors.packageId ? 'restaurant-package-error' : undefined}
                        aria-invalid={Boolean(errors.packageId)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      >
                        <SelectValue
                          placeholder={packages.length === 0 ? 'Packages unavailable' : 'Choose a package'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((subscriptionPackage) => (
                          <SelectItem key={subscriptionPackage.id} value={subscriptionPackage.id}>
                            {subscriptionPackage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
          </fieldset>

          <fieldset className="grid gap-4 border-t border-border pt-5" disabled={isSubmitting}>
            <legend className="mb-3 text-sm font-semibold">First location</legend>
            <div className="grid gap-4">
              <FormField
                description="A recognizable branch name, such as Main branch or Gulberg."
                error={errors.locationName?.message}
                label="Location name"
                htmlFor="location-name"
              >
                <Input
                  id="location-name"
                  aria-describedby={errors.locationName ? 'location-name-error' : undefined}
                  aria-invalid={Boolean(errors.locationName)}
                  required
                  {...register('locationName')}
                />
              </FormField>
              <FormField
                description="A stable lowercase identifier unique within this restaurant."
                error={errors.locationSlug?.message}
                label="Location identifier"
                htmlFor="location-slug"
              >
                <Input
                  id="location-slug"
                  aria-describedby={errors.locationSlug ? 'location-slug-error' : undefined}
                  aria-invalid={Boolean(errors.locationSlug)}
                  autoCapitalize="none"
                  required
                  spellCheck={false}
                  {...register('locationSlug')}
                />
              </FormField>
              <FormField
                description="Building, street, and area customers and riders can locate."
                error={errors.addressLine1?.message}
                label="Street address"
                htmlFor="location-address"
              >
                <Input
                  id="location-address"
                  aria-describedby={errors.addressLine1 ? 'location-address-error' : undefined}
                  aria-invalid={Boolean(errors.addressLine1)}
                  autoComplete="street-address"
                  required
                  {...register('addressLine1')}
                />
              </FormField>
              <FormField
                description="The city used for service coverage and customer addresses."
                error={errors.city?.message}
                label="City"
                htmlFor="location-city"
              >
                <Input
                  id="location-city"
                  aria-describedby={errors.city ? 'location-city-error' : undefined}
                  aria-invalid={Boolean(errors.city)}
                  autoComplete="address-level2"
                  required
                  {...register('city')}
                />
              </FormField>
              <FormField
                description="The Pakistani province or territory for this branch."
                error={errors.province?.message}
                label="Province"
                htmlFor="location-province"
              >
                <Input
                  id="location-province"
                  aria-describedby={errors.province ? 'location-province-error' : undefined}
                  aria-invalid={Boolean(errors.province)}
                  autoComplete="address-level1"
                  required
                  {...register('province')}
                />
              </FormField>
            </div>
          </fieldset>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="create-restaurant-form" type="submit" disabled={isSubmitting || packages.length === 0}>
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Plus data-icon="inline-start" />
            )}
            {isSubmitting ? 'Creating restaurant' : 'Create restaurant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface FormFieldProps {
  children: React.ReactNode
  description: string
  error?: string
  htmlFor: string
  label: string
}

function FormField({ children, description, error, htmlFor, label }: FormFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </Label>
      {children}
      <p className="text-xs leading-5 text-muted-foreground" id={`${htmlFor}-help`}>
        {description}
      </p>
      {error ? (
        <p className="text-xs text-destructive" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
