import { app, BrowserWindow, nativeImage } from "electron";
import { join } from "path";
import { WebSocketServer } from "ws";
import cron from "node-cron";

// 1. this import won't work yet, but we will fix that next
import "./api";
import { printJob } from "./render";

// 2. simple check if we are running in dev / preview / production
const isDev = process.env.DEV != undefined;
const isPreview = process.env.PREVIEW != undefined;

let mainWindow: BrowserWindow | null = null;

app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true,
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    // ^^^^ make sure this port
    // matches the port used when
    // you run 'yarn run vite'
    mainWindow.webContents.openDevTools();
  } else if (isPreview) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }
}

// Run cron job every minute
cron.schedule("*/15 * * * * *", () => {
  console.log("⏰ Running every 15 seconds:", new Date().toISOString());
  // Example: send message to renderer
  if (mainWindow) {
    mainWindow.webContents.send("cron-event", { time: new Date() });
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  const wss = new WebSocketServer({ port: 8080 });

  console.log("WebSocket server running on ws://localhost:8080");

  wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.send("Welcome from Electron!");

    ws.on("message", async (msg) => {
      console.log("Received:", msg.toString());
      ws.send(`Echo: ${msg.toString()}`);
      // Send message to renderer process via IPC
      mainWindow?.webContents.send("ws-message", msg.toString());
      const data = JSON.parse(msg.toString());
      printJob(data, data.printer, mainWindow!);
    });
  });

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
