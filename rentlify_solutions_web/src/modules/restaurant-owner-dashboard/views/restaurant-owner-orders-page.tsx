import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3, MapPin, PackageCheck, Phone, RefreshCw, ShoppingBag, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentLoadingIndicator } from '@/components/feedback/content-loading-indicator'
import {
  restaurantOwnerApi,
  type OwnerOrder,
  type OwnerOrderStatus,
} from '@/modules/restaurant-owner-dashboard/api/restaurant-owner-api'

const nextActions: Record<
  OwnerOrderStatus,
  Array<{ label: string; status: Exclude<OwnerOrderStatus, 'PLACED'>; variant?: 'default' | 'destructive' | 'outline' }>
> = {
  PLACED: [
    { label: 'Accept order', status: 'ACCEPTED' },
    { label: 'Cancel', status: 'CANCELLED', variant: 'destructive' },
  ],
  ACCEPTED: [
    { label: 'Start preparing', status: 'PREPARING' },
    { label: 'Cancel', status: 'CANCELLED', variant: 'destructive' },
  ],
  PREPARING: [
    { label: 'Mark ready', status: 'READY' },
    { label: 'Cancel', status: 'CANCELLED', variant: 'destructive' },
  ],
  READY: [{ label: 'Complete order', status: 'COMPLETED' }],
  COMPLETED: [],
  CANCELLED: [],
}

const money = (value: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(value / 100)
const dateTime = (value: Date) =>
  new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(value)

export function RestaurantOwnerOrdersPage() {
  const queryClient = useQueryClient()
  const [activePage, setActivePage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const previousActiveTotal = useRef<number | null>(null)
  const activeQuery = useQuery({
    queryKey: ['restaurant-owner-orders', 'ACTIVE', activePage],
    queryFn: () => restaurantOwnerApi.orders('ACTIVE', activePage),
    refetchInterval: 15_000,
  })
  const historyQuery = useQuery({
    queryKey: ['restaurant-owner-orders', 'HISTORY', historyPage],
    queryFn: () => restaurantOwnerApi.orders('HISTORY', historyPage),
  })
  useEffect(() => {
    const currentTotal = activeQuery.data?.total
    if (currentTotal === undefined) return
    if (previousActiveTotal.current !== null && currentTotal > previousActiveTotal.current) {
      const added = currentTotal - previousActiveTotal.current
      toast.success(added === 1 ? 'A new customer order arrived.' : `${added} new customer orders arrived.`)
    }
    previousActiveTotal.current = currentTotal
  }, [activeQuery.data?.total])
  const transition = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: Exclude<OwnerOrderStatus, 'PLACED'> }) =>
      restaurantOwnerApi.transitionOrder(orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-owner-orders'] }),
  })

  if (activeQuery.isPending || historyQuery.isPending)
    return <ContentLoadingIndicator label="Loading customer orders…" />
  if (activeQuery.isError || historyQuery.isError)
    return (
      <Alert variant="destructive">
        <AlertTitle>Orders unavailable</AlertTitle>
        <AlertDescription className="mt-2">
          {(activeQuery.error ?? historyQuery.error)?.message}
          <Button
            className="mt-4 w-fit"
            onClick={() => void Promise.all([activeQuery.refetch(), historyQuery.refetch()])}
            size="sm"
            variant="outline"
          >
            <RefreshCw />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )

  const active = activeQuery.data?.orders ?? []
  const previous = historyQuery.data?.orders ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary">
            <ShoppingBag className="size-3.5" aria-hidden="true" />
            Live order queue
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Customer orders</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Accept new cash orders and move each one through preparation to completion.
          </p>
        </div>
        <Button onClick={() => void Promise.all([activeQuery.refetch(), historyQuery.refetch()])} variant="outline">
          <RefreshCw />
          Refresh
        </Button>
      </header>
      {transition.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Order was not updated</AlertTitle>
          <AlertDescription>{transition.error.message}</AlertDescription>
        </Alert>
      ) : null}
      {!active.length && !previous.length ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <span className="grid size-14 place-items-center rounded-full bg-muted">
              <PackageCheck className="size-6" />
            </span>
            <h3 className="mt-4 font-semibold">No customer orders yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              New orders will appear here automatically after a customer checks out.
            </p>
          </CardContent>
        </Card>
      ) : null}
      {active.length ? <OrderSection orders={active} title="Needs attention" transition={transition} /> : null}
      {(activeQuery.data?.totalPages ?? 1) > 1 ? (
        <Pagination page={activePage} totalPages={activeQuery.data?.totalPages ?? 1} onPageChange={setActivePage} />
      ) : null}
      {previous.length ? (
        <OrderSection orders={previous} title="Completed and cancelled" transition={transition} />
      ) : null}
      {(historyQuery.data?.totalPages ?? 1) > 1 ? (
        <Pagination page={historyPage} totalPages={historyQuery.data?.totalPages ?? 1} onPageChange={setHistoryPage} />
      ) : null}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <nav aria-label="Order pages" className="flex items-center justify-end gap-3">
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)} variant="outline">
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} variant="outline">
        Next
      </Button>
    </nav>
  )
}

type TransitionMutation = {
  isPending: boolean
  variables?: { orderId: string; status: Exclude<OwnerOrderStatus, 'PLACED'> }
  mutate: (variables: { orderId: string; status: Exclude<OwnerOrderStatus, 'PLACED'> }) => void
}

function OrderSection({
  orders,
  title,
  transition,
}: {
  orders: OwnerOrder[]
  title: string
  transition: TransitionMutation
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="outline">{orders.length}</Badge>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} transition={transition} />
        ))}
      </div>
    </section>
  )
}

function OrderCard({ order, transition }: { order: OwnerOrder; transition: TransitionMutation }) {
  const pending = transition.isPending && transition.variables?.orderId === order.id
  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            {dateTime(order.placedAt)}
          </p>
        </div>
        <Badge>{order.status.toLowerCase().replace('_', ' ')}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-2">
          <span className="flex items-center gap-2">
            <UserRound className="size-4" />
            {order.customerName}
          </span>
          <span className="flex items-center gap-2">
            <Phone className="size-4" />
            {order.customerPhone}
          </span>
          <span className="flex items-center gap-2 sm:col-span-2">
            <MapPin className="size-4" />
            {order.fulfillmentType === 'DELIVERY'
              ? [order.deliveryAddress?.addressLine1, order.deliveryAddress?.city].filter(Boolean).join(', ')
              : 'Customer pickup'}
          </span>
        </div>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li className="flex justify-between gap-4 text-sm" key={item.id}>
              <div>
                <span className="font-medium">
                  {item.quantity} × {item.itemName}
                </span>
                {item.modifiers.length ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.modifiers.map(({ optionName }) => optionName).join(', ')}
                  </p>
                ) : null}
              </div>
              <span className="font-medium">{money(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        {order.customerNote ? (
          <p className="rounded-lg border border-border p-3 text-sm">
            <span className="font-medium">Customer note:</span> {order.customerNote}
          </p>
        ) : null}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Cash total</span>
          <strong className="text-lg">{money(order.total)}</strong>
        </div>
        {nextActions[order.status].length ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {nextActions[order.status].map((action) => (
              <Button
                disabled={pending}
                key={action.status}
                onClick={() => transition.mutate({ orderId: order.id, status: action.status })}
                variant={action.variant ?? 'default'}
              >
                {pending ? 'Updating…' : action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
