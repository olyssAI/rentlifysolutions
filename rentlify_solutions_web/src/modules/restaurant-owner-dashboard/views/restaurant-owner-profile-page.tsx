import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, LoaderCircle, RefreshCw, Save, Store } from 'lucide-react'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { applyApiFieldErrorsToForm } from '@/api/apply-api-field-errors-to-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ContentLoadingIndicator } from '@/components/feedback/content-loading-indicator'
import { restaurantOwnerApi } from '@/modules/restaurant-owner-dashboard/api/restaurant-owner-api'
import { RestaurantBrandColorField } from '@/modules/restaurant-owner-dashboard/components/restaurant-brand-color-field'
import {
  restaurantOwnerProfileFormSchema,
  toRestaurantOwnerProfilePayload,
  type RestaurantOwnerProfileFormValues,
} from '@/modules/restaurant-owner-dashboard/validation/restaurant-owner-profile-form-schema'

export function RestaurantOwnerProfilePage() {
  const queryClient = useQueryClient()
  const contextQuery = useQuery({ queryKey: ['restaurant-owner-context'], queryFn: restaurantOwnerApi.context })
  const form = useForm<RestaurantOwnerProfileFormValues>({
    resolver: zodResolver(restaurantOwnerProfileFormSchema),
    defaultValues: {
      name: '',
      legalName: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      logoUrl: '',
      coverImageUrl: '',
      primaryColor: '#D92D20',
      accentColor: '#F7C948',
    },
  })
  const primaryColor = useWatch({ control: form.control, name: 'primaryColor' })
  const accentColor = useWatch({ control: form.control, name: 'accentColor' })

  useEffect(() => {
    const restaurant = contextQuery.data?.details.restaurant
    if (!restaurant) return
    form.reset({
      name: restaurant.name,
      legalName: restaurant.legalName ?? '',
      description: restaurant.description ?? '',
      contactEmail: restaurant.contactEmail,
      contactPhone: restaurant.contactPhone,
      logoUrl: restaurant.logoUrl ?? '',
      coverImageUrl: restaurant.coverImageUrl ?? '',
      primaryColor: restaurant.primaryColor,
      accentColor: restaurant.accentColor,
    })
  }, [contextQuery.data, form])

  const mutation = useMutation({
    mutationFn: (values: RestaurantOwnerProfileFormValues) =>
      restaurantOwnerApi.updateRestaurant(toRestaurantOwnerProfilePayload(values, form.formState.dirtyFields)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurant-owner-context'] })
      toast.success('Restaurant profile updated')
    },
    onError: (error) => {
      applyApiFieldErrorsToForm(error, form.setError, {
        name: 'name',
        legalName: 'legalName',
        description: 'description',
        contactEmail: 'contactEmail',
        contactPhone: 'contactPhone',
        logoUrl: 'logoUrl',
        coverImageUrl: 'coverImageUrl',
        primaryColor: 'primaryColor',
        accentColor: 'accentColor',
      })
      toast.error('Profile was not updated', { description: error.message })
    },
  })

  if (contextQuery.isPending) {
    return <ContentLoadingIndicator label="Loading restaurant profile…" />
  }

  if (contextQuery.isError) {
    return (
      <Alert className="mx-auto max-w-3xl" variant="destructive">
        <AlertCircle />
        <AlertTitle>Restaurant profile unavailable</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{contextQuery.error.message}</p>
          <Button className="mt-4" variant="outline" onClick={() => void contextQuery.refetch()}>
            <RefreshCw /> Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  const suspended = contextQuery.data.membership.restaurantStatus === 'SUSPENDED'

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header className="border-b border-border pb-7">
        <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Restaurant profile</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Keep your restaurant identity and customer contact details up to date.
        </p>
      </header>
      {suspended ? (
        <Alert>
          <AlertCircle />
          <AlertTitle>Restaurant profile is read-only</AlertTitle>
          <AlertDescription>
            Rentlify has suspended this restaurant. Profile changes are unavailable until access is restored.
          </AlertDescription>
        </Alert>
      ) : null}
      <Card className="shadow-none">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-muted">
              <Store className="size-5" />
            </span>
            <CardTitle className="text-base">Profile details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="grid gap-5" noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <fieldset className="grid gap-5" disabled={suspended || mutation.isPending}>
              <ProfileField
                htmlFor="owner-restaurant-name"
                label="Restaurant name"
                description="The name customers see throughout your ordering experience."
                required
                error={form.formState.errors.name?.message}
              >
                <Input id="owner-restaurant-name" autoComplete="organization" {...form.register('name')} />
              </ProfileField>
              <ProfileField
                htmlFor="owner-restaurant-legal-name"
                label="Legal name"
                description="The registered business name used for records; leave blank if it is the same."
                error={form.formState.errors.legalName?.message}
              >
                <Input id="owner-restaurant-legal-name" autoComplete="organization" {...form.register('legalName')} />
              </ProfileField>
              <ProfileField
                htmlFor="owner-restaurant-description"
                label="Description"
                description="A short, accurate introduction to your food, service, or brand."
                error={form.formState.errors.description?.message}
              >
                <Textarea
                  id="owner-restaurant-description"
                  className="min-h-28 resize-y"
                  {...form.register('description')}
                />
              </ProfileField>
              <ProfileField
                htmlFor="owner-restaurant-contact-email"
                label="Contact email"
                description="The public business contact address, not necessarily your sign-in email."
                required
                error={form.formState.errors.contactEmail?.message}
              >
                <Input
                  id="owner-restaurant-contact-email"
                  type="email"
                  autoComplete="email"
                  {...form.register('contactEmail')}
                />
              </ProfileField>
              <ProfileField
                htmlFor="owner-restaurant-contact-phone"
                label="Contact phone"
                description="The number customers or delivery partners should use to reach the restaurant."
                required
                error={form.formState.errors.contactPhone?.message}
              >
                <Input
                  id="owner-restaurant-contact-phone"
                  inputMode="tel"
                  autoComplete="tel"
                  {...form.register('contactPhone')}
                />
              </ProfileField>
              <ProfileField
                htmlFor="owner-restaurant-logo-url"
                label="Logo URL"
                description="An HTTPS link to a square or compact logo image."
                error={form.formState.errors.logoUrl?.message}
              >
                <Input
                  id="owner-restaurant-logo-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  {...form.register('logoUrl')}
                />
              </ProfileField>
              <ProfileField
                htmlFor="owner-restaurant-cover-image-url"
                label="Cover image URL"
                description="An HTTPS link to a wide banner image used in customer-facing views."
                error={form.formState.errors.coverImageUrl?.message}
              >
                <Input
                  id="owner-restaurant-cover-image-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  {...form.register('coverImageUrl')}
                />
              </ProfileField>
              <div className="grid gap-5 sm:grid-cols-2">
                <RestaurantBrandColorField
                  id="owner-restaurant-primary-color"
                  label="Primary color"
                  value={primaryColor}
                  error={form.formState.errors.primaryColor?.message}
                  registration={form.register('primaryColor')}
                  onColorSelection={(value) =>
                    form.setValue('primaryColor', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
                  }
                />
                <RestaurantBrandColorField
                  id="owner-restaurant-accent-color"
                  label="Accent color"
                  value={accentColor}
                  error={form.formState.errors.accentColor?.message}
                  registration={form.register('accentColor')}
                  onColorSelection={(value) =>
                    form.setValue('accentColor', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
                  }
                />
              </div>
              <div className="overflow-hidden rounded-xl border border-border" aria-label="Brand color preview">
                <div className="h-20 p-4" style={{ backgroundColor: primaryColor }}>
                  <span
                    className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold shadow-sm"
                    style={{ backgroundColor: accentColor, color: primaryColor }}
                  >
                    Your restaurant
                  </span>
                </div>
                <p className="bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  Live preview of the selected primary and accent colors.
                </p>
              </div>
            </fieldset>
            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">
                {suspended
                  ? 'Saving is unavailable while this restaurant is suspended.'
                  : form.formState.isDirty
                    ? 'You have unsaved profile changes.'
                    : 'Change a field to enable saving.'}
              </p>
              <Button type="submit" disabled={suspended || !form.formState.isDirty || mutation.isPending}>
                {mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
                {mutation.isPending ? 'Saving changes' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileField({
  label,
  htmlFor,
  description,
  required = false,
  error,
  children,
}: {
  label: string
  htmlFor: string
  description: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
