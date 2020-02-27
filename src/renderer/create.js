const { ipcRenderer, remote } = require("electron");

const wallet = remote.getGlobal("wallet");

function init() {
  const create = document.getElementById("create");
  create.addEventListener("click", async (e) => {
    e.preventDefault();
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

