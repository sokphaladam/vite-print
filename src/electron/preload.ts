import { contextBridge, ipcRenderer } from "electron";
import type { PosPrintData, PosPrintOptions } from "electron-pos-printer";

export const backend = {
  nodeVersion: async (msg: string): Promise<string> =>
    await ipcRenderer.invoke("node-version", msg),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMain: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  },
  login: async (username: string, password: string): Promise<string> => {
    return await ipcRenderer.invoke("login", username, password);
  },
  onCronEvent: (callback: (data: unknown) => void) => {
    ipcRenderer.on("cron-event", (_, data) => callback(data));
  },
  printJob: async (
    data: PosPrintData[],
    option: PosPrintOptions
  ): Promise<string> => {
    return await ipcRenderer.invoke("create-print-job", data, option);
  },
};

contextBridge.exposeInMainWorld("backend", backend);
