// A simple utility to handle Electron's contextBridge safely

interface ElectronAPI {
  isElectron: () => boolean;
  send: (channel: string, data?: any) => void;
  on: (channel: string, func: (...args: any[]) => void) => void;
  removeListener: (channel: string, func: (...args: any[]) => void) => void;
}

// This will be exposed on the window object by the preload script in Electron
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// A safe wrapper around the potentially undefined window.electronAPI
// This prevents errors when running in a standard browser environment.
export const electronAPI: ElectronAPI = {
  isElectron: () => window.electronAPI?.isElectron?.() ?? false,
  send: (channel, data) => window.electronAPI?.send?.(channel, data),
  on: (channel, func) => window.electronAPI?.on?.(channel, func),
  removeListener: (channel, func) => window.electronAPI?.removeListener?.(channel, func),
};