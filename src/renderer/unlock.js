const { ipcRenderer, remote } = require("electron");

const wallet = remote.getGlobal("wallet");

function init() {
  const unlock = document.getElementById("unlock");
  unlock.addEventListener("click", async (e) => {
    e.preventDefault();
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

