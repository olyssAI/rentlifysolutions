import { LoaderCircle, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { authenticationClient } from '@/api/authentication-client'
import { BrandMark } from '@/components/brand-mark'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DashboardNavigationList } from '@/modules/dashboard/components/dashboard-navigation-list'
import { dashboardNavigation, restaurantOwnerNavigation } from '@/modules/dashboard/constants/dashboard-navigation'
import { permissionsForRole } from '@/modules/authorization/permission-catalog'
import { isRestaurantOwner } from '@/modules/authentication/roles'

const getInitials = (name: string | undefined) => {
  const initials = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'R'
}

export function DashboardLayout() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session } = authenticationClient.useSession()
  const variant = isRestaurantOwner(session?.user.role) ? 'restaurant' : 'platform'
  const grantedPermissions = permissionsForRole(session?.user.role)
  const navigation = (variant === 'restaurant' ? restaurantOwnerNavigation : dashboardNavigation).filter(
    ({ permission }) => grantedPermissions.some((grantedPermission) => grantedPermission === permission),
  )

  const currentPage =
    navigation.find(({ href, end }) => (end ? location.pathname === href : location.pathname.startsWith(href)))
      ?.label ?? (variant === 'restaurant' ? 'Restaurant' : 'Platform')

  const signOut = async () => {
    setIsSigningOut(true)

    try {
      const result = await authenticationClient.signOut()

      if (result.error) {
        toast.error('Sign out failed', { description: 'Your session is still active. Please try again.' })
        setIsSigningOut(false)
        return
      }

      toast.success("You're signed out")
      navigate('/login', { replace: true })
    } catch {
      toast.error('Sign out failed', { description: 'Your session is still active. Please try again.' })
      setIsSigningOut(false)
    }
  }

  const sidebar = (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-border bg-white px-5">
        <BrandMark />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <DashboardNavigationList navigation={navigation} onNavigate={() => setMobileNavigationOpen(false)} />
      </div>

      <div className="shrink-0 border-t border-border bg-white p-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-3 shadow-xs">
          <Avatar className="size-9 border border-border bg-white">
            <AvatarFallback className="bg-white text-xs font-semibold">
              {getInitials(session?.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{session?.user.name ?? 'Account'}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.user.email}</p>
          </div>
        </div>
        <Button
          className="mt-3 flex w-full justify-center bg-white"
          variant="outline"
          size="sm"
          disabled={isSigningOut}
          onClick={signOut}
        >
          <LogOut data-icon="inline-start" /> {isSigningOut ? 'Signing out' : 'Sign out'}
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-white">
      {isSigningOut ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-white/95 px-5 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Signing out"
        >
          <div className="flex flex-col items-center text-center">
            <span className="grid size-12 place-items-center rounded-full border border-border bg-white shadow-sm">
              <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-medium">Signing you out</p>
            <p className="mt-1 text-sm text-muted-foreground">Please wait a moment…</p>
          </div>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-white lg:flex">
        {sidebar}
      </aside>

      <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
        <SheetContent
          className="flex w-[min(17rem,85vw)] flex-col gap-0 p-0 duration-300 ease-out data-closed:duration-200 data-closed:ease-in"
          side="left"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Dashboard navigation</SheetTitle>
            <SheetDescription>Navigate your Rentlify dashboard.</SheetDescription>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-white">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button
              className="lg:hidden"
              size="icon"
              variant="outline"
              aria-label="Open navigation"
              onClick={() => setMobileNavigationOpen(true)}
            >
              <Menu />
            </Button>
            <div>
              <h1 className="text-base font-semibold leading-none">{currentPage}</h1>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                {variant === 'restaurant' ? 'Restaurant management' : 'Platform administration'}
              </p>
            </div>
            <div className="ml-auto">
              <Avatar className="size-8">
                <AvatarFallback className="bg-foreground text-xs font-medium text-background">
                  {getInitials(session?.user.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
