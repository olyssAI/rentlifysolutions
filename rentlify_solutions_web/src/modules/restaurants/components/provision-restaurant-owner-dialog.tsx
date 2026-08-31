import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Eye, EyeOff, KeyRound, LoaderCircle, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { applyApiFieldErrorsToForm } from '@/api/apply-api-field-errors-to-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  restaurantOwnerProvisioningFormSchema,
  type RestaurantOwnerProvisioningFormValues,
} from '@/modules/restaurants/validation/restaurant-owner-provisioning-form-schema'

interface ProvisionRestaurantOwnerDialogProps {
  isOpen: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RestaurantOwnerProvisioningFormValues) => Promise<void>
}

const passwordAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*_-+'

function createStrongInitialPassword() {
  const requiredCharacters = ['A', 'a', '7', '!']
  const randomValues = new Uint32Array(16)
  window.crypto.getRandomValues(randomValues)
  const randomCharacters = Array.from(randomValues, (value) => passwordAlphabet[value % passwordAlphabet.length])
  const characters = [...requiredCharacters, ...randomCharacters]
  const shuffleValues = new Uint32Array(characters.length)
  window.crypto.getRandomValues(shuffleValues)
  return characters
    .map((character, index) => ({ character, order: shuffleValues[index] ?? index }))
    .sort((first, second) => first.order - second.order)
    .map(({ character }) => character)
    .join('')
}

export function ProvisionRestaurantOwnerDialog({
  isOpen,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: ProvisionRestaurantOwnerDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RestaurantOwnerProvisioningFormValues>({
    resolver: zodResolver(restaurantOwnerProvisioningFormSchema),
    defaultValues: { name: '', email: '', initialPassword: '' },
  })

  const submit = async (values: RestaurantOwnerProvisioningFormValues) => {
    try {
      await onSubmit(values)
    } catch (error) {
      applyApiFieldErrorsToForm(error, setError, {
        name: 'name',
        email: 'email',
        password: 'initialPassword',
      })
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (isSubmitting) return
    if (!open) {
      reset()
      setShowPassword(false)
    }
    onOpenChange(open)
  }

  const copyPassword = async () => {
    const password = getValues('initialPassword')
    if (!password) {
      toast.error('Generate or enter a password first')
      return
    }
    try {
      await navigator.clipboard.writeText(password)
      toast.success('Initial password copied')
    } catch {
      toast.error('Password could not be copied')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>
          <UserPlus data-icon="inline-start" /> Add restaurant owner
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Create restaurant owner access</DialogTitle>
          <DialogDescription>
            Create the login this owner will use for their restaurant dashboard. Share the initial password through a
            secure channel.
          </DialogDescription>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-destructive" aria-hidden="true">
              *
            </span>{' '}
            Required fields
          </p>
        </DialogHeader>

        <form className="grid gap-5" id="provision-restaurant-owner-form" noValidate onSubmit={handleSubmit(submit)}>
          <fieldset className="grid gap-4" disabled={isSubmitting}>
            <OwnerFormField error={errors.name?.message} htmlFor="restaurant-owner-name" label="Owner name">
              <Input
                id="restaurant-owner-name"
                autoComplete="name"
                aria-describedby={errors.name ? 'restaurant-owner-name-error' : undefined}
                aria-invalid={Boolean(errors.name)}
                required
                {...register('name')}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Enter the account holder's real name so their access is easy to identify and audit.
              </p>
            </OwnerFormField>

            <OwnerFormField error={errors.email?.message} htmlFor="restaurant-owner-email" label="Login email">
              <Input
                id="restaurant-owner-email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby={errors.email ? 'restaurant-owner-email-error' : 'restaurant-owner-email-help'}
                aria-invalid={Boolean(errors.email)}
                required
                {...register('email')}
              />
              <p className="text-xs text-muted-foreground" id="restaurant-owner-email-help">
                This becomes the owner’s login. It must not already belong to another account.
              </p>
            </OwnerFormField>

            <OwnerFormField
              error={errors.initialPassword?.message}
              htmlFor="restaurant-owner-initial-password"
              label="Initial password"
            >
              <div className="relative">
                <Input
                  className="pr-11"
                  id="restaurant-owner-initial-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-describedby={
                    errors.initialPassword
                      ? 'restaurant-owner-initial-password-error'
                      : 'restaurant-owner-initial-password-help'
                  }
                  aria-invalid={Boolean(errors.initialPassword)}
                  required
                  {...register('initialPassword')}
                />
                <Button
                  className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              </div>
              <p className="text-xs leading-5 text-muted-foreground" id="restaurant-owner-initial-password-help">
                Use 12–128 characters with uppercase, lowercase, number, and special characters. Changing it later is
                optional.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setValue('initialPassword', createStrongInitialPassword(), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    setShowPassword(true)
                  }}
                >
                  <KeyRound data-icon="inline-start" /> Generate password
                </Button>
                <Button type="button" variant="outline" onClick={copyPassword}>
                  <Copy data-icon="inline-start" /> Copy password
                </Button>
              </div>
            </OwnerFormField>
          </fieldset>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="provision-restaurant-owner-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <UserPlus data-icon="inline-start" />
            )}
            {isSubmitting ? 'Creating owner access' : 'Create owner access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OwnerFormField({
  children,
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode
  error?: string
  htmlFor: string
  label: string
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
