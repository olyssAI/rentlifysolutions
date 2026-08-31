import { Settings, ShieldUser } from 'lucide-react'
import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ApplicationErrorBoundary } from '@/components/feedback/application-error-boundary'
import { LazyRouteLoadingIndicator } from '@/components/feedback/lazy-route-loading-indicator'
import { PageLoader } from '@/components/feedback/page-loader'
import { PermissionRoute } from '@/modules/authorization/components/permission-route'
import { permissionKeys, roleHasPermission } from '@/modules/authorization/permission-catalog'
import { authenticationClient } from '@/api/authentication-client'
import { ProtectedRoute } from '@/modules/authentication/components/protected-route'
import { isRestaurantOwner, roles } from '@/modules/authentication/roles'

const LandingPage = lazy(() =>
  import('@/modules/landing/views/landing-page').then((module) => ({ default: module.LandingPage })),
)
const LoginPage = lazy(() =>
  import('@/modules/authentication/views/login-page').then((module) => ({ default: module.LoginPage })),
)
const DashboardLayout = lazy(() =>
  import('@/modules/dashboard/layouts/dashboard-layout').then((module) => ({ default: module.DashboardLayout })),
)
const DashboardOverviewPage = lazy(() =>
  import('@/modules/dashboard/views/dashboard-overview-page').then((module) => ({
    default: module.DashboardOverviewPage,
  })),
)
const DashboardPlaceholderPage = lazy(() =>
  import('@/modules/dashboard/views/dashboard-placeholder-page').then((module) => ({
    default: module.DashboardPlaceholderPage,
  })),
)
const RestaurantsPage = lazy(() =>
  import('@/modules/restaurants/views/restaurants-page').then((module) => ({ default: module.RestaurantsPage })),
)
const RestaurantDetailsPage = lazy(() =>
  import('@/modules/restaurants/views/restaurant-details-page').then((module) => ({
    default: module.RestaurantDetailsPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/modules/not-found/views/not-found-page').then((module) => ({ default: module.NotFoundPage })),
)
const RestaurantOwnerOverviewPage = lazy(() =>
  import('@/modules/restaurant-owner-dashboard/views/restaurant-owner-overview-page').then((module) => ({
    default: module.RestaurantOwnerOverviewPage,
  })),
)
const RestaurantOwnerProfilePage = lazy(() =>
  import('@/modules/restaurant-owner-dashboard/views/restaurant-owner-profile-page').then((module) => ({
    default: module.RestaurantOwnerProfilePage,
  })),
)
const RestaurantOwnerLocationsPage = lazy(() =>
  import('@/modules/restaurant-owner-dashboard/views/restaurant-owner-locations-page').then((module) => ({
    default: module.RestaurantOwnerLocationsPage,
  })),
)
const RestaurantOwnerMenuPage = lazy(() =>
  import('@/modules/restaurant-owner-dashboard/views/restaurant-owner-menu-page').then((module) => ({
    default: module.RestaurantOwnerMenuPage,
  })),
)
const RestaurantOwnerSettingsPage = lazy(() =>
  import('@/modules/restaurant-owner-dashboard/views/restaurant-owner-settings-page').then((module) => ({
    default: module.RestaurantOwnerSettingsPage,
  })),
)
const RestaurantOwnerOrdersPage = lazy(() =>
  import('@/modules/restaurant-owner-dashboard/views/restaurant-owner-orders-page').then((module) => ({
    default: module.RestaurantOwnerOrdersPage,
  })),
)

const page = (content: ReactNode, dashboard = true) => (
  <Suspense fallback={dashboard ? <LazyRouteLoadingIndicator /> : <PageLoader />}>{content}</Suspense>
)

function RoleAwareDashboardOverview() {
  const { data: session } = authenticationClient.useSession()
  return isRestaurantOwner(session?.user.role) ? page(<RestaurantOwnerOverviewPage />) : page(<DashboardOverviewPage />)
}

function RoleAwareDashboardSettings() {
  const { data: session } = authenticationClient.useSession()
  const permission = isRestaurantOwner(session?.user.role)
    ? permissionKeys.restaurantAccountManage
    : permissionKeys.platformSettingsManage
  if (!roleHasPermission(session?.user.role, permission)) return <Navigate replace to="/dashboard" />
  return isRestaurantOwner(session?.user.role)
    ? page(<RestaurantOwnerSettingsPage />)
    : page(
        <DashboardPlaceholderPage
          title="Settings"
          description="Manage platform-wide preferences and security configuration."
          icon={Settings}
        />,
      )
}

function App() {
  return (
    <BrowserRouter>
      <ApplicationErrorBoundary>
        <Routes>
          <Route element={page(<LandingPage />, false)} path="/" />
          <Route element={page(<LoginPage />, false)} path="/login" />
          <Route element={<ProtectedRoute allowedRoles={[roles.superAdministrator, roles.restaurantOwner]} />}>
            <Route element={page(<DashboardLayout />, false)} path="/dashboard">
              <Route index element={<RoleAwareDashboardOverview />} />
              <Route element={<PermissionRoute permission={permissionKeys.platformRestaurantsManage} />}>
                <Route path="restaurants" element={page(<RestaurantsPage />)} />
                <Route path="restaurants/:restaurantId" element={page(<RestaurantDetailsPage />)} />
              </Route>
              <Route element={<PermissionRoute permission={permissionKeys.platformSettingsManage} />}>
                <Route
                  path="administrators"
                  element={page(
                    <DashboardPlaceholderPage
                      title="Administrators"
                      description="Control who can access the Rentlify administration workspace."
                      icon={ShieldUser}
                    />,
                  )}
                />
              </Route>
              <Route element={<PermissionRoute permission={permissionKeys.restaurantProfileManage} />}>
                <Route path="profile" element={page(<RestaurantOwnerProfilePage />)} />
              </Route>
              <Route element={<PermissionRoute permission={permissionKeys.restaurantLocationsManage} />}>
                <Route path="locations" element={page(<RestaurantOwnerLocationsPage />)} />
              </Route>
              <Route element={<PermissionRoute permission={permissionKeys.restaurantMenuManage} />}>
                <Route path="menu" element={page(<RestaurantOwnerMenuPage />)} />
              </Route>
              <Route element={<PermissionRoute permission={permissionKeys.restaurantDashboardRead} />}>
                <Route path="orders" element={page(<RestaurantOwnerOrdersPage />)} />
              </Route>
              <Route path="settings" element={<RoleAwareDashboardSettings />} />
            </Route>
          </Route>
          <Route element={<Navigate replace to="/dashboard" />} path="/restaurant/*" />
          <Route element={page(<NotFoundPage />, false)} path="*" />
        </Routes>
      </ApplicationErrorBoundary>
    </BrowserRouter>
  )
}

export default App
