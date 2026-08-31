import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { AuthenticationLoadingScreen } from './authentication-loading-screen'
import { authenticationClient } from '@/api/authentication-client'
import { dashboardPathForRole, type Role } from '@/modules/authentication/roles'

type ProtectedRouteProps = {
  allowedRoles: readonly Role[]
}

/**
 * Gates the dashboard on a session the server issued. This is a navigation convenience,
 * not a security boundary: every protected API call is authorised again on the server.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const { data: session, isPending } = authenticationClient.useSession()

  if (isPending) {
    return <AuthenticationLoadingScreen />
  }

  if (!session) {
    return <Navigate replace state={{ from: location.pathname + location.search }} to="/login" />
  }

  if (!allowedRoles.some((role) => role === session.user.role)) {
    return <Navigate replace to={dashboardPathForRole(session.user.role) ?? '/'} />
  }

  return <Outlet />
}
