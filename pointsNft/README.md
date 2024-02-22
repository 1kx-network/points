# Points
# Scripts

### install dependencies
```shell
npm i
```

### test 
```shell
npx hardhat test 
```

### deploy  
```shell
npx hardhat run scripts/deploy.js
```
### deploy to chain and verify 
```shell
npx hardhat run scripts/deploy.js --network {mainnet/goerli}
npx hardhat verify --network {mainnet/goerli} {deployment address}
```
