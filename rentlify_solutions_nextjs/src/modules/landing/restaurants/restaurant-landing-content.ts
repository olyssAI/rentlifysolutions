import {
  BadgePercent,
  BarChart3,
  Bike,
  Boxes,
  ChefHat,
  CircleDollarSign,
  ClipboardList,
  CloudCog,
  Gift,
  Globe2,
  HeartHandshake,
  Megaphone,
  MonitorCheck,
  PackageCheck,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  type LucideIcon,
} from 'lucide-react'

export type RestaurantCapability = {
  readonly icon: LucideIcon
  readonly title: string
  readonly description: string
  readonly tone: 'purple' | 'yellow' | 'light'
}

export const restaurantCapabilities: readonly RestaurantCapability[] = [
  { icon: Globe2, title: 'Branded website', description: 'Your digital storefront, offers and menu.', tone: 'light' },
  { icon: Smartphone, title: 'Customer app', description: 'Direct ordering under your own identity.', tone: 'purple' },
  { icon: ShoppingBag, title: 'Online ordering', description: 'Delivery, pickup and dine in journeys.', tone: 'yellow' },
  { icon: QrCode, title: 'Table ordering', description: 'Scan, browse and order from the table.', tone: 'light' },
  { icon: MonitorCheck, title: 'Kitchen display', description: 'A clear live queue for every station.', tone: 'purple' },
  { icon: Bike, title: 'Delivery operations', description: 'Dispatch, rider assignment and tracking.', tone: 'yellow' },
  { icon: Boxes, title: 'Inventory', description: 'Ingredients, stock movement and alerts.', tone: 'light' },
  { icon: Gift, title: 'Loyalty and rewards', description: 'Bring good customers back more often.', tone: 'yellow' },
  { icon: BarChart3, title: 'Live reporting', description: 'Sales, orders, products and branches.', tone: 'purple' },
]

export const customerExperienceFeatures = [
  'Ordering under your restaurant brand',
  'Menu, modifiers and combos',
  'Delivery, pickup and dine in',
  'Secure checkout and receipts',
  'Live order status',
  'Offers, points and rewards',
] as const

export const ownerControlFeatures = [
  'Menu and availability control',
  'Order and kitchen workflow',
  'Branches, staff and permissions',
  'Customers and order history',
  'Stock and ingredient visibility',
  'Sales and performance reporting',
] as const

export const operatingLoop = [
  { icon: ClipboardList, label: 'Order placed', detail: 'App, web, QR or counter' },
  { icon: ChefHat, label: 'Kitchen receives it', detail: 'A clear queue for each station' },
  { icon: PackageCheck, label: 'Order prepared', detail: 'Every status stays visible' },
  { icon: Bike, label: 'Customer served', detail: 'Pickup, table or delivery' },
  { icon: BarChart3, label: 'Results understood', detail: 'Useful decisions from live data' },
] as const

export const growthTools = [
  { icon: BadgePercent, title: 'Offers that run on schedule', description: 'Launch product, category and basket offers with clear dates and limits.' },
  { icon: Gift, title: 'Loyalty that feels rewarding', description: 'Create points and rewards around the behavior you want customers to repeat.' },
  { icon: Megaphone, title: 'Reach the right customers', description: 'Use order history to make future promotions more relevant instead of sending the same message to everyone.' },
  { icon: Star, title: 'Feedback after the meal', description: 'Capture service signals while the experience is still fresh.' },
] as const

export const trustPoints = [
  { icon: CircleDollarSign, label: 'No marketplace commission on your direct orders' },
  { icon: ShieldCheck, label: 'Access limited to the right restaurant and team member' },
  { icon: CloudCog, label: 'Managed updates without a large upfront build cost' },
  { icon: HeartHandshake, label: 'A product partnership designed to grow with you' },
] as const

export const questions = [
  { question: 'Is my restaurant listed beside competitors?', answer: 'No. This is your direct digital channel. Your branding, menu and customer experience stand on their own rather than inside a shared marketplace.' },
  { question: 'Can it support more than one branch?', answer: 'Yes. Each location can have its own hours, fulfillment options, prices, availability and order queue while keeping one restaurant identity.' },
  { question: 'Can my team manage it without technical skills?', answer: 'Yes. Daily controls are designed around familiar restaurant tasks: update an item, mark it sold out, follow an order, review activity and manage a location.' },
  { question: 'Will more features be added later?', answer: 'Yes. New restaurant tools can be added over time without asking you to replace the app, website or daily setup you already use.' },
  { question: 'Who owns the customer relationship?', answer: 'The restaurant does. Direct ordering keeps the relationship and customer experience centered on your business.' },
] as const
