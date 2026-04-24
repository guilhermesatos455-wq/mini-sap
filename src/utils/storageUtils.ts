import { get as getIDB, set as setIDB, del as delIDB } from 'idb-keyval';

/**
 * Safely sets an item in localStorage with error handling for quota limits
 */
export const safeLocalStorageSet = (key: string, data: any): boolean => {
  try {
    const stringifiedData = JSON.stringify(data);
    localStorage.setItem(key, stringifiedData);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.error(`Storage limit reached while saving ${key}!`);
      return false;
    }
    console.error(`Error saving to localStorage [${key}]:`, e);
    return false;
  }
};

/**
 * Gets and parses an item from localStorage
 */
export const safeLocalStorageGet = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    try {
      return JSON.parse(item) as T;
    } catch (parseError) {
      // Fallback for raw strings stored before the JSON.stringify refactor
      // If the expected type T is string, we return the raw value
      return item as unknown as T;
    }
  } catch (e) {
    console.error(`Error reading from localStorage [${key}]:`, e);
    return defaultValue;
  }
};

/**
 * Persists heavy data to IndexedDB
 */
export const setLargeData = async (key: string, data: any): Promise<boolean> => {
  try {
    await setIDB(key, data);
    return true;
  } catch (e) {
    console.error(`Error saving to IndexedDB [${key}]:`, e);
    return false;
  }
};

/**
 * Retrieves heavy data from IndexedDB
 */
export const getLargeData = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const val = await getIDB(key);
    return (val !== undefined) ? val : defaultValue;
  } catch (e) {
    console.error(`Error reading from IndexedDB [${key}]:`, e);
    return defaultValue;
  }
};

/**
 * Deletes data from IndexedDB
 */
export const deleteLargeData = async (key: string): Promise<boolean> => {
  try {
    await delIDB(key);
    return true;
  } catch (e) {
    console.error(`Error deleting from IndexedDB [${key}]:`, e);
    return false;
  }
};
