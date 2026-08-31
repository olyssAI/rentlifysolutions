import '../config/load-environment.js'

import { databasePool } from '../database/client.js'
import { menuMediaCleanupService } from '../modules/menu/menu-media-cleanup-service.js'

try {
  const result = await menuMediaCleanupService.cleanupExpiredUploadIntents()
  console.log(JSON.stringify({ event: 'abandoned_menu_media_cleanup_completed', ...result }))
  if (result.failed > 0) process.exitCode = 1
} finally {
  await databasePool.end()
}
