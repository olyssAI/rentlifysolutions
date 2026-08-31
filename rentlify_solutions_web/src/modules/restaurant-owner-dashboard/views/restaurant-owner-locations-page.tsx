import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Clock3, LoaderCircle, MapPin, Power, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentLoadingIndicator } from '@/components/feedback/content-loading-indicator'
import {
  ConfigureRestaurantOwnerDeliveryZonesDialog,
  ConfigureRestaurantOwnerSpecialHoursDialog,
} from '@/modules/restaurant-owner-dashboard/components/configure-restaurant-owner-location-advanced-settings-dialogs'
import {
  restaurantOwnerApi,
  type UpdateOwnerLocationPayload,
} from '@/modules/restaurant-owner-dashboard/api/restaurant-owner-api'
import {
  toDeliveryZonesPayload,
  toSpecialHoursPayload,
  type DeliveryZonesFormValues,
  type SpecialHoursFormValues,
} from '@/modules/restaurant-owner-dashboard/validation/restaurant-owner-location-advanced-settings-form-schemas'
import { ConfigureLocationOperationalSettingsDialog } from '@/modules/restaurants/components/configure-location-operational-settings-dialog'
import { ConfigureLocationWeeklyOpeningHoursDialog } from '@/modules/restaurants/components/configure-location-weekly-opening-hours-dialog'
import { EditLocationDialog } from '@/modules/restaurants/components/edit-location-dialog'
import {
  toLocationDetailsPayload,
  type LocationDetailsFormValues,
} from '@/modules/restaurants/validation/location-details-form-schema'
import type { LocationOperationalSettingsFormValues } from '@/modules/restaurants/validation/location-operational-settings-form-schema'
import type {
  FulfillmentMethodValue,
  LocationWeeklyOpeningHoursFormValues,
} from '@/modules/restaurants/validation/location-weekly-opening-hours-form-schema'

type PendingStatusChange = { locationId: string; name: string; status: 'ACTIVE' | 'SUSPENDED' }
type LocationMutationInput =
  | { action: 'hours'; locationId: string; values: LocationWeeklyOpeningHoursFormValues }
  | { action: 'special'; locationId: string; values: ReturnType<typeof toSpecialHoursPayload> }
  | { action: 'zones'; locationId: string; values: ReturnType<typeof toDeliveryZonesPayload> }
  | { action: 'update'; locationId: string; values: UpdateOwnerLocationPayload }

export function RestaurantOwnerLocationsPage() {
  const queryClient = useQueryClient()
  const [openDialog, setOpenDialog] = useState<{ type: string; locationId?: string } | null>(null)
  const [pendingStatus, setPendingStatus] = useState<PendingStatusChange | null>(null)
  const contextQuery = useQuery({ queryKey: ['restaurant-owner-context'], queryFn: restaurantOwnerApi.context })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['restaurant-owner-context'] })
  const mutation = useMutation({
    mutationFn: async (input: LocationMutationInput) => {
      if (input.action === 'hours') return restaurantOwnerApi.replaceOpeningHours(input.locationId, input.values)
      if (input.action === 'special') return restaurantOwnerApi.replaceSpecialHours(input.locationId, input.values)
      if (input.action === 'zones') return restaurantOwnerApi.replaceDeliveryZones(input.locationId, input.values)
      return restaurantOwnerApi.updateLocation(input.locationId, input.values)
    },
    onSuccess: async () => {
      await refresh()
      setOpenDialog(null)
      setPendingStatus(null)
      toast.success('Location updated')
    },
    onError: (error) => toast.error('Location was not updated', { description: error.message }),
  })
  if (contextQuery.isPending) return <ContentLoadingIndicator label="Loading locations and opening hours…" />
  if (contextQuery.isError)
    return (
      <Alert className="mx-auto max-w-4xl" variant="destructive">
        <AlertCircle />
        <AlertTitle>Locations unavailable</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{contextQuery.error.message}</p>
          <Button className="mt-4" variant="outline" onClick={() => void contextQuery.refetch()}>
            <RefreshCw /> Try again
          </Button>
        </AlertDescription>
      </Alert>
    )

  const details = contextQuery.data.details
  const suspended = contextQuery.data.membership.restaurantStatus === 'SUSPENDED'
  const features = {
    delivery: details.effectiveFeatures.some((feature) => feature.featureKey === 'DELIVERY' && feature.enabled),
    pickup: details.effectiveFeatures.some((feature) => feature.featureKey === 'PICKUP' && feature.enabled),
    dineIn: details.effectiveFeatures.some((feature) => feature.featureKey === 'DINE_IN' && feature.enabled),
    scheduledOrders: details.effectiveFeatures.some(
      (feature) => feature.featureKey === 'SCHEDULED_ORDERS' && feature.enabled,
    ),
    // Zone configuration is refused by the API unless this entitlement is granted, so the
    // control is hidden rather than shown and failing on save.
    advancedDeliveryZones: details.effectiveFeatures.some(
      (feature) => feature.featureKey === 'ADVANCED_DELIVERY_ZONES' && feature.enabled,
    ),
  }
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header className="border-b border-border pb-7">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Locations & hours</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Manage branch operations, service areas, exceptions, and customer ordering hours.
          </p>
        </div>
      </header>
      {suspended ? (
        <Alert>
          <AlertCircle />
          <AlertTitle>Restaurant access is read-only</AlertTitle>
          <AlertDescription>
            Rentlify has suspended this restaurant. You can review location settings, but changes are unavailable until
            access is restored.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid grid-cols-1 gap-5">
        {details.locations.map((location) => {
          const hours = details.openingHours.filter((hour) => hour.locationId === location.id)
          const enabledMethods = [
            location.deliveryEnabled ? 'DELIVERY' : null,
            location.pickupEnabled ? 'PICKUP' : null,
            location.dineInEnabled ? 'DINE_IN' : null,
          ].filter((method): method is FulfillmentMethodValue => method !== null)
          const configured = new Set(hours.map((hour) => hour.fulfillmentType))
          const ready =
            enabledMethods.length > 0 &&
            enabledMethods.every((method) => configured.has(method)) &&
            Boolean(location.name && location.phone && location.addressLine1 && location.city && location.province)
          const specialHours = details.specialHours
            .filter((entry) => entry.locationId === location.id)
            .map((entry) => ({
              date: entry.date,
              fulfillmentType: entry.fulfillmentType,
              isClosed: entry.isClosed,
              opensAt: entry.opensAt?.slice(0, 5) ?? null,
              closesAt: entry.closesAt?.slice(0, 5) ?? null,
              reason: entry.reason ?? '',
            }))
          const deliveryZones = details.deliveryZones
            .filter((zone) => zone.locationId === location.id)
            .map((zone) => ({
              name: zone.name,
              type: zone.type,
              postalCodesText: zone.configuration.postalCodes?.join(', ') ?? '',
              radiusKilometers: zone.configuration.radiusKilometers ?? null,
              deliveryFee: zone.deliveryFee / 100,
              minimumOrderAmount: zone.minimumOrderAmount / 100,
              freeDeliveryThreshold: zone.freeDeliveryThreshold === null ? null : zone.freeDeliveryThreshold / 100,
              isActive: zone.isActive,
            }))
          return (
            <Card className="shadow-none" key={location.id}>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                      <MapPin className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base">{location.name}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {location.addressLine1}, {location.city}
                      </p>
                    </div>
                  </div>
                  <Badge variant={location.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {location.status === 'ACTIVE' ? 'Active' : location.status === 'SUSPENDED' ? 'Suspended' : 'Draft'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Contact</p>
                    <p className="mt-1 text-sm">{location.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Weekly hours</p>
                    <p className="mt-1 flex items-center gap-2 text-sm">
                      <Clock3 className="size-4" />
                      {hours.length ? `${hours.length} configured ranges` : 'Not configured'}
                    </p>
                  </div>
                </div>
                {!suspended ? (
                  <div className="mt-5 grid gap-2 border-t pt-5 sm:flex sm:flex-wrap">
                    <EditLocationDialog
                      isOpen={openDialog?.type === 'details' && openDialog.locationId === location.id}
                      isSubmitting={mutation.isPending}
                      location={location}
                      onOpenChange={(open) => setOpenDialog(open ? { type: 'details', locationId: location.id } : null)}
                      onSubmit={(values: LocationDetailsFormValues) =>
                        mutation
                          .mutateAsync({
                            action: 'update',
                            locationId: location.id,
                            values: toLocationDetailsPayload(values),
                          })
                          .then(() => undefined)
                      }
                    />
                    <ConfigureLocationOperationalSettingsDialog
                      availableFeatures={features}
                      isOpen={openDialog?.type === 'operations' && openDialog.locationId === location.id}
                      isSubmitting={mutation.isPending}
                      location={location}
                      onOpenChange={(open) =>
                        setOpenDialog(open ? { type: 'operations', locationId: location.id } : null)
                      }
                      onSubmit={(values: LocationOperationalSettingsFormValues) =>
                        mutation
                          .mutateAsync({ action: 'update', locationId: location.id, values })
                          .then(() => undefined)
                      }
                    />
                    <ConfigureLocationWeeklyOpeningHoursDialog
                      enabledFulfillmentMethods={enabledMethods}
                      isOpen={openDialog?.type === 'hours' && openDialog.locationId === location.id}
                      isSubmitting={mutation.isPending}
                      location={location}
                      openingHours={hours}
                      onOpenChange={(open) => setOpenDialog(open ? { type: 'hours', locationId: location.id } : null)}
                      onSubmit={(values: LocationWeeklyOpeningHoursFormValues) =>
                        mutation.mutateAsync({ action: 'hours', locationId: location.id, values }).then(() => undefined)
                      }
                    />
                    <ConfigureRestaurantOwnerSpecialHoursDialog
                      enabledFulfillmentMethods={enabledMethods}
                      initialValues={{ specialHours }}
                      open={openDialog?.type === 'special' && openDialog.locationId === location.id}
                      submitting={mutation.isPending}
                      onOpenChange={(open) => setOpenDialog(open ? { type: 'special', locationId: location.id } : null)}
                      onSubmit={(values: SpecialHoursFormValues) =>
                        mutation
                          .mutateAsync({
                            action: 'special',
                            locationId: location.id,
                            values: toSpecialHoursPayload(values),
                          })
                          .then(() => undefined)
                      }
                    />
                    {location.deliveryEnabled && features.advancedDeliveryZones ? (
                      <ConfigureRestaurantOwnerDeliveryZonesDialog
                        initialValues={{ deliveryZones }}
                        open={openDialog?.type === 'zones' && openDialog.locationId === location.id}
                        submitting={mutation.isPending}
                        onOpenChange={(open) => setOpenDialog(open ? { type: 'zones', locationId: location.id } : null)}
                        onSubmit={(values: DeliveryZonesFormValues) =>
                          mutation
                            .mutateAsync({
                              action: 'zones',
                              locationId: location.id,
                              values: toDeliveryZonesPayload(values),
                            })
                            .then(() => undefined)
                        }
                      />
                    ) : null}
                    <Button
                      className="sm:ml-auto"
                      size="sm"
                      variant={location.status === 'ACTIVE' ? 'outline' : 'default'}
                      disabled={location.status !== 'ACTIVE' && !ready}
                      onClick={() =>
                        setPendingStatus({
                          locationId: location.id,
                          name: location.name,
                          status: location.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                        })
                      }
                    >
                      <Power />
                      {location.status === 'ACTIVE' ? 'Suspend location' : 'Activate location'}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {details.locations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MapPin className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 font-medium">No locations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add the first branch to begin configuring operations.</p>
          </CardContent>
        </Card>
      ) : null}
      <AlertDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setPendingStatus(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus?.status === 'ACTIVE' ? 'Activate location?' : 'Suspend location?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus?.status === 'ACTIVE'
                ? `${pendingStatus?.name ?? 'This location'} will become available for configured customer services.`
                : `${pendingStatus?.name ?? 'This location'} will stop accepting customer orders.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                if (pendingStatus)
                  mutation.mutate({
                    action: 'update',
                    locationId: pendingStatus.locationId,
                    values: { status: pendingStatus.status },
                  })
              }}
            >
              {mutation.isPending ? <LoaderCircle className="animate-spin" /> : null}
              {mutation.isPending ? 'Updating location…' : 'Confirm change'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
