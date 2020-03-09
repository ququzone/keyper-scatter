const { ipcRenderer, remote } = require("electron");
const BN = require('bn.js');
const { scriptToHash } = require("@nervosnetwork/ckb-sdk-utils/lib");
const { addressToScript } = require("@keyper/specs");
const { QueryBuilder } = require("ckb-cache-js");
const WebSocket = require('ws');

const wallet = remote.getGlobal("wallet");
const cache = remote.getGlobal("cache");
const HighLevelSockets = remote.getGlobal("HighLevelSockets");

const initTable = async () => {
  const accounts = wallet.accounts();
  const keys = document.getElementById("keys");
  let table = "";

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const result = await cache.findCells(
      JSON.stringify(
        QueryBuilder.create()
          .setLockHash(account.lock)
          .build()
      )
    );
    table = `${table}<tr><td>${account.address}</td><td>${account.type}</td><td>${result.total}</td><td><button class="pure-button" onclick="transfer(this)" data="${account.address}">Transfer</button></td></tr>`
  }
  keys.innerHTML = table;
}

async function transfer(e) {
  const toAddress = window.document.getElementById("transfer-to").value;
  const toAmount = window.document.getElementById("transfer-amount").value;
  if ("" === toAddress || "" === toAmount) {
    alert("inputs empty");
    return;
  }
  const total = new BN(toAmount).add(new BN("1000"));
  const lock = addressToScript(e.getAttribute("data"));
  const toLock = addressToScript(toAddress);
  const query = QueryBuilder.create()
    .setLockHash(scriptToHash(lock))
    .setTypeCodeHash("null")
    .setData("0x")
    .setCapacity(total.toString())
    .build();
  query.capacityFetcher = undefined;
  query.capacity = total.toString();
  const cells = await cache.findCells(JSON.stringify(query));
  if (cells.total.lt(total)) {
    alert("insufficient balance");
    return;
  }
  const rawTx = {
    version: "0x0",
    cellDeps: [{
      outPoint: {
        txHash: "0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890",
        index: "0x0"
      },
      depType: "depGroup",
    }],
    headerDeps: [],
    inputs: [],
    outputs: [],
    witnesses: [],
    outputsData: []
  };
  rawTx.outputs.push({
    capacity: `0x${new BN(toAmount).toString(16)}`,
    lock: toLock,
  });
  rawTx.outputsData.push("0x");
  for (let i = 0; i < cells.cells.length; i++) {
    const element = cells.cells[i];

    rawTx.inputs.push({
      previousOutput: {
        txHash: element.txHash,
        index: element.index,
      },
      since: "0x0",
    });
    rawTx.witnesses.push("0x");
  }
  rawTx.witnesses[0] = {
    lock: "",
    inputType: "",
    outputType: "",
  };
  if (cells.total.gt(total) && cells.total.sub(total).gt(new BN("6100000000"))) {
    rawTx.outputs.push({
      capacity: `0x${cells.total.sub(total).toString(16)}`,
      lock: lock
    });
    rawTx.outputsData.push("0x");
  }

  const signObj = {
    target: e.getAttribute("data"),
    tx: rawTx,
  }

  const ws = new WebSocket('ws://localhost:50001');
  ws.on('open', function open() {
    ws.send(`42/scatter,["api", {"data": {"origin": "localhost", "payload":${JSON.stringify(signObj)}}, "type":"sign"}]`);
  });

  ws.on('message', function incoming(data) {
    console.log(data);
  });
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

ipcRenderer.on('popup-sign', function(event, message){
  const modal = document.getElementById("sign-modal");
  modal.style.opacity = 30;
  modal.style.visibility = "visible";
  const reject = document.getElementById("reject");
  reject.addEventListener("click", async (e) => {
    e.preventDefault();
    HighLevelSockets.sendEvent("REJECT_SIGN", "user reject sign", message.origin);
    modal.style.opacity = 0;
    modal.style.visibility = "hidden";
  });
  const sign = document.getElementById("sign");
  sign.addEventListener("click", async (e) => {
    e.preventDefault();
    const password = window.document.getElementById("sign-password").value;
    if ("" === password) {
      alert("password is empty");
      return;
    }

    const signObj = message.payload;
    const tx = await wallet.signTx(signObj.target, password, signObj.tx);
    console.log(JSON.stringify(tx));

    modal.style.opacity = 0;
    modal.style.visibility = "hidden";
  });
});
