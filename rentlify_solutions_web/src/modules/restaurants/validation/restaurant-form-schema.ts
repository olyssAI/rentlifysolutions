import { z } from 'zod'

export const restaurantFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least two characters.').max(120),
  slug: z
    .string()
    .trim()
    .min(2, 'Enter at least two characters.')
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.'),
  contactEmail: z.string().trim().email('Enter a valid email address.').max(254),
  contactPhone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number.')
    .max(30)
    .regex(/^\+?[0-9][0-9 ()-]+$/, 'Enter a valid phone number.'),
  packageId: z.string().min(1, 'Choose a package.'),
  locationName: z.string().trim().min(2, 'Enter a location name.').max(120),
  locationSlug: z
    .string()
    .trim()
    .min(2, 'Enter at least two characters.')
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.'),
  addressLine1: z.string().trim().min(3, 'Enter the street address.').max(160),
  city: z.string().trim().min(2, 'Enter the city.').max(100),
  province: z.string().trim().min(2, 'Enter the province.').max(100),
})

export type RestaurantFormValues = z.infer<typeof restaurantFormSchema>

export const toRestaurantPayload = (values: RestaurantFormValues, enabledPackageFeatures: readonly string[]) => ({
  name: values.name,
  slug: values.slug,
  legalName: null,
  description: null,
  packageId: values.packageId,
  contactEmail: values.contactEmail,
  contactPhone: values.contactPhone,
  logoUrl: null,
  coverImageUrl: null,
  primaryColor: '#D92D20',
  accentColor: '#F7C948',
  initialLocation: {
    name: values.locationName,
    slug: values.locationSlug,
    status: 'DRAFT',
    phone: values.contactPhone,
    email: values.contactEmail,
    addressLine1: values.addressLine1,
    addressLine2: null,
    city: values.city,
    province: values.province,
    postalCode: null,
    latitude: null,
    longitude: null,
    preparationTimeMinutes: 30,
    orderCapacityPerSlot: 20,
    deliveryEnabled: enabledPackageFeatures.includes('DELIVERY'),
    pickupEnabled: enabledPackageFeatures.includes('PICKUP'),
    dineInEnabled: enabledPackageFeatures.includes('DINE_IN'),
    scheduledOrdersEnabled: enabledPackageFeatures.includes('SCHEDULED_ORDERS'),
    minimumOrderAmount: 0,
    deliveryFee: 0,
    freeDeliveryThreshold: null,
  },
})

export type CreateRestaurantPayload = ReturnType<typeof toRestaurantPayload>
