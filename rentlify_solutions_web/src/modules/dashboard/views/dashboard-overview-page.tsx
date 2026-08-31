import { useQuery } from '@tanstack/react-query'
import { Building2, MapPin, PackageCheck, RefreshCw, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { authenticationClient } from '@/api/authentication-client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentLoadingIndicator } from '@/components/feedback/content-loading-indicator'
import { restaurantApi } from '@/modules/restaurants/api/restaurant-api'

const statusColor: Record<string, string> = { ACTIVE: '#258457', DRAFT: '#E5A93D', SUSPENDED: '#D34A3A' }
const labelStatus = (status: string) => status.charAt(0) + status.slice(1).toLowerCase()

export function DashboardOverviewPage() {
  const { data: session } = authenticationClient.useSession()
  const restaurantsQuery = useQuery({ queryKey: ['restaurants'], queryFn: restaurantApi.list })
  const firstName = session?.user.name?.trim().split(/\s+/)[0]

  if (restaurantsQuery.isPending) return <ContentLoadingIndicator label="Loading platform activity…" />
  if (restaurantsQuery.isError)
    return (
      <Alert variant="destructive">
        <AlertTitle>Dashboard unavailable</AlertTitle>
        <AlertDescription className="mt-2">
          {restaurantsQuery.error.message}
          <Button className="mt-4 w-fit" onClick={() => restaurantsQuery.refetch()} size="sm" variant="outline">
            <RefreshCw />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )

  const restaurants = restaurantsQuery.data ?? []
  const active = restaurants.filter(({ status }) => status === 'ACTIVE').length
  const locations = restaurants.reduce((sum, restaurant) => sum + restaurant.locationCount, 0)
  const statusData = ['ACTIVE', 'DRAFT', 'SUSPENDED'].map((status) => ({
    name: labelStatus(status),
    value: restaurants.filter((restaurant) => restaurant.status === status).length,
    color: statusColor[status],
  }))
  const packageNames = [...new Set(restaurants.map(({ packageName }) => packageName))]
  const packageData = packageNames.map((name) => ({
    name,
    restaurants: restaurants.filter(({ packageName }) => packageName === name).length,
  }))
  const recent = [...restaurants]
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .slice(0, 6)

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary">Live platform data</Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            {firstName ? `Welcome back, ${firstName}` : 'Platform overview'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Restaurant portfolio and onboarding health from the current database.
          </p>
        </div>
        <Button onClick={() => restaurantsQuery.refetch()} variant="outline">
          <RefreshCw />
          Refresh
        </Button>
      </header>
      <section aria-label="Platform summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Building2} label="Restaurants" value={restaurants.length} detail="All managed accounts" />
        <Metric icon={PackageCheck} label="Active" value={active} detail="Customer-ready restaurants" />
        <Metric icon={MapPin} label="Locations" value={locations} detail="Across every restaurant" />
        <Metric
          icon={Store}
          label="Draft or suspended"
          value={restaurants.length - active}
          detail="Needs onboarding or review"
        />
      </section>
      <section
        aria-label="Platform charts"
        className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]"
      >
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Restaurants by package</CardTitle>
            <p className="text-sm text-muted-foreground">Current subscription catalogue distribution.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64" role="img" aria-label="Restaurants grouped by package">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packageData} margin={{ left: -28, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="restaurants" fill="var(--primary)" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Account status</CardTitle>
            <p className="text-sm text-muted-foreground">Operational state of restaurant accounts.</p>
          </CardHeader>
          <CardContent>
            <div className="h-48" role="img" aria-label="Restaurant account status pie chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" innerRadius={48} outerRadius={76} paddingAngle={4}>
                    {statusData.map((entry) => (
                      <Cell fill={entry.color} key={entry.name} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {statusData.map((entry) => (
                <div className="rounded-lg bg-muted/50 p-2 text-center" key={entry.name}>
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                  <p className="mt-1 text-lg font-semibold">{entry.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
      <Card className="shadow-none">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recently updated restaurants</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Latest changes across the platform.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard/restaurants">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {recent.map((restaurant) => (
                <Link
                  className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/30"
                  key={restaurant.id}
                  to={`/dashboard/restaurants/${restaurant.id}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{restaurant.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {restaurant.packageName} · {restaurant.locationCount}{' '}
                      {restaurant.locationCount === 1 ? 'location' : 'locations'}
                    </p>
                  </div>
                  <Badge variant="outline">{labelStatus(restaurant.status)}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Create the first restaurant to populate this dashboard.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string
  icon: typeof Building2
  label: string
  value: number
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
