const { ipcRenderer, remote } = require("electron");
const BN = require('bn.js');
const { scriptToHash } = require("@nervosnetwork/ckb-sdk-utils/lib");
const { addressToScript } = require("@keyper/specs");
const { QueryBuilder } = require("ckb-cache-js");
const WebSocket = require('ws');

const wallet = remote.getGlobal("wallet");
const cache = remote.getGlobal("cache");
const HighLevelSockets = remote.getGlobal("HighLevelSockets");
let socketMessage;

const initTable = async () => {
  const accounts = await wallet.accounts();
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
    table = `${table}<tr><td>${account.address}</td><td>${account.type}</td><td>${result.total}</td><td><button class="pure-button" onclick="transfer(this)" data="${account.address}">Transfer</button><button class="pure-button" onclick="transferAny(this)" data="${account.address}">Transfer Any</button><button class="pure-button" onclick="createUDTAny(this)" data="${account.address}">Create UDT Any</button></td></tr>`
  }
  keys.innerHTML = table;
}

async function transferAny(e) {
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

  const anyQuery = QueryBuilder.create()
    .setLockHash(scriptToHash(toLock))
    .setTypeCodeHash("null")
    .setData("0x")
    .build();
  anyQuery.capacityFetcher = undefined;
  const anycells = await cache.findCells(JSON.stringify(anyQuery));
  if (anycells.cells.length == 0) {
    alert("no any cell balance");
    return;
  }
  const rawTx = {
    version: "0x0",
    cellDeps: [{
      outPoint: {
        txHash: "0x9af66408df4703763acb10871365e4a21f2c3d3bdc06b0ae634a3ad9f18a6525",
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
    capacity: `0x${new BN(toAmount).add(new BN(anycells.cells[0].capacity.slice(2), 16)).toString(16)}`,
    lock: toLock,
  });
  rawTx.outputsData.push("0x");
  rawTx.inputs.push({
    previousOutput: {
      txHash: anycells.cells[0].txHash,
      index: anycells.cells[0].index,
    },
    since: "0x0",
  });
  rawTx.witnesses.push("0x");
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
  rawTx.witnesses[1] = {
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
    target: scriptToHash(lock),
    tx: rawTx,
    config: {index: 1, length: rawTx.witnesses.length-1}
  }

  const ws = new WebSocket('ws://localhost:50001');
  ws.on('open', function open() {
    ws.send(`42/keyper,["api", {"data": {"origin": "localhost", "payload":${JSON.stringify(signObj)}}, "type":"sign"}]`);
  });

  ws.on('message', function incoming(data) {
    console.log(data);
  });
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
    cellDeps: [],
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
    target: scriptToHash(lock),
    tx: rawTx,
  }

  const ws = new WebSocket('ws://localhost:50001');
  ws.on('open', function open() {
    ws.send(`42/keyper,["api", {"data": {"origin": "localhost", "payload":${JSON.stringify(signObj)}}, "type":"sign"}]`);
  });

  ws.on('message', function incoming(data) {
    console.log(data);
  });
}

async function createUDTAny(e) {
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
        txHash: "0x0e7153f243ba4c980bfd7cd77a90568bb70fd393cb572b211a2f884de63d103d",
        index: "0x0"
      },
      depType: "code",
    }],
    headerDeps: [],
    inputs: [],
    outputs: [],
    witnesses: [],
    outputsData: []
  };
  rawTx.outputs.push({
    capacity: `0x${new BN(toAmount).toString(16)}`,
    type: {
      args: "0x6a242b57227484e904b4e08ba96f19a623c367dcbd18675ec6f2a71a0ff4ec26",
      codeHash: "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
      hashType: "data"
    },
    lock: toLock,
  });
  rawTx.outputsData.push(`0x${new BN(0).toBuffer("le", 16).toString("hex")}`);
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
    target: scriptToHash(lock),
    tx: rawTx,
  }

  const ws = new WebSocket('ws://localhost:50001');
  ws.on('open', function open() {
    ws.send(`42/keyper,["api", {"data": {"origin": "localhost", "payload":${JSON.stringify(signObj)}}, "type":"sign"}]`);
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
    await wallet.generateKey(password);
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

    await wallet.importKey(key, password);
    await initTable();
  });

  const reload = document.getElementById("reload");
  reload.addEventListener("click", async (e) => {
    e.preventDefault();
    await initTable();
  });

  const modal = document.getElementById("sign-modal");
  const reject = document.getElementById("reject");
  reject.addEventListener("click", async (e) => {
    e.preventDefault();
    HighLevelSockets.sendEvent("REJECT_SIGN", "user reject sign", socketMessage.origin);
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

    const signObj = socketMessage.payload;
    let config = {index: 0, length: -1};
    if (signObj.config) {
      config = signObj.config;
    }
    const tx = await wallet.signTx(signObj.target, password, signObj.tx, config);
    const hash = await cache.sendTx(tx);
    HighLevelSockets.sendEvent("SEND_TX", hash, socketMessage.origin);

    modal.style.opacity = 0;
    modal.style.visibility = "hidden";
  });
}

init();

ipcRenderer.on('popup-sign', function(event, message) {
  const modal = document.getElementById("sign-modal");
  modal.style.opacity = 30;
  modal.style.visibility = "visible";
  socketMessage = message;
});
