const { app } = require("electron");
const BN = require('bn.js');
const CKB = require("@nervosnetwork/ckb-sdk-core").default;
const { DefaultCacheService, initConnection } = require("ckb-cache-js");

let cache;

const start = (nodeUrl = "http://localhost:8114") => {
  initConnection({
    "type": "sqlite",
    "database": `${app.getPath('userData')}/keyper.sqlite`,
    "synchronize": true,
    "logging": false,
    "entities": [
      "node_modules/ckb-cache-js/lib/database/entity/*.js"
    ]
  }).then(() => {
    const ckb = new CKB(nodeUrl);
    cache = new DefaultCacheService(ckb);
    cache.start();
  });
};

const addRule = async (rule) => {
  await cache.addRule(rule);
};

const reset = async () => {
  await cache.resetStartBlockNumber("1");
};

const findCells = async (q) => {
  const query = JSON.parse(q);
  query.capacityFetcher = (cell) => {
    return new BN(cell.capacity.slice(2), 16);
  }
  if (query.capacity) {
    query.capacity = new BN(query.capacity);
  }
  return await cache.findCells(query);
}

module.exports = {
  start,
  addRule,
  reset,
  findCells,
};
