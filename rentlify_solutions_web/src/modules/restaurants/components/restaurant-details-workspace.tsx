import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, CircleAlert, LoaderCircle, Power, RefreshCw, Settings2, Store } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContentLoadingIndicator } from '@/components/feedback/content-loading-indicator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  restaurantApi,
  type RestaurantDetails,
  type RestaurantOwner,
  type UpdateRestaurantLocationPayload,
  type UpdateRestaurantPayload,
} from '@/modules/restaurants/api/restaurant-api'
import { EditLocationDialog } from '@/modules/restaurants/components/edit-location-dialog'
import { ConfigureLocationOperationalSettingsDialog } from '@/modules/restaurants/components/configure-location-operational-settings-dialog'
import { ConfigureLocationWeeklyOpeningHoursDialog } from '@/modules/restaurants/components/configure-location-weekly-opening-hours-dialog'
import { CreateRestaurantLocationDialog } from '@/modules/restaurants/components/create-restaurant-location-dialog'
import {
  InformationRow,
  RestaurantFeatureAccessTab,
  RestaurantOverviewTab,
  RestaurantOwnersTab,
} from '@/modules/restaurants/components/restaurant-details-tabs'
import { RestaurantMenuReadOnlyTab } from '@/modules/restaurants/components/restaurant-menu-read-only-tab'
import { restaurantFeatureNames } from '@/modules/restaurants/constants/restaurant-feature-names'
import {
  toLocationDetailsPayload,
  type LocationDetailsFormValues,
} from '@/modules/restaurants/validation/location-details-form-schema'
import type { LocationOperationalSettingsFormValues } from '@/modules/restaurants/validation/location-operational-settings-form-schema'
import type { LocationWeeklyOpeningHoursFormValues } from '@/modules/restaurants/validation/location-weekly-opening-hours-form-schema'
import type { RestaurantOwnerProvisioningFormValues } from '@/modules/restaurants/validation/restaurant-owner-provisioning-form-schema'
import { toCreateRestaurantLocationPayload } from '@/modules/restaurants/validation/restaurant-location-creation-payload'

export function RestaurantDetailsWorkspace() {
  const { restaurantId } = useParams()
  const [searchParameters, setSearchParameters] = useSearchParams()
  const [pendingFeatureChange, setPendingFeatureChange] = useState<{
    featureKey: string
    enabled: boolean
  } | null>(null)
  const [pendingRestaurantChange, setPendingRestaurantChange] = useState<
    { kind: 'package'; packageId: string; packageName: string } | { kind: 'status'; status: string } | null
  >(null)
  const [locationDetailsDialogLocationId, setLocationDetailsDialogLocationId] = useState<string | null>(null)
  const [isCreateLocationDialogOpen, setIsCreateLocationDialogOpen] = useState(false)
  const [locationOperationalSettingsDialogLocationId, setLocationOperationalSettingsDialogLocationId] = useState<
    string | null
  >(null)
  const [locationWeeklyOpeningHoursDialogLocationId, setLocationWeeklyOpeningHoursDialogLocationId] = useState<
    string | null
  >(null)
  const [pendingLocationStatusChange, setPendingLocationStatusChange] = useState<{
    locationId: string
    locationName: string
    status: 'ACTIVE' | 'SUSPENDED'
  } | null>(null)
  const [isOwnerProvisioningDialogOpen, setIsOwnerProvisioningDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const detailsQuery = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => restaurantApi.details(restaurantId ?? ''),
    enabled: Boolean(restaurantId),
  })
  const packagesQuery = useQuery({ queryKey: ['restaurant-packages'], queryFn: restaurantApi.packages })
  const ownersQuery = useQuery({
    queryKey: ['restaurant-owners', restaurantId],
    queryFn: () => restaurantApi.listOwners(restaurantId ?? ''),
    enabled: Boolean(restaurantId),
  })
  const updateMutation = useMutation({
    mutationFn: (input: UpdateRestaurantPayload) => restaurantApi.update(restaurantId ?? '', input),
    onSuccess: async () => {
      setPendingRestaurantChange(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] }),
        queryClient.invalidateQueries({ queryKey: ['restaurants'] }),
      ])
      toast.success('Restaurant updated')
    },
    onError: (error) => toast.error('Update failed', { description: error.message }),
  })
  const featureMutation = useMutation({
    mutationFn: (overrides: Array<{ featureKey: string; enabled: boolean }>) =>
      restaurantApi.replaceFeatures(restaurantId ?? '', { overrides }),
    onSuccess: (details) => {
      setPendingFeatureChange(null)
      queryClient.setQueryData(['restaurant', restaurantId], details)
      toast.success('Feature access updated')
    },
    onError: (error) => toast.error('Features were not updated', { description: error.message }),
  })
  const updateLocationConfigurationMutation = useMutation({
    mutationFn: ({ locationId, input }: { locationId: string; input: UpdateRestaurantLocationPayload }) =>
      restaurantApi.updateLocation(restaurantId ?? '', locationId, input),
    onSuccess: async () => {
      setLocationDetailsDialogLocationId(null)
      setLocationOperationalSettingsDialogLocationId(null)
      setPendingLocationStatusChange(null)
      await queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] })
      toast.success('Location updated')
    },
    onError: (error) => {
      toast.error('Location was not updated', { description: error.message })
    },
  })
  const createLocationMutation = useMutation({
    mutationFn: (values: LocationDetailsFormValues) =>
      restaurantApi.createLocation(
        restaurantId ?? '',
        toCreateRestaurantLocationPayload(values, {
          delivery:
            detailsQuery.data?.effectiveFeatures.some(
              ({ featureKey, enabled }) => featureKey === 'DELIVERY' && enabled,
            ) ?? false,
          pickup:
            detailsQuery.data?.effectiveFeatures.some(
              ({ featureKey, enabled }) => featureKey === 'PICKUP' && enabled,
            ) ?? false,
          dineIn:
            detailsQuery.data?.effectiveFeatures.some(
              ({ featureKey, enabled }) => featureKey === 'DINE_IN' && enabled,
            ) ?? false,
          scheduledOrders:
            detailsQuery.data?.effectiveFeatures.some(
              ({ featureKey, enabled }) => featureKey === 'SCHEDULED_ORDERS' && enabled,
            ) ?? false,
        }),
      ),
    onSuccess: async () => {
      setIsCreateLocationDialogOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] }),
        queryClient.invalidateQueries({ queryKey: ['restaurants'] }),
      ])
      toast.success('Location created')
    },
    onError: (error) => toast.error('Location was not created', { description: error.message }),
  })
  const replaceLocationWeeklyOpeningHoursMutation = useMutation({
    mutationFn: ({ locationId, values }: { locationId: string; values: LocationWeeklyOpeningHoursFormValues }) =>
      restaurantApi.replaceOpeningHours(restaurantId ?? '', locationId, values),
    onSuccess: (updatedRestaurantDetails) => {
      queryClient.setQueryData(['restaurant', restaurantId], updatedRestaurantDetails)
      setLocationWeeklyOpeningHoursDialogLocationId(null)
      toast.success('Weekly opening hours updated')
    },
    onError: (error) => toast.error('Opening hours were not updated', { description: error.message }),
  })
  const [pendingOwnerRevocation, setPendingOwnerRevocation] = useState<RestaurantOwner | null>(null)
  const revokeOwnerMutation = useMutation({
    mutationFn: (owner: RestaurantOwner) => restaurantApi.revokeOwner(restaurantId ?? '', owner.membershipId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['restaurant-owners', restaurantId] })
      setPendingOwnerRevocation(null)
      toast.success('Restaurant access revoked', {
        description: result.downgradedRole
          ? `${result.email} can no longer sign in to this workspace and every active session was ended.`
          : `${result.email} no longer has access to this restaurant.`,
      })
    },
    onError: (error) => toast.error('Access was not revoked', { description: error.message }),
  })
  const provisionOwnerMutation = useMutation({
    mutationFn: (values: RestaurantOwnerProvisioningFormValues) =>
      restaurantApi.provisionOwner(restaurantId ?? '', {
        name: values.name,
        email: values.email,
        password: values.initialPassword,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurant-owners', restaurantId] })
      setIsOwnerProvisioningDialogOpen(false)
      toast.success('Restaurant owner access created', {
        description: 'The owner can now sign in with the email and initial password you provided.',
      })
    },
    onError: (error) => toast.error('Owner access was not created', { description: error.message }),
  })

  if (!restaurantId) return <DetailsFailure message="The restaurant identifier is missing." />
  if (detailsQuery.isPending) return <ContentLoadingIndicator label="Loading restaurant details…" />
  if (detailsQuery.isError)
    return <DetailsFailure message={detailsQuery.error.message} onRetry={() => detailsQuery.refetch()} />

  const details = detailsQuery.data
  const restaurant = details.restaurant
  const pendingFeature = pendingFeatureChange
    ? details.effectiveFeatures.find((feature) => feature.featureKey === pendingFeatureChange.featureKey)
    : undefined
  const activeLocations = details.locations.filter((location) => location.status === 'ACTIVE')
  const activeLocationsHaveCompleteHours = activeLocations.every((location) => {
    const configuredFulfillmentTypes = new Set(
      details.openingHours
        .filter(({ locationId }) => locationId === location.id)
        .map(({ fulfillmentType }) => fulfillmentType),
    )
    return (
      (!location.deliveryEnabled || configuredFulfillmentTypes.has('DELIVERY')) &&
      (!location.pickupEnabled || configuredFulfillmentTypes.has('PICKUP')) &&
      (!location.dineInEnabled || configuredFulfillmentTypes.has('DINE_IN'))
    )
  })
  const canActivate = activeLocations.length > 0 && activeLocationsHaveCompleteHours
  const requestedTab = searchParameters.get('tab')
  const activeTab = ['overview', 'menu', 'locations', 'features', 'owners'].includes(requestedTab ?? '')
    ? (requestedTab ?? 'overview')
    : 'overview'

  const setFeature = (featureKey: string, enabled: boolean) => {
    const feature = details.effectiveFeatures.find((entry) => entry.featureKey === featureKey)
    if (!feature) return
    const existing = details.overrides.filter((override) => override.featureKey !== featureKey)
    const overrides = enabled === feature.packageEnabled ? existing : [...existing, { featureKey, enabled }]
    featureMutation.mutate(overrides)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Button asChild size="sm" variant="outline" className="w-fit">
        <Link to="/dashboard/restaurants">
          <ArrowLeft data-icon="inline-start" /> Back to restaurants
        </Link>
      </Button>

      <header className="space-y-5">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-white"
            style={{ color: restaurant.primaryColor }}
          >
            <Store className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{restaurant.name}</h2>
              <Badge variant="outline">{restaurant.status.charAt(0) + restaurant.status.slice(1).toLowerCase()}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {restaurant.slug} · {restaurant.currencyCode} · {restaurant.timezone}
            </p>
          </div>
        </div>
        <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2 lg:max-w-xl">
          <div className="grid gap-1.5">
            <Label htmlFor="restaurant-package">Package</Label>
            <Select
              value={restaurant.packageId}
              disabled={updateMutation.isPending}
              onValueChange={(packageId) => {
                const selectedPackage = packagesQuery.data?.packages.find((item) => item.id === packageId)
                if (selectedPackage && packageId !== restaurant.packageId) {
                  setPendingRestaurantChange({
                    kind: 'package',
                    packageId,
                    packageName: selectedPackage.name,
                  })
                }
              }}
            >
              <SelectTrigger id="restaurant-package" className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(packagesQuery.data?.packages ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">
              Determines which platform features can be enabled for this restaurant.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="restaurant-status">Restaurant status</Label>
            <Select
              value={restaurant.status}
              disabled={updateMutation.isPending}
              onValueChange={(status) => {
                if (status !== restaurant.status) setPendingRestaurantChange({ kind: 'status', status })
              }}
            >
              <SelectTrigger id="restaurant-status" className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE" disabled={!canActivate}>
                  Active
                </SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">
              Controls whether the restaurant is being configured, operating, or suspended.
            </p>
          </div>
        </div>
      </header>

      {restaurant.status !== 'ACTIVE' ? (
        <Card className="rounded-2xl border-dashed shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
                <Power className="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">Restaurant activation readiness</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  The restaurant can be published after at least one fully configured location is active.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <ReadinessItem ready={activeLocations.length > 0} label="At least one active location" />
              <ReadinessItem
                ready={activeLocations.length > 0 && activeLocationsHaveCompleteHours}
                label="Active location hours"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          const nextSearchParameters = new URLSearchParams(searchParameters)
          if (tab === 'overview') nextSearchParameters.delete('tab')
          else nextSearchParameters.set('tab', tab)
          setSearchParameters(nextSearchParameters, { replace: true })
        }}
      >
        <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-5" variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="locations">Locations ({details.locations.length})</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="owners">Owners</TabsTrigger>
        </TabsList>

        <TabsContent className="pt-5" value="overview">
          <RestaurantOverviewTab details={details} />
        </TabsContent>

        <TabsContent className="pt-5" value="menu">
          <RestaurantMenuReadOnlyTab restaurantId={restaurantId} />
        </TabsContent>

        <TabsContent className="pt-5" value="locations">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold">Restaurant locations</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Create branches here, then configure each location’s fulfillment methods and opening hours.
              </p>
            </div>
            <CreateRestaurantLocationDialog
              open={isCreateLocationDialogOpen}
              submitting={createLocationMutation.isPending}
              onOpenChange={setIsCreateLocationDialogOpen}
              onSubmit={(values) => createLocationMutation.mutateAsync(values).then(() => undefined)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            {details.locations.map((location) => {
              const hours = details.openingHours.filter((hour) => hour.locationId === location.id)
              const setupRequired = location.status === 'DRAFT' && hours.length === 0
              const enabledFulfillmentTypes = [
                location.deliveryEnabled && 'DELIVERY',
                location.pickupEnabled && 'PICKUP',
                location.dineInEnabled && 'DINE_IN',
              ].filter((value): value is 'DELIVERY' | 'PICKUP' | 'DINE_IN' => Boolean(value))
              const configuredFulfillmentTypes = new Set(hours.map(({ fulfillmentType }) => fulfillmentType))
              const identityReady = Boolean(
                location.name.trim() &&
                location.phone.trim() &&
                location.addressLine1.trim() &&
                location.city.trim() &&
                location.province.trim(),
              )
              const fulfillmentReady = enabledFulfillmentTypes.length > 0
              const weeklyHoursReady =
                fulfillmentReady && enabledFulfillmentTypes.every((type) => configuredFulfillmentTypes.has(type))
              const locationReadyForActivation = identityReady && fulfillmentReady && weeklyHoursReady
              return (
                <Card className="rounded-2xl shadow-none" key={location.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border">
                    <div>
                      <CardTitle>{location.name}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {location.addressLine1}, {location.city}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant="outline">
                        {setupRequired ? 'Setup required' : location.status.toLowerCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
                    <InformationRow
                      label="Preparation"
                      value={setupRequired ? 'Not configured' : `${location.preparationTimeMinutes} minutes`}
                    />
                    <InformationRow
                      label="Slot capacity"
                      value={setupRequired ? 'Not configured' : `${location.orderCapacityPerSlot} orders`}
                    />
                    <InformationRow
                      label="Fulfillment"
                      value={setupRequired ? 'Not configured' : getFulfillmentLabel(location)}
                    />
                    <InformationRow
                      label="Weekly hours"
                      value={hours.length === 0 ? 'Not configured' : `${hours.length} time ranges`}
                    />
                  </CardContent>
                  {location.status !== 'ACTIVE' ? (
                    <div className="border-t border-border px-4 py-4">
                      <p className="text-sm font-medium">Activation readiness</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <ReadinessItem ready={identityReady} label="Location details" />
                        <ReadinessItem ready={fulfillmentReady} label="Fulfillment method" />
                        <ReadinessItem ready={weeklyHoursReady} label="Weekly hours" />
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row">
                    <EditLocationDialog
                      isOpen={locationDetailsDialogLocationId === location.id}
                      isSubmitting={
                        updateLocationConfigurationMutation.isPending && locationDetailsDialogLocationId === location.id
                      }
                      location={location}
                      onOpenChange={(open) => setLocationDetailsDialogLocationId(open ? location.id : null)}
                      onSubmit={(values: LocationDetailsFormValues) =>
                        updateLocationConfigurationMutation
                          .mutateAsync({ locationId: location.id, input: toLocationDetailsPayload(values) })
                          .then(() => undefined)
                      }
                    />
                    <ConfigureLocationOperationalSettingsDialog
                      availableFeatures={{
                        delivery:
                          details.effectiveFeatures.find(({ featureKey }) => featureKey === 'DELIVERY')?.enabled ??
                          false,
                        pickup:
                          details.effectiveFeatures.find(({ featureKey }) => featureKey === 'PICKUP')?.enabled ?? false,
                        dineIn:
                          details.effectiveFeatures.find(({ featureKey }) => featureKey === 'DINE_IN')?.enabled ??
                          false,
                        scheduledOrders:
                          details.effectiveFeatures.find(({ featureKey }) => featureKey === 'SCHEDULED_ORDERS')
                            ?.enabled ?? false,
                      }}
                      isOpen={locationOperationalSettingsDialogLocationId === location.id}
                      isSubmitting={
                        updateLocationConfigurationMutation.isPending &&
                        locationOperationalSettingsDialogLocationId === location.id
                      }
                      location={location}
                      onOpenChange={(open) => setLocationOperationalSettingsDialogLocationId(open ? location.id : null)}
                      onSubmit={(values: LocationOperationalSettingsFormValues) =>
                        updateLocationConfigurationMutation
                          .mutateAsync({ locationId: location.id, input: values })
                          .then(() => undefined)
                      }
                    />
                    <ConfigureLocationWeeklyOpeningHoursDialog
                      enabledFulfillmentMethods={[
                        location.deliveryEnabled && 'DELIVERY',
                        location.pickupEnabled && 'PICKUP',
                        location.dineInEnabled && 'DINE_IN',
                      ].filter((value): value is 'DELIVERY' | 'PICKUP' | 'DINE_IN' => Boolean(value))}
                      isOpen={locationWeeklyOpeningHoursDialogLocationId === location.id}
                      isSubmitting={
                        replaceLocationWeeklyOpeningHoursMutation.isPending &&
                        locationWeeklyOpeningHoursDialogLocationId === location.id
                      }
                      location={location}
                      openingHours={hours}
                      onOpenChange={(open) => setLocationWeeklyOpeningHoursDialogLocationId(open ? location.id : null)}
                      onSubmit={(values) =>
                        replaceLocationWeeklyOpeningHoursMutation
                          .mutateAsync({ locationId: location.id, values })
                          .then(() => undefined)
                      }
                    />
                    <Button
                      className="w-full sm:ml-auto sm:w-auto"
                      disabled={location.status !== 'ACTIVE' && !locationReadyForActivation}
                      size="sm"
                      variant={location.status === 'ACTIVE' ? 'outline' : 'default'}
                      onClick={() =>
                        setPendingLocationStatusChange({
                          locationId: location.id,
                          locationName: location.name,
                          status: location.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                        })
                      }
                    >
                      <Power data-icon="inline-start" />
                      {location.status === 'ACTIVE' ? 'Suspend location' : 'Activate location'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent className="pt-5" value="features">
          <RestaurantFeatureAccessTab
            details={details}
            disabled={featureMutation.isPending}
            onRequestChange={(featureKey, enabled) => setPendingFeatureChange({ featureKey, enabled })}
          />
        </TabsContent>

        <TabsContent className="pt-5" value="owners">
          <RestaurantOwnersTab
            owners={ownersQuery.data ?? []}
            pending={ownersQuery.isPending}
            error={ownersQuery.error}
            provisioningOpen={isOwnerProvisioningDialogOpen}
            provisioning={provisionOwnerMutation.isPending}
            onRetry={() => void ownersQuery.refetch()}
            onProvisioningOpenChange={setIsOwnerProvisioningDialogOpen}
            onProvision={(values) => provisionOwnerMutation.mutateAsync(values).then(() => undefined)}
            revoking={revokeOwnerMutation.isPending}
            onRevoke={setPendingOwnerRevocation}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={pendingOwnerRevocation !== null}
        onOpenChange={(open) => {
          if (!open && !revokeOwnerMutation.isPending) setPendingOwnerRevocation(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access for {pendingOwnerRevocation?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingOwnerRevocation?.email} will lose access to this restaurant immediately and every active session
              for that account will be ended. The account and its menu data are kept; you can invite the same email
              again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeOwnerMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={revokeOwnerMutation.isPending || pendingOwnerRevocation === null}
              onClick={(event) => {
                event.preventDefault()
                if (!pendingOwnerRevocation) return
                revokeOwnerMutation.mutate(pendingOwnerRevocation)
              }}
            >
              {revokeOwnerMutation.isPending ? (
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
              ) : null}
              {revokeOwnerMutation.isPending ? 'Revoking' : 'Revoke access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingFeatureChange !== null}
        onOpenChange={(open) => {
          if (!open && !featureMutation.isPending) setPendingFeatureChange(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingFeatureChange?.enabled ? 'Enable' : 'Disable'}{' '}
              {pendingFeatureChange
                ? (restaurantFeatureNames[pendingFeatureChange.featureKey] ?? pendingFeatureChange.featureKey)
                : 'feature'}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingFeatureChange?.enabled === pendingFeature?.packageEnabled
                ? `This removes the restaurant override and returns the feature to the ${restaurant.packageName} package default.`
                : `This creates a restaurant-specific override to the ${restaurant.packageName} package. You can change it again later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={featureMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={featureMutation.isPending || pendingFeatureChange === null}
              onClick={(event) => {
                event.preventDefault()
                if (!pendingFeatureChange) return
                setFeature(pendingFeatureChange.featureKey, pendingFeatureChange.enabled)
              }}
            >
              {featureMutation.isPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
              {featureMutation.isPending
                ? pendingFeatureChange?.enabled
                  ? 'Enabling feature'
                  : 'Disabling feature'
                : 'Confirm change'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingLocationStatusChange !== null}
        onOpenChange={(open) => {
          if (!open && !updateLocationConfigurationMutation.isPending) setPendingLocationStatusChange(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingLocationStatusChange?.status === 'ACTIVE' ? 'Activate this location?' : 'Suspend this location?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingLocationStatusChange?.status === 'ACTIVE'
                ? `${pendingLocationStatusChange.locationName} will become available for restaurant publishing and ordering workflows.`
                : `${pendingLocationStatusChange?.locationName} will stop accepting new orders until it is activated again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateLocationConfigurationMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateLocationConfigurationMutation.isPending || !pendingLocationStatusChange}
              onClick={(event) => {
                event.preventDefault()
                if (!pendingLocationStatusChange) return
                updateLocationConfigurationMutation.mutate({
                  locationId: pendingLocationStatusChange.locationId,
                  input: { status: pendingLocationStatusChange.status },
                })
              }}
            >
              {updateLocationConfigurationMutation.isPending ? (
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
              ) : null}
              {updateLocationConfigurationMutation.isPending
                ? pendingLocationStatusChange?.status === 'ACTIVE'
                  ? 'Activating location'
                  : 'Suspending location'
                : pendingLocationStatusChange?.status === 'ACTIVE'
                  ? 'Activate location'
                  : 'Suspend location'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingRestaurantChange !== null}
        onOpenChange={(open) => {
          if (!open && !updateMutation.isPending) setPendingRestaurantChange(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingRestaurantChange?.kind === 'package'
                ? 'Change restaurant package?'
                : pendingRestaurantChange?.status === 'ACTIVE'
                  ? 'Activate this restaurant?'
                  : 'Suspend this restaurant?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRestaurantChange?.kind === 'package'
                ? `Change ${restaurant.name} from ${restaurant.packageName} to ${pendingRestaurantChange.packageName}? Package feature defaults may change.`
                : pendingRestaurantChange?.status === 'ACTIVE'
                  ? `${restaurant.name} will be published using its active locations and their configured hours.`
                  : `${restaurant.name} will stop accepting new orders until it is activated again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateMutation.isPending || pendingRestaurantChange === null}
              onClick={(event) => {
                event.preventDefault()
                if (!pendingRestaurantChange) return
                const input =
                  pendingRestaurantChange.kind === 'package'
                    ? { packageId: pendingRestaurantChange.packageId }
                    : { status: pendingRestaurantChange.status }
                updateMutation.mutate(input)
              }}
            >
              {updateMutation.isPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
              {updateMutation.isPending
                ? pendingRestaurantChange?.kind === 'package'
                  ? 'Changing package'
                  : pendingRestaurantChange?.status === 'ACTIVE'
                    ? 'Activating restaurant'
                    : 'Suspending restaurant'
                : pendingRestaurantChange?.kind === 'status'
                  ? pendingRestaurantChange.status === 'ACTIVE'
                    ? 'Activate restaurant'
                    : 'Suspend restaurant'
                  : 'Confirm change'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function getFulfillmentLabel(location: RestaurantDetails['locations'][number]) {
  return [
    location.deliveryEnabled && 'Delivery',
    location.pickupEnabled && 'Pickup',
    location.dineInEnabled && 'Dine-in',
  ]
    .filter(Boolean)
    .join(', ')
}

function ReadinessItem({ label, ready }: { label: string; ready: boolean }) {
  const Icon = ready ? CheckCircle2 : CircleAlert
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
      <Icon className={ready ? 'size-4 text-success' : 'size-4 text-muted-foreground'} aria-hidden="true" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}

function DetailsFailure({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto flex min-h-80 max-w-lg flex-col items-center justify-center text-center">
      <Settings2 className="size-7 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold">Restaurant unavailable</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 flex gap-2">
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw data-icon="inline-start" />
            Try again
          </Button>
        ) : null}
        <Button asChild>
          <Link to="/dashboard/restaurants">Back to restaurants</Link>
        </Button>
      </div>
    </div>
  )
}
