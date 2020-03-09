const scrypt = require("scrypt.js");
const EC = require("elliptic").ec;
const { Secp256k1LockScript } = require("@keyper/container/lib/locks/secp256k1");
const { scriptToHash, hexToBytes } = require("@nervosnetwork/ckb-sdk-utils/lib");
const { scriptToAddress } = require("@keyper/specs/lib/address");
const keystore = require("@keyper/specs/lib/keystore");
const storage = require("./storage");

let seed, keys, secp256k1Lock;

const init = () => {
  secp256k1Lock = new Secp256k1LockScript();
  keys = {};
  reloadKeys();
};

const reloadKeys = () => {
  if (storage.keyperStorage().get("keys")) {
    const innerKeys = storage.keyperStorage().get("keys");
    innerKeys.forEach(key => {
      const script = secp256k1Lock.script(`0x${key.publicKey}`);
      keys[scriptToAddress(script, {networkPrefix: "ckt", short: true})] = {
        key,
        script,
        lock: scriptToHash(script),
        type: secp256k1Lock.name,
      };
    });
  }
};

const hashPassword = (password) => {
  const salt = storage.getSalt();
  return scrypt(password, salt, 16384, 8, 1, 16);
};

const passwordToSeed = (password) => {
  const hash = hashPassword(password);
  return hash;
};

const createPassword = async (password) => {
  seed = await passwordToSeed(password);
  storage.keyperStorage().set("seed", seed.toString("hex"));
};

const getSeed = () => seed;

const exists = () => {
  const s = storage.keyperStorage().get("seed");
  return s !== undefined;
};

const unlock = async (password) => {
  const hash = passwordToSeed(password).toString("hex");
  const s = storage.keyperStorage().get("seed");
  if (s === hash) {
    seed = hash;
    return true;
  }
  return false;
};

const generateKey = (password) => {
  const ec = new EC('secp256k1');
  const key = ec.genKeyPair();
  const publicKey = Buffer.from(key.getPublic().encodeCompressed()).toString("hex");
  const privateKey = key.getPrivate();
  const ks = keystore.encrypt(privateKey.toBuffer(), password);
  ks.publicKey = publicKey;

  if (!storage.keyperStorage().get("keys")) {
    storage.keyperStorage().set("keys", [ks]);
  } else {
    const keys = storage.keyperStorage().get("keys");
    keys.push(ks);
    storage.keyperStorage().set("keys", keys);
  }
  reloadKeys();
  return publicKey;
};

const importKey = (privateKey, password) => {
  const ec = new EC('secp256k1');
  const key = ec.keyFromPrivate(privateKey);
  const publicKey = Buffer.from(key.getPublic().encodeCompressed()).toString("hex");
  const ks = keystore.encrypt(Buffer.from(privateKey, "hex"), password);
  ks.publicKey = publicKey;

  if (!storage.keyperStorage().get("keys")) {
    storage.keyperStorage().set("keys", [ks]);
  } else {
    const keys = storage.keyperStorage().get("keys");
    keys.push(ks);
    storage.keyperStorage().set("keys", keys);
  }
  reloadKeys();
  return publicKey;
};

const accounts = () => {
  const result = [];
  for (const address in keys) {
    result.push({
      address,
      type: keys[address].type,
      lock: keys[address].lock,
      amount: 0,
    });
  }
  return result;
}

const publicKeyToLockHash = (publicKey) => {
  const script = secp256k1Lock.script(`0x${publicKey}`);
  return scriptToHash(script);
}

const signTx = async (address, password, rawTx) => {
  const key = keys[address];
  if (!key) {
    throw new Error(`no key for address: ${address}`);
  }
  const ks = key.key;
  const privateKey = keystore.decrypt(ks, password);

  secp256k1Lock.setProvider({
    sign: async function(_address, message) {
      const ec = new EC('secp256k1');
      const key = ec.keyFromPrivate(privateKey);
      const msg = typeof message === 'string' ? hexToBytes(message) : message;
      const { r, s, recoveryParam } = key.sign(msg, {
        canonical: true,
      });
      if (recoveryParam === null){
        throw new Error('Fail to sign the message');
      }
      const fmtR = r.toString(16).padStart(64, '0');
      const fmtS = s.toString(16).padStart(64, '0');
      const signature = `0x${fmtR}${fmtS}0${recoveryParam}`;
      return signature;
    }
  });

  const tx = await secp256k1Lock.sign(address, rawTx, {index: 0, length: -1});
  return tx;
}

module.exports = {
  init,
  createPassword,
  getSeed,
  unlock,
  exists,
  generateKey,
  importKey,
  accounts,
  publicKeyToLockHash,
  signTx,
};
