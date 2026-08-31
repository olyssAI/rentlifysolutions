import { allergens, dietaryLabels } from '@rentlify/authorization-contracts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, ImagePlus, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'

import { submitApiFormWithFieldErrors } from '@/api/apply-api-field-errors-to-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { MenuAdministrationApi, MenuCategory, MenuItem } from '@/modules/menu/api/menu-administration-api'
import {
  duplicateMenuItemFormSchema,
  locationAvailabilityFormSchema,
  menuCategoryFormSchema,
  menuItemFormSchema,
  type DuplicateMenuItemFormValues,
  type LocationAvailabilityFormValues,
  type MenuCategoryFormValues,
  type MenuItemFormValues,
} from '@/modules/menu/validation/menu-administration-form-schemas'
import type { RestaurantLocation } from '@/modules/restaurants/api/restaurant-api'

export function CategoryDialog({
  menuAdministrationApi,
  value,
  submitting,
  onClose,
  onSubmit,
}: {
  menuAdministrationApi: MenuAdministrationApi
  value: MenuCategory | null | 'new'
  submitting: boolean
  onClose: () => void
  onSubmit: (values: MenuCategoryFormValues) => Promise<void>
}) {
  const category = value === 'new' || value === null ? null : value
  const [uploadingImage, setUploadingImage] = useState(false)
  const form = useForm<MenuCategoryFormValues>({
    resolver: zodResolver(menuCategoryFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    values: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true,
      imageUrl: category?.imageUrl ?? null,
      imagePublicId: category?.imagePublicId ?? null,
    },
  })
  const imageUrl = useWatch({ control: form.control, name: 'imageUrl' })
  const uploadImage = async (file: File) => {
    setUploadingImage(true)
    try {
      const signature = await menuAdministrationApi.createUploadSignature()
      await validateMenuImageBeforeUpload(file, signature.allowedFormats, signature.maximumBytes)
      const uploadedImage = await menuAdministrationApi.uploadImage(file, signature)
      validateUploadedMenuImage(uploadedImage, signature.allowedFormats)
      form.setValue('imageUrl', uploadedImage.secure_url, { shouldDirty: true, shouldValidate: true })
      form.setValue('imagePublicId', uploadedImage.public_id, { shouldDirty: true })
      toast.success('Category image uploaded')
    } catch (error) {
      toast.error('Image was not uploaded', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setUploadingImage(false)
    }
  }
  return (
    <Dialog
      open={value !== null}
      onOpenChange={(open) => {
        if (!open && !submitting && !uploadingImage) onClose()
      }}
    >
      <DialogContent
        className="max-h-[92vh] min-w-0 overflow-x-hidden overflow-y-auto sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{category ? 'Edit category' : 'Add category'}</DialogTitle>
          <DialogDescription>Organize products into a clear customer-facing section.</DialogDescription>
        </DialogHeader>
        <form
          id="menu-category-form"
          className="min-w-0 grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, onSubmit, form.setError, {
              name: 'name',
              description: 'description',
              sortOrder: 'sortOrder',
              isActive: 'isActive',
              imageUrl: 'imageUrl',
              imagePublicId: 'imagePublicId',
            }),
          )}
        >
          <MenuImageField
            imageUrl={imageUrl}
            imageDescription="Category preview"
            uploading={uploadingImage}
            disabled={submitting}
            onSelect={(file) => void uploadImage(file)}
            onRemove={() => {
              form.setValue('imageUrl', null, { shouldDirty: true })
              form.setValue('imagePublicId', null, { shouldDirty: true })
            }}
            error={form.formState.errors.imageUrl?.message}
          />
          <Field
            label="Name"
            required
            description="The category title customers see, such as Burgers or Drinks."
            error={form.formState.errors.name?.message}
          >
            <Input {...form.register('name')} />
          </Field>
          <Field
            label="Description"
            description="Optional context that helps customers understand what belongs here."
            error={form.formState.errors.description?.message}
          >
            <Textarea {...form.register('description')} />
          </Field>
          <Field
            label="Display order"
            required
            description="Lower numbers place this category earlier in the menu."
            error={form.formState.errors.sortOrder?.message}
          >
            <Input type="number" min={0} {...form.register('sortOrder', { valueAsNumber: true })} />
          </Field>
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <Toggle
                label="Visible to customers"
                description="Show this category in the next published customer menu."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={submitting || uploadingImage} onClick={onClose}>
            Cancel
          </Button>
          <Button form="menu-category-form" disabled={submitting || uploadingImage}>
            {submitting ? <LoaderCircle className="animate-spin" /> : null}
            {submitting ? 'Saving category' : 'Save category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ItemDialog({
  menuAdministrationApi,
  categories,
  value,
  submitting,
  onClose,
  onSubmit,
}: {
  menuAdministrationApi: MenuAdministrationApi
  categories: MenuCategory[]
  value: MenuItem | null | 'new'
  submitting: boolean
  onClose: () => void
  onSubmit: (values: MenuItemFormValues) => Promise<void>
}) {
  const item = value === 'new' || value === null ? null : value
  const [uploadingImage, setUploadingImage] = useState(false)
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    values: {
      categoryId: item?.categoryId ?? categories[0]?.id ?? '',
      name: item?.name ?? '',
      description: item?.description ?? '',
      pricePkr: (item?.basePrice ?? 0) / 100,
      dietaryLabels: item?.dietaryLabels ?? [],
      allergens: item?.allergens ?? [],
      calories: item?.calories ?? null,
      preparationTimeMinutes: item?.preparationTimeMinutes ?? null,
      sortOrder: item?.sortOrder ?? 0,
      isActive: item?.isActive ?? false,
      isFeatured: item?.isFeatured ?? false,
      isSoldOut: item?.isSoldOut ?? false,
      imageUrl: item?.imageUrl ?? null,
      imagePublicId: item?.imagePublicId ?? null,
      modifierGroups:
        item?.modifierGroups.map((group) => ({
          name: group.name,
          minimumSelections: group.minimumSelections,
          maximumSelections: group.maximumSelections,
          sortOrder: group.sortOrder,
          isActive: group.isActive,
          options: group.options.map((option) => ({
            name: option.name,
            priceAdjustmentPkr: option.priceAdjustment / 100,
            sortOrder: option.sortOrder,
            isActive: option.isActive,
            isSoldOut: option.isSoldOut,
          })),
        })) ?? [],
    },
  })
  const modifierGroups = useFieldArray({ control: form.control, name: 'modifierGroups' })
  const imageUrl = useWatch({ control: form.control, name: 'imageUrl' })
  const uploadImage = async (file: File) => {
    setUploadingImage(true)
    try {
      const signature = await menuAdministrationApi.createUploadSignature()
      await validateMenuImageBeforeUpload(file, signature.allowedFormats, signature.maximumBytes)
      const uploadedImage = await menuAdministrationApi.uploadImage(file, signature)
      validateUploadedMenuImage(uploadedImage, signature.allowedFormats)
      form.setValue('imageUrl', uploadedImage.secure_url, { shouldDirty: true, shouldValidate: true })
      form.setValue('imagePublicId', uploadedImage.public_id, { shouldDirty: true })
      toast.success('Product image uploaded')
    } catch (error) {
      toast.error('Image was not uploaded', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setUploadingImage(false)
    }
  }
  return (
    <Dialog
      open={value !== null}
      onOpenChange={(open) => {
        if (!open && !submitting && !uploadingImage) onClose()
      }}
    >
      <DialogContent
        className="max-h-[92vh] min-w-0 overflow-x-hidden overflow-y-auto sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{item ? 'Edit menu item' : 'Add menu item'}</DialogTitle>
          <DialogDescription>Add clear product information and availability states.</DialogDescription>
        </DialogHeader>
        <form
          id="menu-item-form"
          className="min-w-0 grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, onSubmit, form.setError, {
              categoryId: 'categoryId',
              name: 'name',
              description: 'description',
              basePrice: 'pricePkr',
              dietaryLabels: 'dietaryLabels',
              allergens: 'allergens',
              calories: 'calories',
              preparationTimeMinutes: 'preparationTimeMinutes',
              sortOrder: 'sortOrder',
              isActive: 'isActive',
              isFeatured: 'isFeatured',
              isSoldOut: 'isSoldOut',
              imageUrl: 'imageUrl',
              imagePublicId: 'imagePublicId',
              modifierGroups: 'modifierGroups',
              'modifierGroups.*': 'modifierGroups.0.name',
            }),
          )}
        >
          <MenuImageField
            imageUrl={imageUrl}
            imageDescription="Product preview"
            uploading={uploadingImage}
            disabled={submitting}
            onSelect={(file) => void uploadImage(file)}
            onRemove={() => {
              form.setValue('imageUrl', null, { shouldDirty: true })
              form.setValue('imagePublicId', null, { shouldDirty: true })
            }}
            error={form.formState.errors.imageUrl?.message}
          />
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Field
                label="Category"
                required
                description="Choose the customer-facing section where this item belongs."
                error={form.formState.errors.categoryId?.message}
              >
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Field
            label="Name"
            required
            description="Use the exact product name customers will recognize."
            error={form.formState.errors.name?.message}
          >
            <Input {...form.register('name')} />
          </Field>
          <Field
            label="Description"
            required
            description="Explain the portion, key ingredients, and useful product details."
            error={form.formState.errors.description?.message}
          >
            <Textarea {...form.register('description')} />
          </Field>
          <Field
            label="Price (PKR)"
            required
            description="Enter the base selling price before modifiers or location overrides."
            error={form.formState.errors.pricePkr?.message}
          >
            <Input type="number" min={0} step="0.01" {...form.register('pricePkr', { valueAsNumber: true })} />
          </Field>
          <Field
            label="Dietary labels"
            description="Customer guidance shown on the item."
            error={form.formState.errors.dietaryLabels?.message}
          >
            <Controller
              control={form.control}
              name="dietaryLabels"
              render={({ field }) => (
                <VocabularyCheckboxGroup
                  legend="Dietary labels"
                  options={dietaryLabels}
                  selected={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
          <Field
            label="Allergens"
            description="Select every allergen this item contains. Chosen from a fixed list so customer filtering is reliable."
            error={form.formState.errors.allergens?.message}
          >
            <Controller
              control={form.control}
              name="allergens"
              render={({ field }) => (
                <VocabularyCheckboxGroup
                  legend="Allergens"
                  options={allergens}
                  selected={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Calories" description="Optional estimated energy for one standard serving.">
              <Input
                type="number"
                {...form.register('calories', { setValueAs: (value) => (value === '' ? null : Number(value)) })}
              />
            </Field>
            <Field label="Prep minutes" description="Optional expected preparation time for this item.">
              <Input
                type="number"
                {...form.register('preparationTimeMinutes', {
                  setValueAs: (value) => (value === '' ? null : Number(value)),
                })}
              />
            </Field>
            <Field required label="Display order" description="Lower numbers place this item earlier in its category.">
              <Input type="number" {...form.register('sortOrder', { valueAsNumber: true })} />
            </Field>
          </div>
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <Toggle
                label="Active"
                description="Allow this item to appear in a publishable menu."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
              <Toggle
                label="Featured"
                description="Highlight this item in supported customer views."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="isSoldOut"
            render={({ field }) => (
              <Toggle
                label="Sold out"
                description="Keep the item visible but prevent customers from ordering it."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <div className="grid gap-4 rounded-xl border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Modifier groups</p>
                <p className="text-xs text-muted-foreground">Add sizes, toppings, spice levels, or optional extras.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  modifierGroups.append({
                    name: '',
                    minimumSelections: 0,
                    maximumSelections: 1,
                    sortOrder: modifierGroups.fields.length,
                    isActive: true,
                    options: [{ name: '', priceAdjustmentPkr: 0, sortOrder: 0, isActive: true, isSoldOut: false }],
                  })
                }
              >
                <Plus data-icon="inline-start" /> Add modifier group
              </Button>
            </div>
            {modifierGroups.fields.length === 0 ? (
              <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                This item has no choices or add-ons.
              </p>
            ) : null}
            {modifierGroups.fields.map((group, groupIndex) => (
              <ModifierGroupEditor
                key={group.id}
                groupIndex={groupIndex}
                form={form}
                onRemove={() => modifierGroups.remove(groupIndex)}
              />
            ))}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button form="menu-item-form" disabled={submitting || uploadingImage}>
            {submitting ? <LoaderCircle className="animate-spin" /> : null}
            {submitting ? 'Saving item' : 'Save menu item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const acceptedMenuImageMimeTypes = new Map([
  ['image/jpeg', 'jpeg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

async function validateMenuImageBeforeUpload(file: File, allowedFormats: string[], maximumBytes: number) {
  const format = acceptedMenuImageMimeTypes.get(file.type)
  const normalizedAllowedFormats = new Set(allowedFormats.map((entry) => (entry === 'jpg' ? 'jpeg' : entry)))
  if (!format || !normalizedAllowedFormats.has(format)) throw new Error('Choose a JPG, PNG, or WebP image.')
  if (file.size === 0) throw new Error('The selected image is empty.')
  if (file.size > maximumBytes) throw new Error(`Image must be no larger than ${maximumBytes / 1_000_000} MB.`)
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) throw new Error('The selected file could not be read as an image.')
  const { width, height } = bitmap
  bitmap.close()
  if (width < 320 || height < 240) throw new Error('Image dimensions must be at least 320 × 240 pixels.')
  if (width > 8000 || height > 8000) throw new Error('Image dimensions cannot exceed 8000 × 8000 pixels.')
}

const readableVocabularyLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word, index) => (index === 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
    .join(' ')

/**
 * Renders a fixed vocabulary as a labelled checkbox group. A fieldset keeps the options
 * announced as one control rather than a series of unrelated checkboxes.
 */
function VocabularyCheckboxGroup<Value extends string>({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string
  options: readonly Value[]
  selected: readonly Value[]
  onChange: (next: Value[]) => void
}) {
  const groupId = useId()

  return (
    <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const optionId = `${groupId}-${option}`
        const isSelected = selected.includes(option)
        return (
          <label className="flex items-center gap-2 text-sm" htmlFor={optionId} key={option}>
            <Checkbox
              id={optionId}
              checked={isSelected}
              onCheckedChange={(checked) =>
                onChange(checked === true ? [...selected, option] : selected.filter((value) => value !== option))
              }
            />
            {readableVocabularyLabel(option)}
          </label>
        )
      })}
    </fieldset>
  )
}

function validateUploadedMenuImage(
  uploadedImage: { format: string; width: number; height: number },
  allowedFormats: string[],
) {
  const normalizedFormat = uploadedImage.format === 'jpg' ? 'jpeg' : uploadedImage.format
  const normalizedAllowedFormats = new Set(allowedFormats.map((entry) => (entry === 'jpg' ? 'jpeg' : entry)))
  if (!normalizedAllowedFormats.has(normalizedFormat))
    throw new Error('Cloudinary returned an unsupported image format.')
  if (uploadedImage.width < 320 || uploadedImage.height < 240)
    throw new Error('Cloudinary returned an image below the minimum dimensions.')
  if (uploadedImage.width > 8000 || uploadedImage.height > 8000)
    throw new Error('Cloudinary returned an image above the maximum dimensions.')
}

function MenuImageField({
  imageUrl,
  imageDescription,
  uploading,
  disabled,
  onSelect,
  onRemove,
  error,
}: {
  imageUrl: string | null
  imageDescription: string
  uploading: boolean
  disabled: boolean
  onSelect: (file: File) => void
  onRemove: () => void
  error?: string
}) {
  const inputId = useId()
  const inputReference = useRef<HTMLInputElement>(null)
  const controlsDisabled = uploading || disabled
  return (
    <div className="min-w-0 grid gap-3 rounded-xl border bg-muted/10 p-4">
      <div>
        <Label htmlFor={inputId}>Image</Label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Add a clear landscape image customers can recognize quickly.
        </p>
      </div>
      {imageUrl ? (
        <div className="relative overflow-hidden rounded-xl border bg-muted">
          <img className="aspect-[16/9] w-full object-cover" src={imageUrl} alt={imageDescription} />
          <Badge className="absolute left-3 top-3 border-white/20 bg-black/65 text-white">Uploaded</Badge>
        </div>
      ) : (
        <Button
          className="h-auto min-h-40 w-full flex-col gap-3 border-dashed bg-background px-5 py-8 text-center hover:bg-muted/40"
          type="button"
          variant="outline"
          disabled={controlsDisabled}
          onClick={() => inputReference.current?.click()}
        >
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            {uploading ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
          </span>
          <span className="font-semibold text-foreground">{uploading ? 'Uploading image…' : 'Upload an image'}</span>
          <span className="max-w-xs whitespace-normal text-xs font-normal leading-5 text-muted-foreground">
            Choose a JPG, PNG, or WebP file from your device.
          </span>
        </Button>
      )}
      <Input
        ref={inputReference}
        id={inputId}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={controlsDisabled}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onSelect(file)
          event.target.value = ''
        }}
      />
      {imageUrl ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled={controlsDisabled}
            onClick={() => inputReference.current?.click()}
          >
            {uploading ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <ImagePlus data-icon="inline-start" />
            )}
            {uploading ? 'Uploading image' : 'Replace image'}
          </Button>
          <Button type="button" variant="outline" disabled={controlsDisabled} onClick={onRemove}>
            <Trash2 data-icon="inline-start" /> Remove image
          </Button>
        </div>
      ) : null}
      <p className="text-xs leading-5 text-muted-foreground">
        Maximum 5 MB · minimum 320 × 240 px · landscape images work best
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function ModifierGroupEditor({
  groupIndex,
  form,
  onRemove,
}: {
  groupIndex: number
  form: UseFormReturn<MenuItemFormValues>
  onRemove: () => void
}) {
  const options = useFieldArray({ control: form.control, name: `modifierGroups.${groupIndex}.options` })
  const groupErrors = form.formState.errors.modifierGroups?.[groupIndex]
  return (
    <div className="grid gap-4 rounded-xl border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">Modifier group {groupIndex + 1}</p>
        <Button type="button" size="sm" variant="outline" onClick={onRemove}>
          <Trash2 data-icon="inline-start" /> Remove group
        </Button>
      </div>
      <Field
        label="Group name"
        required
        description="Name the choice customers make, such as Choose a size."
        error={groupErrors?.name?.message}
      >
        <Input placeholder="Choose a size" {...form.register(`modifierGroups.${groupIndex}.name`)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Minimum"
          required
          description="The fewest options a customer must select."
          error={groupErrors?.minimumSelections?.message}
        >
          <Input
            type="number"
            min={0}
            {...form.register(`modifierGroups.${groupIndex}.minimumSelections`, { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Maximum"
          required
          description="The most options a customer may select."
          error={groupErrors?.maximumSelections?.message}
        >
          <Input
            type="number"
            min={1}
            {...form.register(`modifierGroups.${groupIndex}.maximumSelections`, { valueAsNumber: true })}
          />
        </Field>
        <Field required label="Display order" description="Lower numbers show this group earlier.">
          <Input
            type="number"
            min={0}
            {...form.register(`modifierGroups.${groupIndex}.sortOrder`, { valueAsNumber: true })}
          />
        </Field>
      </div>
      <Controller
        control={form.control}
        name={`modifierGroups.${groupIndex}.isActive`}
        render={({ field }) => (
          <Toggle
            label="Group is active"
            description="Make this choice group available with the item."
            checked={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Options</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              options.append({
                name: '',
                priceAdjustmentPkr: 0,
                sortOrder: options.fields.length,
                isActive: true,
                isSoldOut: false,
              })
            }
          >
            <Plus data-icon="inline-start" /> Add option
          </Button>
        </div>
        {options.fields.map((option, optionIndex) => (
          <div className="grid gap-3 rounded-lg border bg-background p-3" key={option.id}>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end">
              <Field
                label="Option name"
                required
                description="The selectable value customers see, such as Large."
                error={groupErrors?.options?.[optionIndex]?.name?.message}
              >
                <Input
                  placeholder="Large"
                  {...form.register(`modifierGroups.${groupIndex}.options.${optionIndex}.name`)}
                />
              </Field>
              <Field
                required
                label="Extra price (PKR)"
                description="The amount added to the item's base price when selected."
              >
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  {...form.register(`modifierGroups.${groupIndex}.options.${optionIndex}.priceAdjustmentPkr`, {
                    valueAsNumber: true,
                  })}
                />
              </Field>
              <Button
                type="button"
                variant="outline"
                disabled={options.fields.length === 1}
                onClick={() => options.remove(optionIndex)}
              >
                <Trash2 data-icon="inline-start" /> Remove
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Controller
                control={form.control}
                name={`modifierGroups.${groupIndex}.options.${optionIndex}.isActive`}
                render={({ field }) => (
                  <Toggle
                    label="Active"
                    description="Allow customers to select this option."
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                control={form.control}
                name={`modifierGroups.${groupIndex}.options.${optionIndex}.isSoldOut`}
                render={({ field }) => (
                  <Toggle
                    label="Sold out"
                    description="Show the option but prevent it from being selected."
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        ))}
        {groupErrors?.options?.root?.message ? (
          <p className="text-xs text-destructive">{groupErrors.options.root.message}</p>
        ) : null}
      </div>
    </div>
  )
}

export function DuplicateMenuItemDialog({
  item,
  submitting,
  onClose,
  onSubmit,
}: {
  item: MenuItem | null
  submitting: boolean
  onClose: () => void
  onSubmit: (values: DuplicateMenuItemFormValues) => Promise<void>
}) {
  const form = useForm<DuplicateMenuItemFormValues>({
    resolver: zodResolver(duplicateMenuItemFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    values: { name: item ? `${item.name} copy` : '' },
  })
  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open && !submitting) onClose()
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Duplicate menu item</DialogTitle>
          <DialogDescription>
            The duplicate keeps modifiers and location settings but is always created as a draft.
          </DialogDescription>
        </DialogHeader>
        <form
          id="duplicate-menu-item-form"
          onSubmit={form.handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, onSubmit, form.setError, { name: 'name' }),
          )}
        >
          <Field
            label="Name"
            required
            description="Give the draft copy a unique, recognizable product name."
            error={form.formState.errors.name?.message}
          >
            <Input {...form.register('name')} />
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button form="duplicate-menu-item-form" disabled={submitting}>
            {submitting ? <LoaderCircle className="animate-spin" /> : <Copy />}
            {submitting ? 'Duplicating item' : 'Duplicate as draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function LocationAvailabilityDialog({
  item,
  locations,
  submitting,
  onClose,
  onSubmit,
}: {
  item: MenuItem | null
  locations: RestaurantLocation[]
  submitting: boolean
  onClose: () => void
  onSubmit: (values: LocationAvailabilityFormValues) => Promise<void>
}) {
  const form = useForm<LocationAvailabilityFormValues>({
    resolver: zodResolver(locationAvailabilityFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    values: {
      locations: locations.map((location) => {
        const saved = item?.locationAvailability.find((entry) => entry.locationId === location.id)
        return {
          locationId: location.id,
          isAvailable: saved?.isAvailable ?? true,
          priceOverridePkr:
            saved?.priceOverride === null || saved?.priceOverride === undefined ? null : saved.priceOverride / 100,
        }
      }),
    },
  })
  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open && !submitting) onClose()
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Location availability</DialogTitle>
          <DialogDescription>
            Control where {item?.name ?? 'this item'} is sold and optionally override its PKR price.
          </DialogDescription>
        </DialogHeader>
        <form
          id="location-availability-form"
          className="grid gap-3"
          onSubmit={form.handleSubmit((values) =>
            submitApiFormWithFieldErrors(values, onSubmit, form.setError, {
              locations: 'locations',
              'locations.*': 'locations.0.priceOverridePkr',
            }),
          )}
        >
          {locations.length === 0 ? (
            <Alert>
              <AlertTitle>No locations available</AlertTitle>
              <AlertDescription>Create a restaurant location before configuring item availability.</AlertDescription>
            </Alert>
          ) : (
            locations.map((location, index) => (
              <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_12rem]" key={location.id}>
                <Controller
                  control={form.control}
                  name={`locations.${index}.isAvailable`}
                  render={({ field }) => (
                    <Toggle
                      label={location.name}
                      description="Choose whether customers can order this item from this branch."
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Field
                  label="Price override (PKR)"
                  description="Leave blank to use the base price, or enter this branch's selling price."
                  error={form.formState.errors.locations?.[index]?.priceOverridePkr?.message}
                >
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder={(item ? item.basePrice / 100 : 0).toString()}
                    {...form.register(`locations.${index}.priceOverridePkr`, {
                      setValueAs: (value) => (value === '' ? null : Number(value)),
                    })}
                  />
                </Field>
              </div>
            ))
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button form="location-availability-form" disabled={submitting || locations.length === 0}>
            {submitting ? <LoaderCircle className="animate-spin" /> : null}
            {submitting ? 'Saving availability' : 'Save availability'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ConfirmationDialog({
  open,
  title,
  description,
  submitting,
  actionLabel,
  pendingLabel,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  submitting: boolean
  actionLabel: string
  pendingLabel: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) onClose()
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={submitting} onClick={onConfirm}>
            {submitting ? <LoaderCircle className="animate-spin" /> : null}
            {submitting ? pendingLabel : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  description,
  error,
  required = false,
  children,
}: {
  label: string
  description: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="grid gap-2 data-[invalid=true]:[&_[data-slot=input]]:border-destructive data-[invalid=true]:[&_[data-slot=input]]:ring-destructive/20 data-[invalid=true]:[&_[data-slot=select-trigger]]:border-destructive data-[invalid=true]:[&_[data-slot=select-trigger]]:ring-destructive/20 data-[invalid=true]:[&_[data-slot=textarea]]:border-destructive data-[invalid=true]:[&_[data-slot=textarea]]:ring-destructive/20"
      data-invalid={error ? true : undefined}
    >
      <Label>
        {label}
        {required ? (
          <>
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </Label>
      {children}
      <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <div>
        <Label>{label}</Label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
