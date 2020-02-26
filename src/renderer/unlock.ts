import { ipcRenderer, remote } from "electron";

// @ts-ignore
const wallet = remote.getGlobal("wallet");

function init() {
  const unlock = document.getElementById("unlock");
  unlock.addEventListener("click", async (e) => {
    e.preventDefault();
    // @ts-ignore
    const password = window.document.getElementById("password").value;
    if ("" === password) {
      alert("password is empty");
      return;
    }
    const success = await wallet.unlock(password);
    if (success) {
      ipcRenderer.sendSync("newpage", "index");
    } else {
      alert("password error");
    }
  });
}

init();

