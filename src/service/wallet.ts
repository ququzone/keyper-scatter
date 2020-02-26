import * as bip39 from "bip39";
import * as scrypt from "scrypt-async";
import * as storage from "./storage";

let seed: string;

export const init = () => {
  // seed = storage.keyperStorage().get("seed");
};

export const hashPassword = (password: string) => {
  return new Promise(async (resolve) => {
    const salt = storage.getSalt();
    scrypt(password, salt, {
      N: 16384,
      r: 8,
      p: 1,
      dkLen: 16,
      encoding: "hex",
    }, (derivedKey: any) => {
      resolve(derivedKey);
    });
  });
};

export const passwordToSeed = async (password: string) => {
  const hash = await hashPassword(password);
  return hash;
};

export const createPassword = async (password: string) => {
  // @ts-ignore
  seed = await passwordToSeed(password);
  storage.keyperStorage().set("seed", seed);
};

export const getSeed = () => seed;

export const exists = () => {
  const s = storage.keyperStorage().get("seed");
  return s !== undefined;
};

export const unlock = async (password: string) => {
  const hash = await passwordToSeed(password);
  const s = storage.keyperStorage().get("seed");
  if (s === hash) {
    // @ts-ignore
    seed = hash;
    return true;
  }
  return false;
};
