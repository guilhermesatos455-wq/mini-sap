import { get, set, del, keys } from 'idb-keyval';
import { isTauri } from '../utils/tauri';

const SYNC_QUEUE_KEY = 'offline-sync-queue';

export const OfflineSyncManager = {
  async queueAction(action: { type: string; payload: any; timestamp: number }) {
    const queue = await get(SYNC_QUEUE_KEY) || [];
    queue.push(action);
    await set(SYNC_QUEUE_KEY, queue);
  },

  async syncToFirestore(syncFn: (item: any) => Promise<void>) {
    if (!isTauri()) return;
    const queue = await get(SYNC_QUEUE_KEY) || [];
    if (queue.length === 0) return;

    for (const action of queue) {
      try {
        await syncFn(action.payload);
        // Remove item from queue after successful sync
        const updatedQueue = (await get(SYNC_QUEUE_KEY) || []).filter((a: any) => a.timestamp !== action.timestamp);
        await set(SYNC_QUEUE_KEY, updatedQueue);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        break; // Stop syncing on error to maintain order
      }
    }
  }
};
