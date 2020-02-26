import { ipcRenderer, remote } from "electron";

// @ts-ignore
const wallet = remote.getGlobal("wallet");

async function init() {
  if (!wallet.exists()) {
    ipcRenderer.sendSync("newpage", "create");
  } else {
    if (wallet.getSeed()) {
      ipcRenderer.sendSync("newpage", "index");
    } else {
      ipcRenderer.sendSync("newpage", "unlock");
    }
  }
}

init();

