// Add type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (...args: any[]) => void) => void;
      removeListener: (channel: string, listener: (...args: any[]) => void) => void;
    };
  }
}

type IpcRenderer = {
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, listener: (...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (...args: any[]) => void) => void;
};

const safeIpc: IpcRenderer = {
  send: () => {},
  on: () => {},
  removeListener: () => {}
};

const getIpcRenderer = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    if (window.require) {
      return window.require('electron').ipcRenderer;
    }
    if (window.electronAPI) {  // Now properly typed
      return window.electronAPI;
    }
  } catch (e) {
    console.warn('Electron ipcRenderer not available');
  }
  return null;
};

const ipcRenderer = getIpcRenderer() || safeIpc;

export const electronAPI = {
  send: ipcRenderer.send.bind(ipcRenderer),
  on: ipcRenderer.on.bind(ipcRenderer),
  removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
  isElectron: () => !!getIpcRenderer()
};