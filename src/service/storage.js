const Store = require("electron-store");

const KEYPER_DATA_NAME = "keyper";

const stores = {};

const getStore = (name) => {
  if (!stores.hasOwnProperty(name)) {
    stores[name] = new Store({ name});
  }

  return stores[name];
};

const keyperStorage = () => getStore(KEYPER_DATA_NAME);

const getSalt = () => {
  return keyperStorage().get("salt") || "SALT_ME";
};

module.exports = {
  getStore,
  keyperStorage,
  getSalt,
};
