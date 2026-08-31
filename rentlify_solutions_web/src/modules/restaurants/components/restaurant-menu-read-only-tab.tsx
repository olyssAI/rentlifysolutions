import { useQuery } from '@tanstack/react-query'
import { ImageOff, RefreshCw, Utensils } from 'lucide-react'
import { useState } from 'react'

import { ContentLoadingIndicator } from '@/components/feedback/content-loading-indicator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getRestaurantMenuForAdministrator } from '@/modules/menu/api/menu-administration-api'

const allCategories = 'all'
const priceFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 2,
})

export function RestaurantMenuReadOnlyTab({ restaurantId }: { restaurantId: string }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(allCategories)
  const menuQuery = useQuery({
    queryKey: ['restaurant-menu-read-only', restaurantId],
    queryFn: () => getRestaurantMenuForAdministrator(restaurantId),
  })

  if (menuQuery.isPending) {
    return <ContentLoadingIndicator fillViewport={false} label="Loading restaurant menu…" />
  }

  if (menuQuery.isError) {
    return (
      <Card className="rounded-2xl shadow-none">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Menu unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">{menuQuery.error.message}</p>
          </div>
          <Button variant="outline" onClick={() => menuQuery.refetch()}>
            <RefreshCw data-icon="inline-start" /> Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { categories, items } = menuQuery.data
  const visibleItems =
    selectedCategoryId === allCategories ? items : items.filter(({ categoryId }) => categoryId === selectedCategoryId)

  return (
    <Card className="overflow-hidden rounded-2xl shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Restaurant menu</CardTitle>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Read-only visibility for platform support. Menu changes and publication remain available only to the
              restaurant owner.
            </p>
          </div>
          <Badge variant="outline">Read only</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        {categories.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Utensils className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 font-semibold">No menu categories yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              The restaurant owner has not created menu content for this restaurant.
            </p>
          </div>
        ) : (
          <>
            <Tabs value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <div className="max-w-full overflow-x-auto pb-2">
                <TabsList className="h-auto w-max min-w-full justify-start gap-1 sm:min-w-0" variant="line">
                  <TabsTrigger value={allCategories}>All ({items.length})</TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name} ({items.filter(({ categoryId }) => categoryId === category.id).length})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>

            {visibleItems.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                <p className="font-semibold">No items in this category</p>
                <p className="mt-1 text-sm text-muted-foreground">Choose another category to continue browsing.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((item) => {
                  const category = categories.find(({ id }) => id === item.categoryId)
                  return (
                    <article className="overflow-hidden rounded-2xl border border-border bg-card" key={item.id}>
                      <div className="aspect-[16/9] overflow-hidden bg-muted">
                        {item.imageUrl ? (
                          <img alt={item.name} className="size-full object-cover" loading="lazy" src={item.imageUrl} />
                        ) : (
                          <div className="grid size-full place-items-center text-muted-foreground">
                            <ImageOff className="size-6" aria-hidden="true" />
                            <span className="sr-only">No image provided</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{item.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{category?.name ?? 'Uncategorized'}</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold tabular-nums">
                            {priceFormatter.format(item.basePrice / 100)}
                          </p>
                        </div>
                        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                          {item.description || 'No description provided.'}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant={item.isActive ? 'default' : 'outline'}>
                            {item.isActive ? 'Active' : 'Draft'}
                          </Badge>
                          {item.isSoldOut ? <Badge variant="destructive">Sold out</Badge> : null}
                          {item.isFeatured ? <Badge variant="secondary">Featured</Badge> : null}
                          {item.modifierGroups.length > 0 ? (
                            <Badge variant="outline">
                              {item.modifierGroups.length}{' '}
                              {item.modifierGroups.length === 1 ? 'modifier group' : 'modifier groups'}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
