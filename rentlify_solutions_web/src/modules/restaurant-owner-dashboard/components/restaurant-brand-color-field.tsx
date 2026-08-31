import type { UseFormRegisterReturn } from 'react-hook-form'
import type { FormEvent } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const validHexColorPattern = /^#[0-9A-Fa-f]{6}$/

export function RestaurantBrandColorField({
  id,
  label,
  value,
  error,
  registration,
  onColorSelection,
}: {
  id: string
  label: string
  value: string
  error?: string
  registration: UseFormRegisterReturn
  onColorSelection: (value: string) => void
}) {
  const pickerValue = validHexColorPattern.test(value) ? value : '#000000'
  const handleColorInput = (event: FormEvent<HTMLInputElement>) => {
    onColorSelection(event.currentTarget.value.toUpperCase())
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <div className="flex items-center gap-2">
        <Input
          className="h-11 min-w-0 font-mono uppercase"
          id={id}
          inputMode="text"
          maxLength={7}
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          {...registration}
        />
        <Input
          className="size-11 shrink-0 cursor-pointer overflow-hidden p-1"
          type="color"
          value={pickerValue}
          aria-label={`Choose ${label.toLowerCase()}`}
          onInput={handleColorInput}
          onChange={(event) => onColorSelection(event.currentTarget.value.toUpperCase())}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" id={`${id}-error`}>
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground" id={`${id}-hint`}>
          Enter a six-digit hex value or use the color picker.
        </p>
      )}
    </div>
  )
}
