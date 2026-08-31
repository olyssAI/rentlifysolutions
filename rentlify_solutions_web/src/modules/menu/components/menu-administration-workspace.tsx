import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, ImageOff, MapPin, Pencil, Plus, Search, Send, Utensils } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ContentLoadingIndicator } from '@/components/feedback/content-loading-indicator'
import {
  CategoryDialog,
  ConfirmationDialog,
  DuplicateMenuItemDialog,
  ItemDialog,
  LocationAvailabilityDialog,
} from '@/modules/menu/components/menu-administration-dialogs'
import {
  createMenuAdministrationApi,
  type MenuCategory,
  type MenuItem,
} from '@/modules/menu/api/menu-administration-api'
import type {
  DuplicateMenuItemFormValues,
  LocationAvailabilityFormValues,
  MenuCategoryFormValues,
  MenuItemFormValues,
} from '@/modules/menu/validation/menu-administration-form-schemas'
import {
  toLocationAvailabilityPayload,
  toMenuCategoryPayload,
  toMenuItemPayload,
} from '@/modules/menu/validation/menu-administration-form-schemas'
import { restaurantOwnerApi } from '@/modules/restaurant-owner-dashboard/api/restaurant-owner-api'

export function MenuAdministrationWorkspace() {
  const menuScopeKey = 'restaurant-owner'
  const menuAdministrationApi = createMenuAdministrationApi()
  const [search, setSearch] = useState('')
  const [categoryBeingEdited, setCategoryBeingEdited] = useState<MenuCategory | null | 'new'>(null)
  const [itemBeingEdited, setItemBeingEdited] = useState<MenuItem | null | 'new'>(null)
  const [itemBeingDuplicated, setItemBeingDuplicated] = useState<MenuItem | null>(null)
  const [itemAvailabilityBeingEdited, setItemAvailabilityBeingEdited] = useState<MenuItem | null>(null)
  const [publishConfirmationOpen, setPublishConfirmationOpen] = useState(false)
  const queryClient = useQueryClient()
  const menuQuery = useQuery({
    queryKey: ['menu-administration', menuScopeKey],
    queryFn: menuAdministrationApi.list,
    enabled: Boolean(menuScopeKey),
  })
  const restaurantQuery = useQuery({
    queryKey: ['restaurant-details', menuScopeKey],
    queryFn: async () => (await restaurantOwnerApi.context()).details,
  })
  const publicationQuery = useQuery({
    queryKey: ['menu-publication', menuScopeKey],
    queryFn: menuAdministrationApi.publication,
    enabled: Boolean(menuScopeKey),
  })
  const ownerContextQuery = useQuery({
    queryKey: ['restaurant-owner-context'],
    queryFn: restaurantOwnerApi.context,
  })
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['menu-administration', menuScopeKey] }),
      queryClient.invalidateQueries({ queryKey: ['menu-publication', menuScopeKey] }),
    ])
  const categoryMutation = useMutation({
    mutationFn: (values: MenuCategoryFormValues) =>
      categoryBeingEdited === 'new'
        ? menuAdministrationApi.createCategory(toMenuCategoryPayload(values))
        : menuAdministrationApi.updateCategory(categoryBeingEdited?.id ?? '', toMenuCategoryPayload(values)),
    onSuccess: async () => {
      await refresh()
      setCategoryBeingEdited(null)
      toast.success('Menu category saved')
    },
    onError: (error) => toast.error('Category was not saved', { description: error.message }),
  })
  const itemMutation = useMutation({
    mutationFn: (values: MenuItemFormValues) =>
      itemBeingEdited === 'new'
        ? menuAdministrationApi.createItem(toMenuItemPayload(values))
        : menuAdministrationApi.updateItem(itemBeingEdited?.id ?? '', toMenuItemPayload(values)),
    onSuccess: async () => {
      await refresh()
      setItemBeingEdited(null)
      toast.success('Menu item saved')
    },
    onError: (error) => toast.error('Menu item was not saved', { description: error.message }),
  })
  const duplicationMutation = useMutation({
    mutationFn: (values: DuplicateMenuItemFormValues) =>
      menuAdministrationApi.duplicateItem(itemBeingDuplicated?.id ?? '', values),
    onSuccess: async () => {
      await refresh()
      setItemBeingDuplicated(null)
      toast.success('Menu item duplicated', { description: 'The copy was saved as a draft.' })
    },
    onError: (error) => toast.error('Menu item was not duplicated', { description: error.message }),
  })
  const availabilityMutation = useMutation({
    mutationFn: (values: LocationAvailabilityFormValues) =>
      menuAdministrationApi.replaceLocationAvailability(
        itemAvailabilityBeingEdited?.id ?? '',
        toLocationAvailabilityPayload(values),
      ),
    onSuccess: async () => {
      await refresh()
      setItemAvailabilityBeingEdited(null)
      toast.success('Location availability saved')
    },
    onError: (error) => toast.error('Availability was not saved', { description: error.message }),
  })
  const publishingMutation = useMutation({
    mutationFn: menuAdministrationApi.publish,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menu-publication', menuScopeKey] })
      setPublishConfirmationOpen(false)
      toast.success('Menu published')
    },
    onError: (error) => toast.error('Menu was not published', { description: error.message }),
  })
  if (!menuScopeKey) return null
  const normalizedSearch = search.trim().toLowerCase()
  const categories = menuQuery.data?.categories ?? []
  const items = (menuQuery.data?.items ?? []).filter(
    (item) =>
      !normalizedSearch ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch),
  )
  const ownerAccessSuspended = ownerContextQuery.data?.membership.restaurantStatus === 'SUSPENDED'
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Button asChild size="sm" variant="outline">
        <Link to="/dashboard">
          <ArrowLeft data-icon="inline-start" /> Back to restaurant
        </Link>
      </Button>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Menu management</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Build categories and products before publishing the customer menu.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={ownerAccessSuspended} variant="outline" onClick={() => setCategoryBeingEdited('new')}>
            <Plus data-icon="inline-start" /> Add category
          </Button>
          <Button disabled={ownerAccessSuspended || categories.length === 0} onClick={() => setItemBeingEdited('new')}>
            <Plus data-icon="inline-start" /> Add menu item
          </Button>
        </div>
      </header>
      {ownerAccessSuspended ? (
        <Alert>
          <AlertTitle>Menu access is read-only</AlertTitle>
          <AlertDescription>
            Rentlify has suspended this restaurant. You can review the menu, but editing and publishing are unavailable.
          </AlertDescription>
        </Alert>
      ) : null}
      <Card className="shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">Customer menu</p>
              {publicationQuery.data?.currentPublication ? (
                <Badge variant="outline">Published</Badge>
              ) : (
                <Badge variant="secondary">Not published</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {publicationQuery.data?.currentPublication
                ? `Last published ${publicationQuery.data.currentPublication.publishedAt.toLocaleString('en-PK')}`
                : 'Publish a verified snapshot when the menu is ready for customers.'}
            </p>
          </div>
          <Button
            disabled={ownerAccessSuspended || !publicationQuery.data?.readiness.ready || publishingMutation.isPending}
            onClick={() => setPublishConfirmationOpen(true)}
          >
            <Send data-icon="inline-start" /> Publish menu
          </Button>
        </CardContent>
      </Card>
      {publicationQuery.data && !publicationQuery.data.readiness.ready ? (
        <Alert>
          <AlertTitle>Menu is not ready to publish</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {publicationQuery.data.readiness.issues.map((issue, issueIndex) => (
                <li key={`${issue.code}-${issueIndex}`}>{issue.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      {publicationQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Publishing status is unavailable</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{publicationQuery.error.message}</span>
            <Button size="sm" variant="outline" onClick={() => publicationQuery.refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search menu items"
        />
      </div>
      {menuQuery.isPending ? <ContentLoadingIndicator label="Loading menu…" /> : null}
      {menuQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm">{menuQuery.error.message}</p>
            <Button className="mt-4" variant="outline" onClick={() => menuQuery.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {menuQuery.isSuccess ? (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <Card className="h-fit shadow-none">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Create a category to start your menu.</p>
              ) : (
                categories.map((category) => (
                  <button
                    className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left hover:bg-muted"
                    key={category.id}
                    disabled={ownerAccessSuspended}
                    onClick={() => setCategoryBeingEdited(category)}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {category.imageUrl ? (
                        <img
                          className="size-10 shrink-0 rounded-lg border object-cover"
                          src={category.imageUrl}
                          alt=""
                        />
                      ) : null}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{category.name}</span>
                        <span className="text-xs text-muted-foreground">Order {category.sortOrder}</span>
                      </span>
                    </span>
                    <Badge variant="outline">{category.isActive ? 'Active' : 'Hidden'}</Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4">
            {items.length === 0 ? (
              <Card className="border-dashed shadow-none">
                <CardContent className="grid min-h-52 place-items-center text-center">
                  <div>
                    <Utensils className="mx-auto size-6 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">No menu items found</p>
                    <p className="mt-1 text-xs text-muted-foreground">Add the first product or adjust your search.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              items.map((item) => (
                <Card className="shadow-none" key={item.id}>
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl border bg-muted sm:size-24 sm:aspect-square">
                      {item.imageUrl ? (
                        <img
                          className="size-full object-cover"
                          src={item.imageUrl}
                          alt={`${item.name} menu item`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-muted-foreground">
                          <ImageOff className="size-5" aria-hidden="true" />
                          <span className="sr-only">No image provided for {item.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{item.name}</p>
                        {item.isSoldOut ? <Badge variant="destructive">Sold out</Badge> : null}
                        {item.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
                        {!item.isActive ? <Badge variant="secondary">Draft</Badge> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                      <p className="mt-2 text-sm font-semibold">PKR {(item.basePrice / 100).toLocaleString('en-PK')}</p>
                    </div>
                    <div className="grid gap-2 sm:flex">
                      <Button
                        disabled={ownerAccessSuspended}
                        variant="outline"
                        onClick={() => setItemAvailabilityBeingEdited(item)}
                      >
                        <MapPin data-icon="inline-start" /> Locations
                      </Button>
                      <Button
                        disabled={ownerAccessSuspended}
                        variant="outline"
                        onClick={() => setItemBeingDuplicated(item)}
                      >
                        <Copy data-icon="inline-start" /> Duplicate
                      </Button>
                      <Button
                        disabled={ownerAccessSuspended}
                        variant="outline"
                        onClick={() => setItemBeingEdited(item)}
                      >
                        <Pencil data-icon="inline-start" /> Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : null}
      <CategoryDialog
        menuAdministrationApi={menuAdministrationApi}
        value={categoryBeingEdited}
        submitting={categoryMutation.isPending}
        onClose={() => setCategoryBeingEdited(null)}
        onSubmit={(values) => categoryMutation.mutateAsync(values).then(() => undefined)}
      />
      <ItemDialog
        menuAdministrationApi={menuAdministrationApi}
        categories={categories}
        value={itemBeingEdited}
        submitting={itemMutation.isPending}
        onClose={() => setItemBeingEdited(null)}
        onSubmit={(values) => itemMutation.mutateAsync(values).then(() => undefined)}
      />
      <DuplicateMenuItemDialog
        item={itemBeingDuplicated}
        submitting={duplicationMutation.isPending}
        onClose={() => setItemBeingDuplicated(null)}
        onSubmit={(values) => duplicationMutation.mutateAsync(values).then(() => undefined)}
      />
      <LocationAvailabilityDialog
        item={itemAvailabilityBeingEdited}
        locations={restaurantQuery.data?.locations ?? []}
        submitting={availabilityMutation.isPending}
        onClose={() => setItemAvailabilityBeingEdited(null)}
        onSubmit={(values) => availabilityMutation.mutateAsync(values).then(() => undefined)}
      />
      <ConfirmationDialog
        open={publishConfirmationOpen}
        title="Publish customer menu?"
        description="This creates an immutable menu version for customer-facing applications. Future edits require another publish."
        submitting={publishingMutation.isPending}
        actionLabel="Publish menu"
        pendingLabel="Publishing menu"
        onClose={() => setPublishConfirmationOpen(false)}
        onConfirm={() => publishingMutation.mutate()}
      />
    </div>
  )
}
