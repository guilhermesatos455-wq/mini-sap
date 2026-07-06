import { SqliteCacheManager } from '../lib/sqliteManager';
import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export const SyncService = {
  async syncAll() {
    if (!navigator.onLine) return;

    const cachedData = await SqliteCacheManager.getAllAuditData();
    for (const item of cachedData) {
      try {
        const auditRef = doc(collection(db, 'audits'), item.id);
        await setDoc(auditRef, item.data);
        await SqliteCacheManager.deleteAuditData(item.id);
        console.log('Successfully synced item:', item.id);
      } catch (error) {
        console.error('Failed to sync item:', item.id, error);
      }
    }
  }
};
