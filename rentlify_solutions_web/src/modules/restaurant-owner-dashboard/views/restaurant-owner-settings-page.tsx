import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { authenticationClient } from '@/api/authentication-client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from '@/modules/restaurant-owner-dashboard/validation/change-password-form-schema'

const passwordFields = [
  {
    name: 'currentPassword',
    label: 'Current password',
    autoComplete: 'current-password',
    description: 'Enter the password you currently use to sign in, including the one issued by your administrator.',
  },
  {
    name: 'newPassword',
    label: 'New password',
    autoComplete: 'new-password',
    description: 'Use 12–128 characters with uppercase, lowercase, number, and special characters.',
  },
  {
    name: 'confirmPassword',
    label: 'Confirm new password',
    autoComplete: 'new-password',
    description: 'Enter the new password again exactly to prevent accidental changes.',
  },
] as const

export function RestaurantOwnerSettingsPage() {
  const [visibleFields, setVisibleFields] = useState<Set<string>>(() => new Set())
  const [serverError, setServerError] = useState<string | null>(null)
  const { data: session, refetch: refetchSession } = authenticationClient.useSession()
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const submit = async (values: ChangePasswordFormValues) => {
    setServerError(null)
    try {
      const result = await authenticationClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      })
      if (result.error) {
        setServerError('Your password could not be changed. Check your current password and try again.')
        toast.error('Password was not changed', { description: 'Check your current password and try again.' })
        return
      }
      form.reset()
      await refetchSession()
      toast.success('Password changed', { description: 'Other signed-in devices have been signed out.' })
    } catch {
      setServerError('Password changes are temporarily unavailable. Please try again.')
      toast.error('Password was not changed', { description: 'Please try again.' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header className="border-b border-border pb-7">
        <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Account settings</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Manage the password used to access your Rentlify dashboard.
        </p>
      </header>

      {session?.user.passwordChangeRecommended ? (
        <Alert>
          <ShieldCheck aria-hidden="true" />
          <AlertTitle>Change the password provided by your administrator</AlertTitle>
          <AlertDescription>
            Your initial sign-in password was created by a Rentlify administrator. Change it to a private password that
            only you know. This is strongly recommended, but it does not block access to your restaurant.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="shadow-none">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-base">Change password</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Use a unique password you do not use elsewhere.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="grid gap-5" noValidate onSubmit={form.handleSubmit(submit)}>
            {serverError ? (
              <Alert variant="destructive" role="alert">
                <AlertTitle>Password was not changed</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}
            {passwordFields.map(({ name, label, autoComplete, description }) => {
              const visible = visibleFields.has(name)
              const error = form.formState.errors[name]?.message
              return (
                <div className="grid gap-2" key={name}>
                  <Label htmlFor={name}>
                    {label} <span aria-hidden="true">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      className="h-11 pr-12"
                      id={name}
                      type={visible ? 'text' : 'password'}
                      autoComplete={autoComplete}
                      aria-invalid={Boolean(error)}
                      aria-describedby={`${name}-help${error ? ` ${name}-error` : ''}`}
                      {...form.register(name)}
                    />
                    <Button
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
                      onClick={() =>
                        setVisibleFields((current) => {
                          const next = new Set(current)
                          if (next.has(name)) next.delete(name)
                          else next.add(name)
                          return next
                        })
                      }
                    >
                      {visible ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground" id={`${name}-help`}>
                    {description}
                  </p>
                  {error ? (
                    <p className="text-sm text-destructive" id={`${name}-error`}>
                      {error}
                    </p>
                  ) : null}
                </div>
              )
            })}
            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" aria-hidden="true" /> Other sessions will be signed out.
              </p>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
                {form.formState.isSubmitting ? 'Changing password' : 'Change password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
