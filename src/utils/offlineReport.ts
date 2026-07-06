import { isTauri } from './tauri';

export const OfflineReportGenerator = {
  async saveReportLocally(filename: string, content: string | Uint8Array) {
    if (!isTauri()) {
      console.warn('Tauri dialog/fs not available');
      return { success: false, error: 'Not in Tauri environment' };
    }
    
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');

    try {
      const filePath = await save({
        defaultPath: filename,
        filters: [{ name: 'Document', extensions: ['pdf', 'xlsx', 'json'] }]
      });

      if (filePath) {
        const dataToSave = typeof content === 'string' ? new TextEncoder().encode(content) : content;
        await writeFile(filePath, dataToSave);
        return { success: true, path: filePath };
      }
      return { success: false, cancelled: true };
    } catch (error) {
      console.error('Failed to save offline report:', error);
      return { success: false, error };
    }
  }
};
