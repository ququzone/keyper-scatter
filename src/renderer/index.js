const { ipcRenderer, remote } = require("electron");

const wallet = remote.getGlobal("wallet");

function initTable() {
  const accounts = wallet.accounts();
  const keys = document.getElementById("keys");
  let table = "";
  accounts.forEach(account => {
    table = `${table}<tr><td>${account.address}</td><td>${account.lock}</td><td>transfer</td></tr>`
  });
  keys.innerHTML = table;
}

function init() {
  initTable();
  const create = document.getElementById("create");
  create.addEventListener("click", async (e) => {
    e.preventDefault();
    const password = window.document.getElementById("password").value;
    if ("" === password) {
      alert("password is empty");
      return;
    }
    wallet.generateKey(password);
    initTable();
  });
}

init();
