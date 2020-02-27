const scrypt = require("scrypt-async");
const storage = require("./storage");

let seed;

const init = () => {
  // seed = storage.keyperStorage().get("seed");
};

const hashPassword = (password) => {
  return new Promise(async (resolve) => {
    const salt = storage.getSalt();
    scrypt(password, salt, {
      N: 16384,
      r: 8,
      p: 1,
      dkLen: 16,
      encoding: "hex",
    }, (derivedKey) => {
      resolve(derivedKey);
    });
  });
};

const passwordToSeed = async (password) => {
  const hash = await hashPassword(password);
  return hash;
};

const createPassword = async (password) => {
  seed = await passwordToSeed(password);
  storage.keyperStorage().set("seed", seed);
};

const getSeed = () => seed;

const exists = () => {
  const s = storage.keyperStorage().get("seed");
  return s !== undefined;
};

const unlock = async (password) => {
  const hash = await passwordToSeed(password);
  const s = storage.keyperStorage().get("seed");
  if (s === hash) {
    seed = hash;
    return true;
  }
  return false;
};

module.exports = {
  init,
  createPassword,
  getSeed,
  unlock,
  exists
};
