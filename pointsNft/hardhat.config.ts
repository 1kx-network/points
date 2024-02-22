import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";

const getAccounts = function(): string[] {
    let accounts = [];
    accounts.push(vars.get("DEPLOYER_PRIVATE_KEY"));
    return accounts;
}

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {  enabled: true, runs: 200 }
        }
    },
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
            accounts: getAccounts(),
        },
        gnosis: {
            url:  "https://gnosis-pokt.nodies.app",
            accounts: getAccounts(),
        },
        sepolia: {
            url: "https://rpc.sepolia.org/",
            accounts: getAccounts(),
        },
        buildbear: {
            url:  "https://rpc.buildbear.io/1kx",
            accounts: getAccounts(),
        },
    },
    etherscan: {
        customChains: [
        {
            network: "gnosis",
            chainId: 100,
            urls: {
              // 3) Select to what explorer verify the contracts
              // Gnosisscan
              apiURL: "https://api.gnosisscan.io/api",
              browserURL: "https://gnosisscan.io/",
            },
          }
        ],
        apiKey: {
            gnosis: vars.get("GNOSISSCAN_API_KEY", ""),
            sepolia: vars.get("ETHERSCAN_API_KEY", ""),
        },
    },

    mocha: {
        timeout: 100000000
    },
};

export default config;
