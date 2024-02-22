require("@nomicfoundation/hardhat-toolbox");

require('dotenv').config({override: true});
require("@nomiclabs/hardhat-ethers");
const {
  GOERLI_NODE_URL,
  PRIVATE_KEY,
  MAINNET_NODE_URL,
  ETHERSCAN_KEY
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    hardhat: {},
    goerli: {
      url: GOERLI_NODE_URL,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    mainnet: {
      url: MAINNET_NODE_URL,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  },
  mocha: {
    timeout: 40000
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY
  }
};