import { HttpError } from '../http/http-error.js'

/**
 * Ceilings on tenant-created content.
 *
 * Validation bounds one request; nothing bounded the total. A single owner could create
 * unlimited items, each carrying up to 30 modifier groups of 100 options, so an ordinary
 * authenticated customer could write millions of rows through the documented API.
 *
 * These are deliberately far above any real restaurant menu; they exist to stop abuse and
 * runaway integrations, not to shape the product.
 */
export const menuQuotas = {
  categoriesPerRestaurant: 100,
  itemsPerRestaurant: 500,
} as const

export const assertCategoryQuota = (currentCount: number) => {
  if (currentCount < menuQuotas.categoriesPerRestaurant) return
  throw new HttpError(
    409,
    'MENU_QUOTA_EXCEEDED',
    `This restaurant has reached the limit of ${menuQuotas.categoriesPerRestaurant} menu categories.`,
  )
}

export const assertItemQuota = (currentCount: number) => {
  if (currentCount < menuQuotas.itemsPerRestaurant) return
  throw new HttpError(
    409,
    'MENU_QUOTA_EXCEEDED',
    `This restaurant has reached the limit of ${menuQuotas.itemsPerRestaurant} menu items.`,
  )
}
