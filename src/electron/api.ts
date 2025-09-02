import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { requestDatabase } from "src/server/request-api";

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
  "login",
  async (event: IpcMainInvokeEvent, username: string, password: string) => {
    console.log(`Login attempt: ${username}, ${password}`);

    const response = await requestDatabase(
      "http://localhost:3000/api/auth/login",
      "POST",
      {
        username,
        password,
      }
    );

    return response;
  }
);
