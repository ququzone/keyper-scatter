import * as Store from "electron-store";

const KEYPER_DATA_NAME = "keyper";

const stores = {};

export const getStore = (name: string) => {
  if (!stores.hasOwnProperty(name)) {
    // @ts-ignore
    stores[name] = new Store({ name});
  }

  // @ts-ignore
  return stores[name];
};

export const keyperStorage = () => getStore(KEYPER_DATA_NAME);

export const getSalt = () => {
  return keyperStorage().get("salt") || "SALT_ME";
};

