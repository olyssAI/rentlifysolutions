import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Building2, MapPin, RefreshCw, Search, Store } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ContentLoadingIndicator } from '@/components/feedback/content-loading-indicator'
import { restaurantApi } from '@/modules/restaurants/api/restaurant-api'
import { CreateRestaurantDialog } from '@/modules/restaurants/components/create-restaurant-dialog'
import { toRestaurantPayload, type RestaurantFormValues } from '@/modules/restaurants/validation/restaurant-form-schema'

const statusStyle: Record<string, string> = {
  ACTIVE: 'border-success/20 bg-success-soft text-success',
  DRAFT: 'border-border bg-muted text-foreground',
  SUSPENDED: 'border-destructive/20 bg-destructive/10 text-destructive',
}

export function RestaurantsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const restaurantsQuery = useQuery({ queryKey: ['restaurants'], queryFn: restaurantApi.list })
  const packagesQuery = useQuery({ queryKey: ['restaurant-packages'], queryFn: restaurantApi.packages })
  const createMutation = useMutation({
    mutationFn: (values: RestaurantFormValues) => {
      const selectedPackage = packagesQuery.data?.packages.find(({ id }) => id === values.packageId)
      if (!selectedPackage) throw new Error('The selected package is no longer available. Refresh and try again.')
      return restaurantApi.create(toRestaurantPayload(values, selectedPackage.features))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      setDialogOpen(false)
      toast.success('Restaurant created', { description: 'The restaurant is saved as a draft.' })
    },
    onError: (error) => toast.error('Restaurant was not created', { description: error.message }),
  })

  const normalizedSearch = search.trim().toLowerCase()
  const restaurants = (restaurantsQuery.data ?? []).filter(
    ({ name, slug, contactEmail }) =>
      !normalizedSearch ||
      name.toLowerCase().includes(normalizedSearch) ||
      slug.toLowerCase().includes(normalizedSearch) ||
      contactEmail.toLowerCase().includes(normalizedSearch),
  )

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Restaurants</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Create restaurant brands, configure locations, and control the features available to each account.
          </p>
        </div>
        <CreateRestaurantDialog
          isOpen={dialogOpen}
          isSubmitting={createMutation.isPending}
          onOpenChange={setDialogOpen}
          onSubmit={(values) => createMutation.mutateAsync(values).then(() => undefined)}
          packages={packagesQuery.data?.packages ?? []}
        />
      </header>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, identifier, or email"
          aria-label="Search restaurants"
        />
      </div>

      {restaurantsQuery.isPending ? <ContentLoadingIndicator label="Loading restaurants…" /> : null}

      {restaurantsQuery.isError ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <RefreshCw className="size-6 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold">Restaurants could not be loaded</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{restaurantsQuery.error.message}</p>
            <Button className="mt-5" variant="outline" onClick={() => restaurantsQuery.refetch()}>
              <RefreshCw data-icon="inline-start" /> Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {restaurantsQuery.isSuccess && restaurantsQuery.data.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-muted">
              <Building2 className="size-5 text-muted-foreground" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold">No restaurants yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create the first restaurant with its main location. Nothing becomes public until you activate it.
            </p>
            <Button className="mt-5" onClick={() => setDialogOpen(true)}>
              Create the first restaurant
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {restaurantsQuery.isSuccess && restaurantsQuery.data.length > 0 && restaurants.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="text-sm font-medium">No restaurants match “{search.trim()}”.</p>
          <Button className="mt-3" variant="ghost" onClick={() => setSearch('')}>
            Clear search
          </Button>
        </div>
      ) : null}

      {restaurants.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Link
              className="group rounded-2xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              key={restaurant.id}
              to={`/dashboard/restaurants/${restaurant.id}`}
            >
              <Card className="h-full rounded-2xl border-border bg-white shadow-none transition-colors group-hover:border-foreground/25">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-white"
                      style={{ color: restaurant.primaryColor }}
                    >
                      <Store className="size-5" aria-hidden="true" />
                    </span>
                    <Badge className={statusStyle[restaurant.status]} variant="outline">
                      {restaurant.status.charAt(0) + restaurant.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  <div className="mt-5 min-w-0">
                    <h3 className="truncate text-base font-semibold">{restaurant.name}</h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{restaurant.contactEmail}</p>
                  </div>
                  <div className="mt-6 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {restaurant.locationCount} {restaurant.locationCount === 1 ? 'location' : 'locations'}
                    </span>
                    <span>{restaurant.packageName}</span>
                    <ArrowRight
                      className="ml-auto size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
