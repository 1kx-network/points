import { HardhatUserConfig } from "hardhat/config";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";
import { BigNumber } from "@ethersproject/bignumber";
import { DeterministicDeploymentInfo } from "hardhat-deploy/dist/types";
import { getSingletonFactoryInfo } from "@gnosis.pm/safe-singleton-factory";

const getAccounts = function(): string[] {
    let accounts = [];
    accounts.push(vars.get("DEPLOYER_PRIVATE_KEY"));
    return accounts;
}

// copied from @safe-global/safe-contracts
const deterministicDeployment = (network: string): DeterministicDeploymentInfo => {
    const info = getSingletonFactoryInfo(parseInt(network));
    if (!info) {
        throw new Error(`
        Safe factory not found for network ${network}. You can request a new deployment at https://github.com/safe-global/safe-singleton-factory.
        For more information, see https://github.com/safe-global/safe-contracts#replay-protection-eip-155
      `);
    }
    return {
        factory: info.address,
        deployer: info.signerAddress,
        funding: BigNumber.from(info.gasLimit).mul(BigNumber.from(info.gasPrice)).toString(),
        signedTx: info.transaction,
    };
};

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {  enabled: true, runs: 200 }
        }
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        users: {
            default: 1,
        },
    },
    networks: {
        hardhat: {
            forking: {
                url: "https://eth-mainnet.g.alchemy.com/v2/-F_H-zzmexb1qflQUIqBYEvwwecXZXas",
            },
            chainId: 1,
        },
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
    deterministicDeployment,
};

export default config;
