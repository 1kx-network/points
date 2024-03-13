# Points

PointsNft is an infinitely mintable NFT contract. With each mint, a safe is also created for the recipient address, which becomes the sole owner with a threshold of one. The Token ID is set to the safe's address. Whenever the owner of a specific NFT transfers it to another address, the safe owner is set to that address with a threshold of one, and all previous owners are removed.

The safe created has:

1. The minter as the sole owner.
2. A transaction guard that ensures each transaction performed via the safe:
    a. Does not attempt to remove the guard.
    b. Does not attempt to remove the module.
3. A module that helps with resetSafeOwnership - removing all previous owners and setting the new owner with a threshold of one.

### Motivation

This provides users with a way to engage in activities with a wallet (smart account) and sell that wallet as an NFT, which is not possible with EOA accounts.

The initial use case will be a protocol that allows users to accrue points for respective NFTs, minted by users through activities on various protocols like EigenLayer.

### Setup

```
cd pointsNft
```

```
yarn install
```
``` set the deployer private key
npx hardhat vars set DEPLOYER_PRIVATE_KEY <your private key in hex w/o 0x>
```

### Testing 
```
npx hardhat test 
```

### Deployment 
compile
```
npx hardhat compile
```
deploy
```
```
npx hardhat ignition deploy ignition/modules/points.ts --network sepolia
```
change network to mainnet for prod deployment 

