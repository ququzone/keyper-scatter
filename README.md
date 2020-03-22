Keyper wallet
=============

> A minimal wallet for keyper specs.

## Notice

Keyper scatter default configuration is only for testnet, if you want run for mainnet, you must change default configuration after readed code.
The configuration that needs to be changed is as follows:

- network rpc endpoint in `src/service/cache.js` file 9 line.
- address prefix in `src/service/wallet.js` file 151 line.
- `Secp256k1LockScript` default config: codeHash, hashType, deps.
- `Keccak256LockScript` and `AnyoneCanPayLockScript` does not supported on mainnet.

## Run from source

### Download sources

```
git clone https://github.com/ququzone/keyper-scatter.git
cd keyper-scatter
```

### Edit network config

```
vim src/service/cache.js
```

change `nodeUrl = "http://localhost:8115"` to your local CKB testnet RPC endpoint. 

### Chinese network environment

```
export ELECTRON_MIRROR="https://cdn.npm.taobao.org/dist/electron/"
npm config set registry https://registry.npm.taobao.org
npm install --node_sqlite3_binary_host_mirror=http://npm.taobao.org/mirrors
npm run start
```

### High speed network

```
npm install
npm run start
```
