const { ipcRenderer, remote } = require("electron");
const { QueryBuilder } = require("ckb-cache-js");

const wallet = remote.getGlobal("wallet");
const cache = remote.getGlobal("cache");

const initTable = async () => {
  const accounts = wallet.accounts();
  const keys = document.getElementById("keys");
  let table = "";

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const result = await cache.findCells(
      QueryBuilder.create()
        .setLockHash(account.lock)
        .build()
    );
    table = `${table}<tr><td>${account.address}</td><td>${account.type}</td><td>${result.total}</td><td>transfer</td></tr>`
  }
  keys.innerHTML = table;
}

async function init() {
  await initTable();
  const create = document.getElementById("create");
  create.addEventListener("click", async (e) => {
    e.preventDefault();
    const password = window.document.getElementById("password").value;
    if ("" === password) {
      alert("password is empty");
      return;
    }
    const publicKey = wallet.generateKey(password);
    await cache.addRule({
      name: "LockHash",
      data: wallet.publicKeyToLockHash(publicKey),
    });
    await initTable();
  });
}

init();
