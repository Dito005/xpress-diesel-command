// ... (keep existing type declarations and imports)

const createSafeIpc = (): IpcMethods => {
  const ipc = getIpcRenderer();
  
  return {
    send: (channel, ...args) => {
      if (ipc) {
        ipc.send(channel, ...args);
      } else {
        console.log(`[Web] IPC send: ${channel}`, args);
      }
    },
    on: (channel, listener) => {
      if (ipc) {
        ipc.on(channel, listener);
      } else {
        console.log(`[Web] IPC on: ${channel}`);
      }
    },
    removeListener: (channel, listener) => ipc?.removeListener(channel, listener),
    isElectron: () => !!ipc
  };
};

export const electronAPI = createSafeIpc();