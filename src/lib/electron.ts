// This provides a safe way to use Electron's ipcRenderer in both web and Electron environments

type IpcRenderer = {
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, listener: (...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (...args: any[]) => void) => void;
};

let ipcRenderer: IpcRenderer | undefined;

// Try to get ipcRenderer if in Electron environment
if (typeof window !== 'undefined' && window.require) {
  try {
    ipcRenderer = window.require('electron').ipcRenderer;
  } catch (e) {
    console.warn('Electron ipcRenderer not available');
  }
}

// Safe wrapper functions
export const electronAPI = {
  send: (channel: string, ...args: any[]) => {
    if (ipcRenderer) {
      ipcRenderer.send(channel, ...args);
    } else {
      console.log(`[Web Fallback] IPC send: ${channel}`, args);
    }
  },
  on: (channel: string, listener: (...args: any[]) => void) => {
    if (ipcRenderer) {
      ipcRenderer.on(channel, listener);
    } else {
      console.log(`[Web Fallback] IPC on: ${channel}`);
    }
  },
  removeListener: (channel: string, listener: (...args: any[]) => void) => {
    if (ipcRenderer) {
      ipcRenderer.removeListener(channel, listener);
    }
  },
  isElectron: () => !!ipcRenderer
};