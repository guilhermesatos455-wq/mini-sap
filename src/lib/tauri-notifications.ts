
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

/**
 * Utility to send a desktop notification using Tauri.
 * Ensures permissions are requested if not already granted.
 */
export async function sendAuditNotification(title: string, body: string) {
  // Check if running in Tauri environment
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    console.log('Not in Tauri, skipping notification:', title, body);
    return;
  }

  try {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }

    if (permissionGranted) {
      sendNotification({ title, body });
    }
  } catch (error) {
    console.error('Failed to send Tauri notification:', error);
  }
}
