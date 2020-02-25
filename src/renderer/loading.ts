import { ipcRenderer } from "electron";

ipcRenderer.sendSync("newpage", "index");
