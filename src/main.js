const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const wallet = require("./service/wallet");

ipcMain.on("newpage", (event, page) => {
  mainWindow.loadFile(path.join(__dirname, `../html/${page}.html`));
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1024,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      //preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, "../html/loading.html"));

  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
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

wallet.init();

// @ts-ignore
global.wallet = wallet;
