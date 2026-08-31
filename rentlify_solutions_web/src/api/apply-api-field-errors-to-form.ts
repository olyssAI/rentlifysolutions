import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { ApiError } from '@/api/api-client'

export function applyApiFieldErrorsToForm<FormValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<FormValues>,
  serverPathToFormPath: Readonly<Record<string, Path<FormValues>>>,
) {
  if (!(error instanceof ApiError)) return false

  let appliedFieldError = false
  for (const fieldError of error.fields) {
    const formPath =
      serverPathToFormPath[fieldError.path] ??
      Object.entries(serverPathToFormPath).find(
        ([serverPath]) => serverPath.endsWith('.*') && fieldError.path.startsWith(serverPath.slice(0, -1)),
      )?.[1]
    if (!formPath) continue
    setError(formPath, { type: 'server', message: fieldError.message })
    appliedFieldError = true
  }
  return appliedFieldError
}

export async function submitApiFormWithFieldErrors<FormValues extends FieldValues>(
  values: FormValues,
  submit: (values: FormValues) => Promise<void>,
  setError: UseFormSetError<FormValues>,
  serverPathToFormPath: Readonly<Record<string, Path<FormValues>>>,
) {
  try {
    await submit(values)
  } catch (error) {
    applyApiFieldErrorsToForm(error, setError, serverPathToFormPath)
  }
}
