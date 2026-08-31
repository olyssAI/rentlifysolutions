declare global {
  namespace Express {
    interface Locals {
      session?: {
        user: { id: string; role?: unknown; email?: string; name?: string }
      }
      restaurantId?: string
      restaurantMembership?: {
        membershipId: string
        restaurantId: string
        membershipRole: string
        isPrimary: boolean
        restaurantName: string
        restaurantStatus: string
      }
    }
  }
}

export {}
