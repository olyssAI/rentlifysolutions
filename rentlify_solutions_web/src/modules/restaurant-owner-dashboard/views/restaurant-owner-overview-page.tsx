import { ArrowRight, Clock3, MapPin, RefreshCw, Settings2, ShoppingBag, Utensils, WalletCards } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { authenticationClient } from '@/api/authentication-client'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentLoadingIndicator } from '@/components/feedback/content-loading-indicator'
import { restaurantOwnerApi } from '@/modules/restaurant-owner-dashboard/api/restaurant-owner-api'

const managementActions = [
  {
    title: 'Restaurant profile',
    description: 'Keep your customer-facing contact and brand details accurate.',
    href: '/dashboard/profile',
    icon: Settings2,
  },
  {
    title: 'Locations & hours',
    description: 'Configure branches, fulfillment methods, and weekly opening hours.',
    href: '/dashboard/locations',
    icon: MapPin,
  },
  {
    title: 'Menu management',
    description: 'Create categories, products, options, availability, and publish updates.',
    href: '/dashboard/menu',
    icon: Utensils,
  },
] as const

export function RestaurantOwnerOverviewPage() {
  const { data: session } = authenticationClient.useSession()
  const contextQuery = useQuery({ queryKey: ['restaurant-owner-context'], queryFn: restaurantOwnerApi.context })
  const ordersQuery = useQuery({
    queryKey: ['restaurant-owner-order-summary'],
    queryFn: restaurantOwnerApi.orderSummary,
  })
  const firstName = session?.user.name?.trim().split(/\s+/)[0]

  if (contextQuery.isPending) {
    return <ContentLoadingIndicator label="Loading your restaurant dashboard…" />
  }

  if (contextQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Restaurant dashboard unavailable</AlertTitle>
        <AlertDescription className="mt-2">
          We could not load your restaurant information.
          <Button className="mt-4 w-fit" variant="outline" size="sm" onClick={() => contextQuery.refetch()}>
            <RefreshCw /> Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const summary = ordersQuery.data
  const dailyByDate = new Map(summary?.dailyOrders.map(({ day, orders }) => [day, orders]) ?? [])
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - offset))
    return {
      label: new Intl.DateTimeFormat('en-PK', { weekday: 'short' }).format(date),
      orders: dailyByDate.get(date.toLocaleDateString('en-CA')) ?? 0,
    }
  })
  const fulfillment = [
    {
      name: 'Delivery',
      value: summary?.deliveryOrders ?? 0,
      fill: '#F45B45',
    },
    {
      name: 'Pickup',
      value: summary?.pickupOrders ?? 0,
      fill: '#E5A93D',
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="border-b border-border pb-7">
        <Badge className="mb-3" variant="secondary">
          <Clock3 className="size-3.5" aria-hidden="true" /> Restaurant dashboard
        </Badge>
        <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
          {firstName ? `Welcome, ${firstName}` : 'Welcome'}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Manage the information customers rely on. Changes stay private until you deliberately publish them.
        </p>
      </header>
      {contextQuery.data?.membership.restaurantStatus === 'SUSPENDED' ? (
        <Alert>
          <AlertTitle>Restaurant access is read-only</AlertTitle>
          <AlertDescription>
            Rentlify has suspended this restaurant. You can review its information, but changes are unavailable until
            access is restored.
          </AlertDescription>
        </Alert>
      ) : null}
      {ordersQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Order activity unavailable</AlertTitle>
          <AlertDescription className="mt-2">
            The restaurant details loaded, but order metrics could not be refreshed.
            <Button className="mt-4 w-fit" variant="outline" size="sm" onClick={() => ordersQuery.refetch()}>
              <RefreshCw />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section aria-label="Restaurant activity" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Waiting or in preparation"
          icon={ShoppingBag}
          label="Active orders"
          value={String(summary?.activeOrders ?? 0)}
        />
        <MetricCard
          detail="All received orders"
          icon={Clock3}
          label="Total orders"
          value={String(summary?.totalOrders ?? 0)}
        />
        <MetricCard
          detail="Completed cash orders"
          icon={WalletCards}
          label="Completed value"
          value={formatPkr(summary?.completedValue ?? 0)}
        />
        <MetricCard
          detail="Configured by Rentlify"
          icon={MapPin}
          label="Locations"
          value={String(contextQuery.data?.details.locations.length ?? 0)}
        />
      </section>

      <section
        className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]"
        aria-label="Order charts"
      >
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Orders in the last 7 days</CardTitle>
            <p className="text-sm text-muted-foreground">Real orders received across your locations.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64" aria-label="Seven-day order volume bar chart" role="img">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days} margin={{ left: -28, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="orders" fill="var(--primary)" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Fulfillment mix</CardTitle>
            <p className="text-sm text-muted-foreground">Delivery and pickup order split.</p>
          </CardHeader>
          <CardContent>
            <div className="h-48" aria-label="Fulfillment method pie chart" role="img">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fulfillment} dataKey="value" innerRadius={48} outerRadius={76} paddingAngle={4} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fulfillment.map((item) => (
                <div className="rounded-lg bg-muted/50 p-3" key={item.name}>
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <p className="mt-1 text-xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="management-actions-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold" id="management-actions-heading">
              Manage your restaurant
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Choose an area to continue.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {managementActions.map(({ title, description, href, icon: Icon }) => (
            <Card className="group shadow-none transition-colors hover:border-primary/30" key={href}>
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-xl border border-border bg-muted/50 text-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="mt-3 text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
                <Button className="mt-5 w-full justify-between" variant="outline" asChild>
                  <Link to={href}>
                    Open {title.toLowerCase()} <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string
  icon: typeof ShoppingBag
  label: string
  value: string
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-muted">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

const formatPkr = (value: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(value / 100)
