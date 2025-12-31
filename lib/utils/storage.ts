/**
 * SSR-safe localStorage utilities
 * CANON-0011: Guard localStorage from SSR
 *
 * These utilities prevent crashes during server-side rendering by checking
 * if window and localStorage are available before accessing them.
 */

/**
 * Check if localStorage is available (client-side only)
 * @returns True if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * SSR-safe localStorage.getItem
 * @param key - The key to retrieve
 * @returns The stored value or null
 */
export function getLocalStorage(key: string): string | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error);
    return null;
  }
}

/**
 * SSR-safe localStorage.setItem
 * @param key - The key to set
 * @param value - The value to store
 * @returns True if successful
 */
export function setLocalStorage(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * SSR-safe localStorage.removeItem
 * @param key - The key to remove
 * @returns True if successful
 */
export function removeLocalStorage(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * SSR-safe localStorage.getItem with JSON parsing
 * @param key - The key to retrieve
 * @returns The parsed JSON value or null
 */
export function getLocalStorageJSON<T>(key: string): T | null {
  const value = getLocalStorage(key);
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`Failed to parse JSON from localStorage key "${key}":`, error);
    return null;
  }
}

/**
 * SSR-safe localStorage.setItem with JSON stringification
 * @param key - The key to set
 * @param value - The value to store (will be JSON stringified)
 * @returns True if successful
 */
export function setLocalStorageJSON<T>(key: string, value: T): boolean {
  try {
    const jsonString = JSON.stringify(value);
    return setLocalStorage(key, jsonString);
  } catch (error) {
    console.warn(`Failed to stringify value for localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * SSR-safe localStorage.clear
 * @returns True if successful
 */
export function clearLocalStorage(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.clear();
    return true;
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
    return false;
  }
}
