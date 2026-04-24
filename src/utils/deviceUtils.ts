
import { v4 as uuidv4 } from 'uuid';
import { safeLocalStorageSet } from './storageUtils';

/**
 * Gets or creates a persistent unique ID for the current device/browser.
 * While not a true HWID (which is impossible in standard web), 
 * it provides a reliable way to track the installation.
 */
export const getDeviceId = (): string => {
  // Try to get from multiple sources to prevent easy clearing
  let deviceId = localStorage.getItem('natuassist_device_id') || 
                 document.cookie.split('; ').find(row => row.startsWith('na_did='))?.split('=')[1];
  
  if (!deviceId) {
    deviceId = `NA-${uuidv4()}`;
    safeLocalStorageSet('natuassist_device_id', deviceId);
    // Also set a long-lived cookie
    document.cookie = `na_did=${deviceId}; path=/; max-age=31536000; SameSite=Strict`;
  } else {
    // Sync back to both if one is missing
    safeLocalStorageSet('natuassist_device_id', deviceId);
    document.cookie = `na_did=${deviceId}; path=/; max-age=31536000; SameSite=Strict`;
  }
  
  return deviceId;
};

/**
 * Generates a session token for the user.
 */
export const generateUserToken = (matricula: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return btoa(`${matricula}:${timestamp}:${random}`);
};
