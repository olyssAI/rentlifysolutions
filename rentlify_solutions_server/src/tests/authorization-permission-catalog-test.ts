import assert from 'node:assert/strict'

import { permissionKeys, permissionsForRole, roleHasPermission } from '../modules/authorization/permission-catalog.js'
import { roles } from '../modules/authentication/roles.js'

assert.deepEqual(permissionsForRole(roles.platformUser), [])
assert.deepEqual(permissionsForRole('UNKNOWN_ROLE'), [])
assert.deepEqual(permissionsForRole(null), [])

assert.equal(roleHasPermission(roles.superAdministrator, permissionKeys.platformRestaurantsManage), true)
assert.equal(roleHasPermission(roles.superAdministrator, permissionKeys.restaurantProfileManage), false)
assert.equal(roleHasPermission(roles.superAdministrator, permissionKeys.restaurantMenuManage), false)
assert.equal(roleHasPermission(roles.restaurantOwner, permissionKeys.restaurantProfileManage), true)
assert.equal(roleHasPermission(roles.restaurantOwner, permissionKeys.platformRestaurantsManage), false)
assert.equal(roleHasPermission(roles.platformUser, permissionKeys.restaurantDashboardRead), false)

console.info('Authorization permission catalog test passed: known grants resolve and unknown roles deny by default.')
