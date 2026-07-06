
import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Utility to manage and listen to window-level events.
 */
export function setupWindowEventListeners(
  onMinimize: () => void,
  onMaximize: () => void,
  onClose: () => void
) {
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    return;
  }

  const appWindow = getCurrentWindow();

  appWindow.listen('tauri://minimized', () => {
    console.log('Window minimized');
    onMinimize();
  });

  appWindow.listen('tauri://maximized', () => {
    console.log('Window maximized');
    onMaximize();
  });

  // Example: handle close attempt
  appWindow.listen('tauri://close-requested', () => {
    console.log('Close requested');
    onClose();
  });
}
