Keyper wallet
=============

> A minimal wallet for keyper specs.

## Run from source

### Chinese network environment

```
git clone https://github.com/ququzone/keyper-scatter.git
cd keyper-scatter
export ELECTRON_MIRROR="https://cdn.npm.taobao.org/dist/electron/"
npm config set registry https://registry.npm.taobao.org
npm install --node_sqlite3_binary_host_mirror=http://npm.taobao.org/mirrors
npm run start
```

### High speed netword

```
git clone https://github.com/ququzone/keyper-scatter.git
cd keyper-scatter
npm install
npm run start
```
