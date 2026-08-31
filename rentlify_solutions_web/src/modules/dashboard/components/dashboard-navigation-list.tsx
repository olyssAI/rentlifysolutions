import { NavLink } from 'react-router-dom'

import { dashboardNavigation, type DashboardNavigationItem } from '@/modules/dashboard/constants/dashboard-navigation'
import { cn } from '@/lib/utils'

type DashboardNavigationListProps = {
  navigation?: readonly DashboardNavigationItem[]
  onNavigate?: () => void
}

export function DashboardNavigationList({
  navigation = dashboardNavigation,
  onNavigate,
}: DashboardNavigationListProps) {
  return (
    <nav aria-label="Dashboard navigation">
      <ul className="grid gap-1">
        {navigation.map(({ label, href, icon: Icon, end }) => (
          <li key={href}>
            <NavLink
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-[background-color,border-color,color,box-shadow] outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive
                    ? 'border-primary bg-primary font-semibold text-primary-foreground shadow-sm'
                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-white hover:text-foreground hover:shadow-xs',
                )
              }
              end={end}
              onClick={onNavigate}
              to={href}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-lg border transition-colors',
                      isActive
                        ? 'border-white bg-white/15 text-primary-foreground'
                        : 'border-transparent bg-muted text-muted-foreground',
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
