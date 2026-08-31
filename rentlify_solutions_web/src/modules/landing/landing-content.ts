import {
  Bell,
  Bike,
  CalendarClock,
  ChartColumn,
  CreditCard,
  Layers,
  MapPin,
  Palette,
  Percent,
  QrCode,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

export type NavigationLink = {
  readonly label: string
  readonly href: string
}

export const navigationLinks: readonly NavigationLink[] = [
  { label: 'Platform', href: '#platform' },
  { label: 'Getting started', href: '#how-it-works' },
  { label: 'Everyday situations', href: '#scenarios' },
  { label: 'Questions', href: '#questions' },
]

export type Benefit = {
  readonly icon: LucideIcon
  readonly title: string
  readonly description: string
  readonly points: readonly string[]
}

export const benefits: readonly Benefit[] = [
  {
    icon: Smartphone,
    title: 'Your own branded app',
    description: 'Customers order from an app carrying your restaurant name, menu and identity.',
    points: ['Your colours and logo', 'Your menu structure', 'One app per restaurant'],
  },
  {
    icon: ShoppingBag,
    title: 'Orders in one place',
    description: 'Dine-in, takeaway and delivery orders arrive in a single queue with clear states.',
    points: ['Live order queue', 'Sold out in one tap', 'Kitchen-friendly view'],
  },
  {
    icon: ChartColumn,
    title: 'Know what is selling',
    description: 'Sales, busy hours and returning customers, without exporting anything.',
    points: ['Best and slowest sellers', 'Busiest hours by day', 'Returning customer share'],
  },
]

export type Capability = {
  readonly icon: LucideIcon
  readonly label: string
}

export const capabilities: readonly Capability[] = [
  { icon: Utensils, label: 'Dine-in' },
  { icon: ShoppingBag, label: 'Takeaway' },
  { icon: Bike, label: 'Delivery' },
  { icon: QrCode, label: 'Table QR ordering' },
  { icon: Percent, label: 'Offers and deals' },
  { icon: Layers, label: 'Combos and add-ons' },
  { icon: CalendarClock, label: 'Menu scheduling' },
  { icon: Bell, label: 'Order updates' },
  { icon: MapPin, label: 'Multiple branches' },
  { icon: Users, label: 'Repeat customers' },
  { icon: CreditCard, label: 'Flexible checkout' },
  { icon: ShieldCheck, label: 'Role-based access' },
]

export type Step = {
  readonly number: string
  readonly icon: LucideIcon
  readonly title: string
  readonly description: string
}

export const steps: readonly Step[] = [
  {
    number: '01',
    icon: Store,
    title: 'Tell us about the restaurant',
    description: 'Name, branches, cuisine and how you serve today. Nothing to install on your side.',
  },
  {
    number: '02',
    icon: Palette,
    title: 'We apply your branding',
    description: 'Your name, logo and colours are set across the app, from the first screen to the receipt.',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Go live with your menu',
    description: 'Your menu is published, orders start arriving in one place, and your customers stay yours.',
  },
]

export type PreviewRow = {
  readonly primary: string
  readonly secondary: string
  readonly trailing: string
  readonly tone: 'default' | 'active' | 'muted'
}

export type ShowcasePanel = {
  readonly value: string
  readonly label: string
  readonly icon: LucideIcon
  readonly headline: string
  readonly description: string
  readonly highlights: readonly string[]
  readonly previewTitle: string
  readonly previewRows: readonly PreviewRow[]
}

export const showcasePanels: readonly ShowcasePanel[] = [
  {
    value: 'menu',
    label: 'Menu',
    icon: Utensils,
    headline: 'One menu, edited once',
    description:
      'Change an item and the update reaches every screen a customer can order from, so the app never sells something the kitchen cannot make.',
    highlights: [
      'Categories, combos and add-ons',
      'Photos, prices and descriptions',
      'Mark an item sold out instantly',
    ],
    previewTitle: 'Menu items',
    previewRows: [
      { primary: 'Firecracker Box', secondary: 'Chicken', trailing: 'Rs 1,190', tone: 'default' },
      { primary: 'Golden Crunch Burger', secondary: 'Burgers', trailing: 'Rs 890', tone: 'default' },
      { primary: 'Buffalo Wings', secondary: 'Sides', trailing: 'Sold out', tone: 'muted' },
    ],
  },
  {
    value: 'orders',
    label: 'Orders',
    icon: ShoppingBag,
    headline: 'One queue for the whole shift',
    description:
      'Every order arrives in the same list with its own state, so the counter and the kitchen are reading the same thing.',
    highlights: [
      'New, preparing, ready, collected',
      'Dine-in, takeaway and delivery together',
      'Sound and screen alerts',
    ],
    previewTitle: 'Live orders',
    previewRows: [
      { primary: '#1048', secondary: 'Takeaway · 3 items', trailing: 'New', tone: 'active' },
      { primary: '#1047', secondary: 'Delivery · 5 items', trailing: 'Preparing', tone: 'default' },
      { primary: '#1046', secondary: 'Dine-in · Table 7', trailing: 'Ready', tone: 'default' },
    ],
  },
  {
    value: 'offers',
    label: 'Offers',
    icon: Percent,
    headline: 'Deals that end on their own',
    description:
      'Build the offer, set the dates, and let it close without anyone remembering to switch it off. The deal belongs to your restaurant.',
    highlights: ['Scheduled start and end', 'Item, category or basket deals', 'Shown where customers order'],
    previewTitle: 'Scheduled offers',
    previewRows: [
      { primary: '20% off wings', secondary: 'Tue, 4pm to 7pm', trailing: 'Running', tone: 'active' },
      { primary: 'Family box deal', secondary: 'Weekends', trailing: 'Scheduled', tone: 'default' },
      { primary: 'Ramadan menu', secondary: 'Ended 12 Apr', trailing: 'Archived', tone: 'muted' },
    ],
  },
  {
    value: 'insight',
    label: 'Insight',
    icon: ChartColumn,
    headline: 'The numbers a manager asks for',
    description:
      'What sold, when it sold and who came back. Enough to decide what to cook more of tomorrow, on one screen.',
    highlights: ['Top and slow movers', 'Busiest hours by day', 'Returning customer share'],
    previewTitle: 'Last 7 days',
    previewRows: [
      { primary: 'Orders', secondary: 'Across all branches', trailing: '412', tone: 'default' },
      { primary: 'Busiest hour', secondary: 'Friday', trailing: '8 to 9 pm', tone: 'default' },
      { primary: 'Returning customers', secondary: 'Share of orders', trailing: '38%', tone: 'active' },
    ],
  },
]

export type Scenario = {
  readonly tag: string
  readonly title: string
  readonly description: string
}

export const scenarios: readonly Scenario[] = [
  {
    tag: 'Orders',
    title: 'The Friday rush',
    description:
      'Twelve orders land in six minutes. They queue in the order they arrived, each with its own state, so nothing is cooked twice and nothing is missed.',
  },
  {
    tag: 'Availability',
    title: 'The wings run out',
    description:
      'One tap marks the item sold out. It leaves the app before the next customer can order something the kitchen cannot make.',
  },
  {
    tag: 'Offers',
    title: 'The quiet afternoon',
    description:
      'A scheduled offer opens at four and closes at seven. It runs on your terms and stops on its own when the window ends.',
  },
]

export type Question = {
  readonly question: string
  readonly answer: string
}

export const questions: readonly Question[] = [
  {
    question: 'Is this a marketplace where my restaurant is one of many?',
    answer:
      'No. Each restaurant gets its own branded app and its own customers. There is no shared listing page where a competitor sits next to you.',
  },
  {
    question: 'Do I need a technical team to run it?',
    answer:
      'No. The menu, availability, offers and orders are all handled from an ordinary phone or laptop by whoever is on shift.',
  },
  {
    question: 'What happens to my customer relationships?',
    answer:
      'They stay yours. The people who order through your app are your customers, and the ordering history belongs to your restaurant.',
  },
  {
    question: 'Can it handle more than one branch?',
    answer:
      'Yes. Branches are part of the model from the start, so menus, availability and orders can differ per location while the brand stays the same.',
  },
  {
    question: 'How much of the app can be branded?',
    answer: 'The name, logo, colours, imagery and menu language are yours. The platform stays out of the way.',
  },
  {
    question: 'What stage is the product at right now?',
    answer:
      'Rentlify Solutions is opening to a first group of restaurants. This site previews the experience, and early partners help decide what ships next.',
  },
]

export type FooterColumn = {
  readonly title: string
  readonly links: readonly NavigationLink[]
}

export const footerColumns: readonly FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Platform', href: '#platform' },
      { label: 'Getting started', href: '#how-it-works' },
      { label: 'Everyday situations', href: '#scenarios' },
    ],
  },
  {
    title: 'Restaurants',
    links: [
      { label: 'Everyday situations', href: '#scenarios' },
      { label: 'Common questions', href: '#questions' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Rentlify', href: '#contact' },
      { label: 'Pilot programme', href: '#contact' },
      { label: 'Support', href: '#contact' },
    ],
  },
]
