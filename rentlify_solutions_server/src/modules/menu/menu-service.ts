import { HttpError } from '../http/http-error.js'
import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { environment } from '../../config/environment.js'
import { assertFeatureEnabled } from '../restaurants/restaurant-entitlements.js'
import { getEffectiveFeatureState } from '../restaurants/restaurant-feature-state.js'
import { restaurantRepository } from '../restaurants/restaurant-repository.js'
import { withRestaurantConfigurationLock } from '../restaurants/restaurant-lock.js'
import { verifyCloudinaryMenuUploadPresetPolicy } from './cloudinary-menu-upload-preset-policy.js'
import { menuMediaRepository } from './menu-media-repository.js'
import {
  menuImageAllowedFormatSet,
  menuImageAllowedFormats,
  menuImageAllowedFormatsParameter,
  menuImageMaximumBytes,
  menuImageMaximumHeight,
  menuImageMaximumWidth,
  menuImageMinimumHeight,
  menuImageMinimumWidth,
} from './menu-media-policy.js'
import { assertCategoryQuota, assertItemQuota } from './menu-quotas.js'
import { menuRepository } from './menu-repository.js'
import type {
  AvailabilityInput,
  CreateCategoryInput,
  CreateMenuItemInput,
  DuplicateMenuItemInput,
  UpdateCategoryInput,
  UpdateMenuItemInput,
} from './menu-validation.js'

const cloudinaryMenuAssetSchema = z.object({
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  bytes: z.number().int().nonnegative(),
  format: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

const requireRestaurant = async (restaurantId: string) => {
  if (!(await restaurantRepository.findRestaurantById(restaurantId)))
    throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
}
const requireCategory = async (restaurantId: string, categoryId: string) => {
  const category = await menuRepository.findCategory(restaurantId, categoryId)
  if (!category) throw new HttpError(404, 'MENU_CATEGORY_NOT_FOUND', 'Menu category not found.')
  return category
}
const requireItem = async (restaurantId: string, itemId: string) => {
  const item = await menuRepository.findItem(restaurantId, itemId)
  if (!item) throw new HttpError(404, 'MENU_ITEM_NOT_FOUND', 'Menu item not found.')
  return item
}

const isUniqueConstraintViolation = (error: unknown) => {
  let current = error
  while (typeof current === 'object' && current !== null) {
    if ('code' in current && current.code === '23505') return true
    current = 'cause' in current ? current.cause : null
  }
  return false
}

const translateCategoryConflict = (error: unknown): never => {
  if (isUniqueConstraintViolation(error)) {
    throw new HttpError(409, 'MENU_CATEGORY_NAME_CONFLICT', 'A category with this name already exists.')
  }
  throw error
}

const uploadSignatureWindowMilliseconds = 10 * 60 * 1000
const maximumUploadSignaturesPerWindow = 20
const uploadIntentLifetimeMilliseconds = 60 * 60 * 1000

const markImageAttached = async (restaurantId: string, imagePublicId?: string | null) => {
  if (imagePublicId) await menuMediaRepository.markAttached(restaurantId, imagePublicId)
}

const validateMenuImageReference = async (
  restaurantId: string,
  image: { imageUrl?: string | null; imagePublicId?: string | null },
) => {
  if (image.imageUrl === undefined && image.imagePublicId === undefined) return
  if (!image.imageUrl && !image.imagePublicId) return
  if (!image.imageUrl || !image.imagePublicId)
    throw new HttpError(
      400,
      'INVALID_MENU_IMAGE',
      'The menu image URL and public identifier must be provided together.',
    )
  if (!environment.CLOUDINARY_CLOUD_NAME)
    throw new HttpError(503, 'MEDIA_UPLOAD_NOT_CONFIGURED', 'Menu image uploads are not configured.')

  const requiredPublicIdPrefix = `rentlify/restaurants/${restaurantId}/menu/`
  if (!image.imagePublicId.startsWith(requiredPublicIdPrefix))
    throw new HttpError(400, 'INVALID_MENU_IMAGE', 'The uploaded image does not belong to this restaurant.')

  let imageUrl: URL
  try {
    imageUrl = new URL(image.imageUrl)
  } catch {
    throw new HttpError(400, 'INVALID_MENU_IMAGE', 'The uploaded image URL is invalid.')
  }
  const expectedPathPrefix = `/${environment.CLOUDINARY_CLOUD_NAME}/image/upload/`
  if (
    imageUrl.protocol !== 'https:' ||
    imageUrl.hostname !== 'res.cloudinary.com' ||
    !imageUrl.pathname.startsWith(expectedPathPrefix) ||
    !imageUrl.pathname.includes(`/${image.imagePublicId}.`)
  ) {
    throw new HttpError(400, 'INVALID_MENU_IMAGE', 'The uploaded image reference could not be verified.')
  }

  if (!environment.CLOUDINARY_API_KEY || !environment.CLOUDINARY_API_SECRET) {
    throw new HttpError(503, 'MEDIA_UPLOAD_NOT_CONFIGURED', 'Menu image uploads are not configured.')
  }
  const basicAuthentication = Buffer.from(
    `${environment.CLOUDINARY_API_KEY}:${environment.CLOUDINARY_API_SECRET}`,
  ).toString('base64')
  let assetResponse: Response
  try {
    assetResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(environment.CLOUDINARY_CLOUD_NAME)}/resources/image/upload/${encodeURIComponent(image.imagePublicId)}`,
      {
        headers: { Authorization: `Basic ${basicAuthentication}` },
        signal: AbortSignal.timeout(10_000),
      },
    )
  } catch {
    throw new HttpError(503, 'MEDIA_VERIFICATION_UNAVAILABLE', 'The uploaded image could not be verified right now.')
  }
  if (!assetResponse.ok) {
    throw new HttpError(400, 'INVALID_MENU_IMAGE', 'The uploaded image could not be found or verified.')
  }
  const asset = cloudinaryMenuAssetSchema.safeParse(await assetResponse.json().catch(() => null))
  if (
    !asset.success ||
    asset.data.public_id !== image.imagePublicId ||
    asset.data.secure_url !== image.imageUrl ||
    !menuImageAllowedFormatSet.has(asset.data.format.toLowerCase()) ||
    asset.data.bytes > menuImageMaximumBytes ||
    asset.data.width < menuImageMinimumWidth ||
    asset.data.height < menuImageMinimumHeight ||
    asset.data.width > menuImageMaximumWidth ||
    asset.data.height > menuImageMaximumHeight
  ) {
    throw new HttpError(
      400,
      'INVALID_MENU_IMAGE',
      'The uploaded image does not meet the required file type, size, or dimension limits.',
    )
  }
}

/**
 * Menu capabilities that a package can withhold. Checked on every write that could introduce
 * them, because a browser that hides the control is not enforcement.
 */
const assertMenuItemCapabilities = (
  features: ReadonlyMap<string, boolean>,
  input: {
    modifierGroups?: readonly unknown[] | undefined
    allergens?: readonly unknown[] | undefined
    dietaryLabels?: readonly unknown[] | undefined
  },
) => {
  const usesModifiers = (input.modifierGroups?.length ?? 0) > 0
  const usesLabels = (input.allergens?.length ?? 0) > 0 || (input.dietaryLabels?.length ?? 0) > 0
  if (!usesModifiers && !usesLabels) return

  if (usesModifiers) assertFeatureEnabled(features, 'MENU_CUSTOMIZATIONS', 'adding modifier groups to a menu item')
  if (usesLabels)
    assertFeatureEnabled(features, 'ALLERGENS_AND_DIETARY_LABELS', 'adding allergen or dietary labels to a menu item')
}

export const menuService = {
  validateMediaReference: validateMenuImageReference,
  listMenu: async (restaurantId: string) => {
    await requireRestaurant(restaurantId)
    return menuRepository.listMenu(restaurantId)
  },
  createCategory: async (restaurantId: string, input: CreateCategoryInput) => {
    await requireRestaurant(restaurantId)
    await validateMenuImageReference(restaurantId, input)
    try {
      const category = await withRestaurantConfigurationLock(restaurantId, async () => {
        assertCategoryQuota(await menuRepository.countCategories(restaurantId))
        return menuRepository.createCategory(restaurantId, input)
      })
      if (!category) throw new HttpError(500, 'MENU_CATEGORY_NOT_CREATED', 'The menu category could not be created.')
      await markImageAttached(restaurantId, category.imagePublicId)
      return category
    } catch (error) {
      return translateCategoryConflict(error)
    }
  },
  updateCategory: async (restaurantId: string, categoryId: string, input: UpdateCategoryInput) => {
    const existingCategory = await requireCategory(restaurantId, categoryId)
    await validateMenuImageReference(restaurantId, {
      imageUrl: input.imageUrl === undefined ? existingCategory.imageUrl : input.imageUrl,
      imagePublicId: input.imagePublicId === undefined ? existingCategory.imagePublicId : input.imagePublicId,
    })
    try {
      const category = await menuRepository.updateCategory(restaurantId, categoryId, input)
      if (!category) throw new HttpError(404, 'MENU_CATEGORY_NOT_FOUND', 'Menu category not found.')
      await markImageAttached(restaurantId, category.imagePublicId)
      return category
    } catch (error) {
      return translateCategoryConflict(error)
    }
  },
  createItem: async (restaurantId: string, input: CreateMenuItemInput) => {
    await requireCategory(restaurantId, input.categoryId)
    await validateMenuImageReference(restaurantId, input)
    const item = await withRestaurantConfigurationLock(restaurantId, async (transaction) => {
      const context = await restaurantRepository.loadEntitlementContext(restaurantId, transaction)
      if (!context) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
      assertItemQuota(await menuRepository.countItems(restaurantId))
      assertMenuItemCapabilities(getEffectiveFeatureState(context.packageFeatures, context.overrides), input)
      return menuRepository.createItem(restaurantId, input)
    })
    if (!item) throw new HttpError(500, 'MENU_ITEM_NOT_CREATED', 'The menu item could not be created.')
    await markImageAttached(restaurantId, item.imagePublicId)
    return item
  },
  updateItem: async (restaurantId: string, itemId: string, input: UpdateMenuItemInput) => {
    const existingItem = await requireItem(restaurantId, itemId)
    if (input.categoryId) await requireCategory(restaurantId, input.categoryId)
    await validateMenuImageReference(restaurantId, {
      imageUrl: input.imageUrl === undefined ? existingItem.imageUrl : input.imageUrl,
      imagePublicId: input.imagePublicId === undefined ? existingItem.imagePublicId : input.imagePublicId,
    })
    const item = await withRestaurantConfigurationLock(restaurantId, async (transaction) => {
      const context = await restaurantRepository.loadEntitlementContext(restaurantId, transaction)
      if (!context) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
      const currentItem = await menuRepository.findItemWithRelationships(restaurantId, itemId)
      if (!currentItem) throw new HttpError(404, 'MENU_ITEM_NOT_FOUND', 'Menu item not found.')
      assertMenuItemCapabilities(getEffectiveFeatureState(context.packageFeatures, context.overrides), {
        modifierGroups: input.modifierGroups ?? currentItem.modifierGroups,
        allergens: input.allergens ?? currentItem.allergens,
        dietaryLabels: input.dietaryLabels ?? currentItem.dietaryLabels,
      })
      return menuRepository.updateItem(restaurantId, itemId, input)
    })
    if (!item) throw new HttpError(404, 'MENU_ITEM_NOT_FOUND', 'Menu item not found.')
    await markImageAttached(restaurantId, item.imagePublicId)
    return item
  },
  duplicateItem: async (restaurantId: string, itemId: string, input: DuplicateMenuItemInput) => {
    return withRestaurantConfigurationLock(restaurantId, async (transaction) => {
      const context = await restaurantRepository.loadEntitlementContext(restaurantId, transaction)
      if (!context) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
      const sourceItem = await menuRepository.findItemWithRelationships(restaurantId, itemId)
      if (!sourceItem) throw new HttpError(404, 'MENU_ITEM_NOT_FOUND', 'Menu item not found.')
      assertItemQuota(await menuRepository.countItems(restaurantId))
      assertMenuItemCapabilities(getEffectiveFeatureState(context.packageFeatures, context.overrides), sourceItem)
      if (sourceItem.name.localeCompare(input.name, undefined, { sensitivity: 'accent' }) === 0) {
        throw new HttpError(400, 'DUPLICATE_MENU_ITEM_NAME_REQUIRED', 'Enter a different name for the duplicated item.')
      }
      return menuRepository.duplicateItem(restaurantId, itemId, input)
    })
  },
  createMediaUploadSignature: async (restaurantId: string, requestedByUserId: string) => {
    await requireRestaurant(restaurantId)
    if (
      !environment.CLOUDINARY_CLOUD_NAME ||
      !environment.CLOUDINARY_API_KEY ||
      !environment.CLOUDINARY_API_SECRET ||
      !environment.CLOUDINARY_MENU_UPLOAD_PRESET
    ) {
      throw new HttpError(503, 'MEDIA_UPLOAD_NOT_CONFIGURED', 'Menu image uploads are not configured.')
    }
    if (!(await verifyCloudinaryMenuUploadPresetPolicy())) {
      throw new HttpError(
        503,
        'MEDIA_UPLOAD_POLICY_INVALID',
        'Menu image uploads are temporarily unavailable because the upload policy is not secure.',
      )
    }
    const timestamp = Math.floor(Date.now() / 1000)
    const folder = `rentlify/restaurants/${restaurantId}/menu`
    const publicId = randomUUID()
    const storedPublicId = `${folder}/${publicId}`
    const signedParameters = [
      `allowed_formats=${menuImageAllowedFormatsParameter}`,
      `folder=${folder}`,
      'overwrite=false',
      `public_id=${publicId}`,
      `timestamp=${timestamp}`,
      `upload_preset=${environment.CLOUDINARY_MENU_UPLOAD_PRESET}`,
    ].join('&')
    const signature = createHash('sha256')
      .update(`${signedParameters}${environment.CLOUDINARY_API_SECRET}`)
      .digest('hex')
    const intentIssued = await menuMediaRepository.issueUploadIntent(
      {
        publicId: storedPublicId,
        restaurantId,
        requestedByUserId,
        expiresAt: new Date(Date.now() + uploadIntentLifetimeMilliseconds),
      },
      new Date(Date.now() - uploadSignatureWindowMilliseconds),
      maximumUploadSignaturesPerWindow,
    )
    if (!intentIssued)
      throw new HttpError(
        429,
        'MEDIA_UPLOAD_RATE_LIMITED',
        'Too many image uploads were started. Wait a few minutes and try again.',
      )
    return {
      cloudName: environment.CLOUDINARY_CLOUD_NAME,
      apiKey: environment.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      publicId,
      uploadPreset: environment.CLOUDINARY_MENU_UPLOAD_PRESET,
      overwrite: false,
      allowedFormatsParameter: menuImageAllowedFormatsParameter,
      signature,
      signatureAlgorithm: 'sha256' as const,
      allowedFormats: menuImageAllowedFormats,
      maximumBytes: menuImageMaximumBytes,
    }
  },
  replaceAvailability: async (restaurantId: string, itemId: string, input: AvailabilityInput) => {
    await requireItem(restaurantId, itemId)
    const restaurantDetails = await restaurantRepository.getRestaurantDetails(restaurantId)
    if (!restaurantDetails) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
    const validLocationIds = new Set(restaurantDetails.locations.map(({ id }) => id))
    if (input.locations.some(({ locationId }) => !validLocationIds.has(locationId))) {
      throw new HttpError(400, 'INVALID_LOCATION', 'Every availability entry must belong to this restaurant.')
    }
    await menuRepository.replaceAvailability(restaurantId, itemId, input)
    return menuRepository.listMenu(restaurantId)
  },
}
