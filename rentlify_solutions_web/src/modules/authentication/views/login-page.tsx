import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { authenticationClient } from '@/api/authentication-client'
import { BrandMark } from '@/components/brand-mark'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthenticationLoadingScreen } from '@/modules/authentication/components/authentication-loading-screen'
import { dashboardPathForRole } from '@/modules/authentication/roles'
import { loginSchema, type LoginValues } from '@/modules/authentication/validation/login-schema'

type LoginLocationState = { from?: string }

/** Only same-site paths are accepted, so a crafted history entry cannot redirect off-site. */
const safeRedirectPath = (candidate: string | undefined, role: unknown) => {
  const roleDashboard = dashboardPathForRole(role) ?? '/'
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return roleDashboard
  }
  if (roleDashboard === '/dashboard' && (candidate === '/dashboard' || candidate.startsWith('/dashboard/'))) {
    return candidate
  }
  return roleDashboard
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [authenticationError, setAuthenticationError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session, isPending: isCheckingSession, refetch } = authenticationClient.useSession()
  const searchParameters = new URLSearchParams(location.search)
  const sessionExpired = searchParameters.get('reason') === 'session-expired'
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (!sessionExpired) return
    toast.info('Please sign in again', { description: 'Your session expired to protect your account.' })
  }, [sessionExpired])

  if (isCheckingSession) {
    return <AuthenticationLoadingScreen />
  }

  if (session) {
    return <Navigate replace to={dashboardPathForRole(session.user.role) ?? '/'} />
  }

  const submitLogin = async (values: LoginValues) => {
    setAuthenticationError(null)

    try {
      const result = await authenticationClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: false,
      })

      if (result.error) {
        // Deliberately generic: the response must not reveal whether the email exists.
        setAuthenticationError('The email or password is incorrect. Please check your details and try again.')
        toast.error('Sign in failed', { description: 'Check your details and try again.' })
        setFocus('password')
        return
      }

      // The session cache must hold the new session before navigating, otherwise the
      // protected route reads a stale empty session and bounces straight back here.
      await refetch()
      toast.success('Welcome back', { description: 'You signed in successfully.' })
      const stateRedirect = (location.state as LoginLocationState | null)?.from
      const queryRedirect = searchParameters.get('from') ?? undefined
      navigate(safeRedirectPath(stateRedirect ?? queryRedirect, result.data.user.role), { replace: true })
    } catch {
      setAuthenticationError('Sign in is temporarily unavailable. Please try again.')
      toast.error('Unable to sign in', { description: 'Please check your connection and try again.' })
    }
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50" to="/">
            <BrandMark />
            <span className="sr-only">Rentlify Solutions home</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft data-icon="inline-start" /> Back to home
            </Link>
          </Button>
        </header>

        <div className="flex flex-1 items-center py-10 sm:py-14">
          <Card className="w-full border-border bg-white shadow-sm ring-0">
            <CardContent className="p-6 sm:p-8">
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Sign in</h1>
              <p className="mt-3 text-muted-foreground">Use the account provided for your workspace.</p>

              <form className="mt-8 grid gap-5" noValidate onSubmit={handleSubmit(submitLogin)}>
                {authenticationError ? (
                  <Alert variant="destructive" role="alert">
                    <AlertTitle>Unable to sign in</AlertTitle>
                    <AlertDescription>{authenticationError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    className="h-11"
                    id="email"
                    type="email"
                    autoComplete="username"
                    autoFocus
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    placeholder="you@restaurant.com"
                    {...register('email')}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Enter the email address assigned to your Rentlify administrator or restaurant-owner account.
                  </p>
                  {errors.email ? (
                    <p className="text-sm text-destructive" id="email-error">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      className="h-11 pr-12"
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      {...register('password')}
                    />
                    <Button
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Enter your current account password. Passwords are case-sensitive.
                  </p>
                  {errors.password ? (
                    <p className="text-sm text-destructive" id="password-error">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>

                <Button className="mt-2 h-11 w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="animate-spin" /> Signing in
                    </>
                  ) : (
                    <>
                      Sign in <ArrowRight data-icon="inline-end" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-8 border-t border-border pt-6 text-sm leading-6 text-muted-foreground">
                Accounts are created by Rentlify Solutions. If you need access, contact your platform administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
