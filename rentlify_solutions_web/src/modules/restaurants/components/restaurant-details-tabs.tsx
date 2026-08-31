import { MapPin, Package, RefreshCw, Store, UserRound, UserRoundX, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentLoadingIndicator } from '@/components/feedback/content-loading-indicator'
import { Switch } from '@/components/ui/switch'
import type { RestaurantDetails, RestaurantOwner } from '@/modules/restaurants/api/restaurant-api'
import { ProvisionRestaurantOwnerDialog } from '@/modules/restaurants/components/provision-restaurant-owner-dialog'
import { restaurantFeatureNames } from '@/modules/restaurants/constants/restaurant-feature-names'
import type { RestaurantOwnerProvisioningFormValues } from '@/modules/restaurants/validation/restaurant-owner-provisioning-form-schema'

export function RestaurantOverviewTab({ details }: { details: RestaurantDetails }) {
  const { restaurant } = details
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <InformationCard icon={Store} title="Restaurant">
        <InformationRow label="Contact" value={restaurant.contactEmail} />
        <InformationRow label="Phone" value={restaurant.contactPhone} />
        <InformationRow label="Legal name" value={restaurant.legalName ?? 'Not provided'} />
      </InformationCard>
      <InformationCard icon={Package} title="Package">
        <InformationRow label="Current package" value={restaurant.packageName} />
        <InformationRow
          label="Enabled features"
          value={`${details.effectiveFeatures.filter(({ enabled }) => enabled).length} of ${details.effectiveFeatures.length}`}
        />
        <InformationRow label="Overrides" value={`${details.overrides.length}`} />
      </InformationCard>
      <InformationCard icon={MapPin} title="Operations">
        <InformationRow label="Locations" value={`${details.locations.length}`} />
        <InformationRow label="Country" value={restaurant.countryCode} />
        <InformationRow
          label="Published"
          value={restaurant.publishedAt ? restaurant.publishedAt.toLocaleDateString() : 'Not published'}
        />
      </InformationCard>
    </div>
  )
}

export function RestaurantFeatureAccessTab({
  details,
  disabled,
  onRequestChange,
}: {
  details: RestaurantDetails
  disabled: boolean
  onRequestChange: (featureKey: string, enabled: boolean) => void
}) {
  return (
    <Card className="rounded-2xl shadow-none">
      <CardHeader className="border-b border-border">
        <CardTitle>Feature access</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Package defaults apply unless you explicitly override a feature for this restaurant.
        </p>
      </CardHeader>
      <CardContent className="grid p-0 sm:grid-cols-2 xl:grid-cols-3">
        {details.effectiveFeatures.map((feature) => (
          <div
            className="flex min-h-24 items-center justify-between gap-4 border-b border-border p-5 sm:border-r"
            key={feature.featureKey}
          >
            <div>
              <p className="text-sm font-medium">{restaurantFeatureNames[feature.featureKey] ?? feature.featureKey}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {!feature.isManageable
                  ? 'Retained for existing data; not part of the current packages'
                  : feature.override === null
                    ? `${details.restaurant.packageName} default`
                    : 'Restaurant override'}
              </p>
            </div>
            <Switch
              checked={feature.enabled}
              disabled={disabled || !feature.isManageable}
              aria-label={`${feature.enabled ? 'Disable' : 'Enable'} ${restaurantFeatureNames[feature.featureKey] ?? feature.featureKey}`}
              onCheckedChange={(enabled) => onRequestChange(feature.featureKey, enabled)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function RestaurantOwnersTab({
  owners,
  pending,
  error,
  provisioningOpen,
  provisioning,
  onRetry,
  onProvisioningOpenChange,
  onProvision,
  revoking,
  onRevoke,
}: {
  owners: RestaurantOwner[]
  pending: boolean
  error: Error | null
  provisioningOpen: boolean
  provisioning: boolean
  onRetry: () => void
  onProvisioningOpenChange: (open: boolean) => void
  onProvision: (values: RestaurantOwnerProvisioningFormValues) => Promise<void>
  revoking: boolean
  onRevoke: (owner: RestaurantOwner) => void
}) {
  return (
    <Card className="rounded-2xl shadow-none">
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UsersRound className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Restaurant owners</CardTitle>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Owners sign in through the shared login page and receive access only to their assigned restaurant. This
            release supports one primary owner; the membership model supports additional owners later.
          </p>
        </div>
        {!pending && !error && owners.length === 0 ? (
          <ProvisionRestaurantOwnerDialog
            isOpen={provisioningOpen}
            isSubmitting={provisioning}
            onOpenChange={onProvisioningOpenChange}
            onSubmit={onProvision}
          />
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        {pending ? (
          <ContentLoadingIndicator fillViewport={false} label="Loading restaurant owners…" />
        ) : error ? (
          <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Owner access is unavailable</p>
              <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
            </div>
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw data-icon="inline-start" /> Try again
            </Button>
          </div>
        ) : owners.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-semibold">No owner account yet</p>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              Create the primary owner login when you are ready to hand restaurant operations to the client.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {owners.map((owner) => (
              <div
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                key={owner.membershipId}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground">
                    <UserRound className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{owner.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{owner.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge variant="outline">Owner</Badge>
                  {owner.isPrimary ? <Badge>Primary</Badge> : null}
                  <span className="text-xs text-muted-foreground">Added {owner.createdAt.toLocaleDateString()}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revoking}
                    onClick={() => onRevoke(owner)}
                    aria-label={`Revoke access for ${owner.name}`}
                  >
                    <UserRoundX data-icon="inline-start" /> Revoke access
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InformationCard({ children, icon: Icon, title }: { children: ReactNode; icon: typeof Store; title: string }) {
  return (
    <Card className="rounded-2xl shadow-none">
      <CardHeader>
        <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  )
}

export function InformationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
