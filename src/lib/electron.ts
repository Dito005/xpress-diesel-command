// Extend Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (...args: any[]) => void) => void;
      removeListener: (channel: string, listener: (...args: any[]) => void) => void;
    };
  }
}

type IpcMethods = {
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, listener: (...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  isElectron: () => boolean;
};

const getIpcRenderer = (): IpcMethods | null => {
  if (typeof window === 'undefined') return null;
  
  if (window.electronAPI) {
    return {
      ...window.electronAPI,
      isElectron: () => true
    };
  }

  if (window.require) {
    try {
      const ipc = window.require('electron').ipcRenderer;
      return {
        send: ipc.send.bind(ipc),
        on: ipc.on.bind(ipc),
        removeListener: ipc.removeListener.bind(ipc),
        isElectron: () => true
      };
    } catch (e) {
      console.warn('Electron ipcRenderer not available');
    }
  }

  return null;
};

const createSafeIpc = (): IpcMethods => {
  const ipc = getIpcRenderer();
  
  return {
    send: (channel, ...args) => {
      if (ipc) ipc.send(channel, ...args);
      else console.log(`[Web] IPC send: ${channel}`, args);
    },
    on: (channel, listener) => {
      if (ipc) ipc.on(channel, listener);
      else console.log(`[Web] IPC on: ${channel}`);
    },
    removeListener: (channel, listener) => ipc?.removeListener(channel, listener),
    isElectron: () => !!ipc
  };
};

export const electronAPI = createSafeIpc();