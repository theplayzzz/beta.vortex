import { clerkClient } from '@clerk/nextjs/server'

/**
 * Função helper para sincronização manual de metadata do Clerk
 */
export async function syncUserMetadata(clerkId: string, userId: string, approvalStatus: string) {
  try {
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        approvalStatus,
        dbUserId: userId,
        lastSyncedAt: new Date().toISOString()
      }
    })
    
    console.log(`[METADATA_SYNC] Manual sync completed for user: ${clerkId}`)
    return true
  } catch (error) {
    console.error(`[METADATA_SYNC_ERROR] Failed to sync metadata for user ${clerkId}:`, error)
    return false
  }
} 