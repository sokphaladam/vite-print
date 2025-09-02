import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { createPrintJob } from "./render";
import type { PosPrintData, PosPrintOptions } from "electron-pos-printer";

ipcMain.handle(
  "node-version",
  (event: IpcMainInvokeEvent, msg: string): string => {
    console.log(event);
    console.log(msg);

    return process.versions.node;
  }
);

ipcMain.handle(
  "process-message",
  (event: IpcMainInvokeEvent, msg: string): string => {
    console.log(event);
    console.log(msg);

    return `Received your message: ${msg}`;
  }
);

ipcMain.handle(
  "create-print-job",
  async (
    event: IpcMainInvokeEvent,
    data: PosPrintData[],
    option: PosPrintOptions
  ) => {
    console.log(event);
    console.log(data);
    console.log(option);

    return await createPrintJob(data, option);
  }
);
