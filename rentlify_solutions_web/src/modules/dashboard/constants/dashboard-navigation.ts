import {
  Building2,
  Clock3,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldUser,
  Store,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

import { permissionKeys, type PermissionKey } from '@/modules/authorization/permission-catalog'

export type DashboardNavigationItem = {
  label: string
  href: string
  icon: LucideIcon
  permission: PermissionKey
  end?: boolean
}

export const dashboardNavigation: readonly DashboardNavigationItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: permissionKeys.platformDashboardRead,
    end: true,
  },
  {
    label: 'Restaurants',
    href: '/dashboard/restaurants',
    icon: Building2,
    permission: permissionKeys.platformRestaurantsManage,
  },
  {
    label: 'Administrators',
    href: '/dashboard/administrators',
    icon: ShieldUser,
    permission: permissionKeys.platformSettingsManage,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    permission: permissionKeys.platformSettingsManage,
  },
]

export const restaurantOwnerNavigation: readonly DashboardNavigationItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: permissionKeys.restaurantDashboardRead,
    end: true,
  },
  {
    label: 'Restaurant profile',
    href: '/dashboard/profile',
    icon: Store,
    permission: permissionKeys.restaurantProfileManage,
  },
  {
    label: 'Locations & hours',
    href: '/dashboard/locations',
    icon: Clock3,
    permission: permissionKeys.restaurantLocationsManage,
  },
  {
    label: 'Menu',
    href: '/dashboard/menu',
    icon: Utensils,
    permission: permissionKeys.restaurantMenuManage,
  },
  {
    label: 'Orders',
    href: '/dashboard/orders',
    icon: ListChecks,
    permission: permissionKeys.restaurantDashboardRead,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    permission: permissionKeys.restaurantAccountManage,
  },
]
