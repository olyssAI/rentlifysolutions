import { createAuthentication } from '../authentication/authentication.js'
import { isAPIError } from 'better-auth/api'
import { roles } from '../authentication/roles.js'
import { HttpError } from '../http/http-error.js'
import { restaurantOwnerRepository } from './restaurant-owner-repository.js'
import type { ProvisionRestaurantOwnerInput } from './restaurant-owner-validation.js'

export const restaurantOwnerService = {
  listOwners: async (restaurantId: string) => {
    if (!(await restaurantOwnerRepository.findRestaurantById(restaurantId))) {
      throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'The restaurant could not be found.')
    }
    return restaurantOwnerRepository.listOwners(restaurantId)
  },

  provisionPrimaryOwner: async (restaurantId: string, input: ProvisionRestaurantOwnerInput) => {
    if (!(await restaurantOwnerRepository.findRestaurantById(restaurantId))) {
      throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'The restaurant could not be found.')
    }
    if (await restaurantOwnerRepository.findPrimaryOwnerForRestaurant(restaurantId)) {
      throw new HttpError(409, 'PRIMARY_OWNER_EXISTS', 'This restaurant already has a primary owner.')
    }
    const existingProvisioning = await restaurantOwnerRepository.findPrimaryOwnerProvisioning(restaurantId)
    const emailProvisioning = await restaurantOwnerRepository.findOwnerProvisioningByEmail(input.email)
    if (emailProvisioning && emailProvisioning.restaurantId !== restaurantId) {
      throw new HttpError(409, 'ACCOUNT_EMAIL_UNAVAILABLE', 'An account cannot be created with this email address.')
    }
    let account = await restaurantOwnerRepository.findUserByEmail(input.email)
    if (account && !existingProvisioning) {
      throw new HttpError(409, 'ACCOUNT_EMAIL_UNAVAILABLE', 'An account cannot be created with this email address.')
    }

    const provisioning =
      existingProvisioning ?? (await restaurantOwnerRepository.beginPrimaryOwnerProvisioning(restaurantId, input.email))
    if (provisioning.normalizedEmail !== input.email || provisioning.state !== 'PENDING') {
      throw new HttpError(
        409,
        'OWNER_PROVISIONING_CONFLICT',
        'The pending owner invitation does not match this request.',
      )
    }

    const provisioningAuthentication = createAuthentication({ allowAccountCreation: true })
    try {
      if (!account) {
        try {
          const result = await provisioningAuthentication.api.signUpEmail({ body: input })
          account = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: roles.platformUser,
          }
        } catch (error) {
          account = await restaurantOwnerRepository.findUserByEmail(input.email)
          if (!account && isAPIError(error)) {
            const accountEmailWasRejected =
              error.body?.code === 'USER_ALREADY_EXISTS' ||
              error.body?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ||
              error.body?.code === 'INVALID_EMAIL'
            throw new HttpError(
              400,
              'OWNER_ACCOUNT_CREATION_REJECTED',
              'Review the highlighted account detail and try again.',
              undefined,
              accountEmailWasRejected
                ? [{ path: 'email', message: 'Use a different valid email address for this owner.' }]
                : [{ path: 'password', message: 'Enter a different password that meets every security requirement.' }],
            )
          }
          if (!account) throw error
        }
      }
      if (account.role !== roles.platformUser && account.role !== roles.restaurantOwner) {
        throw new HttpError(409, 'ACCOUNT_EMAIL_UNAVAILABLE', 'An account cannot be created with this email address.')
      }
      const existingMembership = await restaurantOwnerRepository.findMembershipForUser(account.id)
      if (existingMembership) {
        throw new HttpError(409, 'ACCOUNT_EMAIL_UNAVAILABLE', 'An account cannot be created with this email address.')
      }
      const membership = await restaurantOwnerRepository.grantPrimaryOwnership(
        restaurantId,
        account.id,
        roles.restaurantOwner,
      )
      return {
        membershipId: membership.id,
        userId: account.id,
        name: account.name,
        email: account.email,
        isPrimary: true,
      }
    } catch (error) {
      if (error instanceof HttpError) throw error
      throw new HttpError(
        409,
        'OWNER_PROVISIONING_PENDING',
        'Owner provisioning did not finish. Submit the same email again to safely resume it.',
      )
    }
  },

  revokeOwner: async (restaurantId: string, membershipId: string, actingUserId: string) => {
    const membership = await restaurantOwnerRepository.findMembershipInRestaurant(restaurantId, membershipId)
    if (!membership) {
      throw new HttpError(404, 'OWNER_MEMBERSHIP_NOT_FOUND', 'This restaurant owner could not be found.')
    }
    if (membership.userId === actingUserId) {
      throw new HttpError(409, 'OWNER_SELF_REVOCATION', 'You cannot revoke your own restaurant access.')
    }

    const result = await restaurantOwnerRepository.revokeMembership(membershipId, membership.userId, roles.platformUser)

    return {
      membershipId,
      userId: membership.userId,
      email: membership.email,
      name: membership.name,
      downgradedRole: result.downgradedRole,
    }
  },

  getPrimaryContext: async (userId: string) => {
    const memberships = await restaurantOwnerRepository.listMembershipsByUserId(userId)
    const membership = memberships[0]
    if (!membership)
      throw new HttpError(403, 'RESTAURANT_ACCESS_REQUIRED', 'No restaurant access is assigned to this account.')
    if (memberships.length > 1) {
      throw new HttpError(
        409,
        'RESTAURANT_SELECTION_REQUIRED',
        'Select a restaurant before continuing with this account.',
      )
    }
    return membership
  },
}
