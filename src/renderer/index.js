const { ipcRenderer, remote, clipboard } = require("electron");
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
    table = `${table}<tr><td>${account.address}</td><td>${account.type}</td><td>${result.total}</td><td><button class="pure-button" onclick="transfer(this)" data="${account.address}">Transfer</button></td></tr>`
  }
  keys.innerHTML = table;
}

function transfer(e) {
  console.log(e.getAttribute("data"));
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

  const imp = document.getElementById("import");
  imp.addEventListener("click", async (e) => {
    e.preventDefault();
    const password = window.document.getElementById("import-password").value;
    if ("" === password) {
      alert("password is empty");
      return;
    }
    const key = window.document.getElementById("import-key").value;
    if ("" === key) {
      alert("private key is empty");
      return;
    }

    const publicKey = wallet.importKey(key, password);
    await cache.addRule({
      name: "LockHash",
      data: wallet.publicKeyToLockHash(publicKey),
    });
    await cache.reset();
    await initTable();
  });

  const reload = document.getElementById("reload");
  reload.addEventListener("click", async (e) => {
    e.preventDefault();
    await initTable();
  });
}

init();
