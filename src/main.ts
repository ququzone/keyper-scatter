import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";

ipcMain.on("newpage", (event, page) => {
  mainWindow.loadFile(path.join(__dirname, "../html/index.html"));
});

let mainWindow: Electron.BrowserWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
    width: 800,
  });

  mainWindow.loadFile(path.join(__dirname, "../html/loading.html"));

  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
