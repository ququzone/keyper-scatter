const { ipcRenderer, remote } = require("electron");

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

