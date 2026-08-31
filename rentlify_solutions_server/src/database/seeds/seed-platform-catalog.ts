import '../../config/load-environment.js'

import { notInArray } from 'drizzle-orm'

import { database, databasePool } from '../client.js'
import { packageFeature, restaurantFeatureOverride, subscriptionPackage } from '../schema/platform-schema.js'
import {
  sellableFeatureKeys,
  type FeatureKey,
  type PackageSlug,
} from '../../modules/restaurants/restaurant-constants.js'

const packages: ReadonlyArray<{
  id: string
  slug: PackageSlug
  name: string
  description: string
  sortOrder: number
  features: readonly FeatureKey[]
}> = [
  {
    id: 'package_starter',
    slug: 'starter',
    name: 'Starter',
    description: 'Core pickup ordering with customer accounts and cash payment.',
    sortOrder: 1,
    features: [
      'ONLINE_ORDERING',
      'PICKUP',
      'MENU_CUSTOMIZATIONS',
      'ALLERGENS_AND_DIETARY_LABELS',
      'CUSTOMER_ACCOUNTS',
      'CASH_ON_DELIVERY',
    ],
  },
  {
    id: 'package_growth',
    slug: 'growth',
    name: 'Growth',
    description: 'Pickup and delivery ordering with branding and delivery-zone controls.',
    sortOrder: 2,
    features: [
      'ONLINE_ORDERING',
      'DELIVERY',
      'PICKUP',
      'MENU_CUSTOMIZATIONS',
      'ALLERGENS_AND_DIETARY_LABELS',
      'CUSTOMER_ACCOUNTS',
      'CASH_ON_DELIVERY',
      'CUSTOM_BRANDING',
    ],
  },
  {
    id: 'package_pro',
    slug: 'pro',
    name: 'Pro',
    description: 'Complete MVP ordering operations for multi-location restaurant brands.',
    sortOrder: 3,
    features: [
      'ONLINE_ORDERING',
      'DELIVERY',
      'PICKUP',
      'MULTI_LOCATION',
      'MENU_CUSTOMIZATIONS',
      'ALLERGENS_AND_DIETARY_LABELS',
      'CUSTOM_BRANDING',
      'CUSTOMER_ACCOUNTS',
      'CASH_ON_DELIVERY',
    ],
  },
]

const run = async () => {
  try {
    await database.transaction(async (transaction) => {
      for (const packageDefinition of packages) {
        await transaction
          .insert(subscriptionPackage)
          .values({
            id: packageDefinition.id,
            slug: packageDefinition.slug,
            name: packageDefinition.name,
            description: packageDefinition.description,
            sortOrder: packageDefinition.sortOrder,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: subscriptionPackage.id,
            set: {
              slug: packageDefinition.slug,
              name: packageDefinition.name,
              description: packageDefinition.description,
              sortOrder: packageDefinition.sortOrder,
              updatedAt: new Date(),
            },
          })

        for (const featureKey of sellableFeatureKeys) {
          const enabled = packageDefinition.features.includes(featureKey)
          await transaction
            .insert(packageFeature)
            .values({ packageId: packageDefinition.id, featureKey, enabled })
            .onConflictDoUpdate({
              target: [packageFeature.packageId, packageFeature.featureKey],
              set: { enabled, updatedAt: new Date() },
            })
        }
      }

      await transaction.delete(packageFeature).where(notInArray(packageFeature.featureKey, sellableFeatureKeys))
      await transaction
        .delete(restaurantFeatureOverride)
        .where(notInArray(restaurantFeatureOverride.featureKey, sellableFeatureKeys))
    })
    console.info('Platform package and feature catalog seeded successfully.')
  } finally {
    await databasePool.end()
  }
}

run().catch((error: unknown) => {
  console.error('Platform catalog seed failed.', error)
  process.exitCode = 1
})
