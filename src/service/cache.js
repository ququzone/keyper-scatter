const { app } = require("electron");
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
  await cache.reset();
};

module.exports = {
  start,
  addRule,
  reset,
};
