import { Navigate, Outlet } from 'react-router-dom'

import { authenticationClient } from '@/api/authentication-client'
import { roleHasPermission, type PermissionKey } from '@/modules/authorization/permission-catalog'

export function PermissionRoute({ permission }: { permission: PermissionKey }) {
  const { data: session } = authenticationClient.useSession()

  if (!session || !roleHasPermission(session.user.role, permission)) {
    return <Navigate replace to="/dashboard" />
  }

  return <Outlet />
}
