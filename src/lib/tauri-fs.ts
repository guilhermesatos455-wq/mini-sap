
import { isTauri } from '../utils/tauri';

/**
 * Utility to save content to a local file using Tauri dialog and FS APIs.
 * Note: This requires `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs` 
 * to be installed and configured in your Tauri backend.
 */
export async function saveFileLocally(content: string | Uint8Array, defaultName: string) {
  if (!isTauri()) {
    console.warn('Tauri dialog/fs not available');
    return { success: false, error: 'Not in Tauri environment' };
  }

  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile } = await import('@tauri-apps/plugin-fs');

    const filePath = await save({
      defaultPath: defaultName,
    });
    
    if (filePath) {
      const dataToSave = typeof content === 'string' ? new TextEncoder().encode(content) : content;
      await writeFile(filePath, dataToSave);
      return { success: true, path: filePath };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    console.error('Failed to save file:', error);
    return { success: false, error };
  }
}
