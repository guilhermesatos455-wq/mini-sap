import { isTauri } from '../utils/tauri';

let db: any = null;

async function getDb() {
  if (!isTauri()) {
    console.warn('Tauri SQL plugin not available');
    return null;
  }
  if (!db) {
    const { default: Database } = await import('@tauri-apps/plugin-sql');
    db = await Database.load('sqlite:mini-sap-audit.db');
    await db.execute('CREATE TABLE IF NOT EXISTS audit_cache (id TEXT PRIMARY KEY, data TEXT, timestamp INTEGER)');
  }
  return db;
}

export const SqliteCacheManager = {
  async saveAuditData(id: string, data: any) {
    const db = await getDb();
    if (!db) return;
    const timestamp = Date.now();
    await db.execute('INSERT OR REPLACE INTO audit_cache (id, data, timestamp) VALUES ($1, $2, $3)', [
      id,
      JSON.stringify(data),
      timestamp,
    ]);
  },

  async getAuditData(id: string) {
    const db = await getDb();
    if (!db) return null;
    const result: any[] = await db.select('SELECT data FROM audit_cache WHERE id = $1', [id]);
    return result.length > 0 ? JSON.parse(result[0].data) : null;
  },

  async getAllAuditData() {
    const db = await getDb();
    if (!db) return [];
    const result: any[] = await db.select('SELECT data, id FROM audit_cache');
    return result.map((item: any) => ({ id: item.id, data: JSON.parse(item.data) }));
  },

  async deleteAuditData(id: string) {
    const db = await getDb();
    if (!db) return;
    await db.execute('DELETE FROM audit_cache WHERE id = $1', [id]);
  }
};
