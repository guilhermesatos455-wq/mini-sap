import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

/**
 * Utility to save content to a local file using Tauri dialog and FS APIs.
 * Note: This requires `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs` 
 * to be installed and configured in your Tauri backend.
 */
export async function saveFileLocally(content: string | Uint8Array, defaultName: string) {
  try {
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
