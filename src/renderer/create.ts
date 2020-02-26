import { ipcRenderer, remote } from "electron";

// @ts-ignore
const wallet = remote.getGlobal("wallet");

function init() {
  const create = document.getElementById("create");
  create.addEventListener("click", async (e) => {
    e.preventDefault();
    // @ts-ignore
    const password = window.document.getElementById("password").value;
    if ("" === password) {
      alert("password is empty");
      return;
    }
    await wallet.createPassword(password);
    ipcRenderer.sendSync("newpage", "index");
  });
}

init();

