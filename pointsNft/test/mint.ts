import { time, loadFixture, setBalance } from "@nomicfoundation/hardhat-network-helpers";
import  anyValue from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import Points from "../ignition/modules/points";
import hre from 'hardhat';

import { EthersAdapter, SafeFactory, SafeAccountConfig } from '@safe-global/protocol-kit';
import Safe from '@safe-global/protocol-kit';
import { SafeTransactionData } from '@safe-global/safe-core-sdk-types';
import SAFE_ABI from "../artifacts/@gnosis.pm/safe-contracts-v1.3.0/contracts/GnosisSafe.sol/GnosisSafe.json"
import ERC20_ABI from "../testingAbis/ERC20.json"
async function getOwnerAdapters(): Promise<EthersAdapter[]> {
    return (await ethers.getSigners()).slice(0, 3).map((signer) => new EthersAdapter({ ethers, signerOrProvider: signer }));
}
const vitalik = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
const whale = "0xB05ED5d7b4F7f26a73561732D5bd64C38f9076Bd"
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
describe("Points", function () {
  let eventListener;
  let safeAddress;
  let tokenIdSafe;
  let pointsNftContract
  let owner
  let otherAccount

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    let deployments = await ignition.deploy(Points);
    pointsNftContract = deployments.pointsNftContract

    eventListener = pointsNftContract.on("Transfer", (from, to, tokenId, event) => {
      console.log("Transfer event:");
      console.log("From:", from);
      console.log("To:", to);
      console.log("Token ID:", tokenId.toString());
      safeAddress = "0x"+BigInt(tokenId.toString()).toString(16).padStart(40, '0')
      tokenIdSafe = tokenId
    });

  })

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await pointsNftContract.owner()).to.equal(owner.address);
    });

    it("Should have right symbol", async function () {
      expect(await pointsNftContract.symbol()).to.equal("PT");
    });
  });

  describe("Ownership", function () {
    it("transfer ownership", async function () {
      expect(await pointsNftContract.owner()).to.equal(owner.address);
      
      await pointsNftContract.transferOwnership(otherAccount.address)

      expect(await pointsNftContract.owner()).to.equal(otherAccount.address);
    });

  });

  describe("PointsNFT", function () {
    describe("Validations", function () {
      it("mint nft to address with an account that created the NFT contract and check owner of safe ", async function () {
        let mintNftTxn = await pointsNftContract.mintNFT(owner.address);
        let mintNft = await mintNftTxn.wait()
        let tokenURI = await pointsNftContract.tokenURI(tokenIdSafe);
        let safeContract = new ethers.Contract(safeAddress,SAFE_ABI.abi,owner)
        let owners = await safeContract.getOwners()
        
        console.log('safeAddress ', safeAddress)
        console.log('tokenURI', tokenURI)
        console.log('owners', owners)
        
        await expect(
          owners.length
        ).to.equal(1)
        
        await expect(
          owners[0]
        ).to.equal(owner.address)
      });


      it("mint nft twice, checking for CREATE2 behavior", async function () {
        const {
          pointsNftContract,
          owner
        } = await loadFixture(deployPoints);

        await expect(
          pointsNftContract.mintNFT(owner.address)
        ).not.to.be.reverted
        await expect(
          pointsNftContract.mintNFT(owner.address)
        ).not.to.be.reverted
      });

      it("mint nft to address with an account that's not owner", async function () {
        let mintNftTxn = await pointsNftContract.mintNFT(otherAccount.address);
        let mintNft = await mintNftTxn.wait()
        let tokenURI = await pointsNftContract.tokenURI(tokenIdSafe);
        let safeContract = new ethers.Contract(safeAddress,SAFE_ABI.abi,owner)
        let owners = await safeContract.getOwners()
        
        console.log('safeAddress ', safeAddress)
        console.log('tokenURI', tokenURI)
        console.log('owners', owners)
        
        await expect(
          owners.length
        ).to.equal(1)
        
        await expect(
          owners[0]
        ).to.equal(otherAccount.address)
      });

      it("transfer nft and make sure safe owner changed", async function () {
        let mintNftTxn = await pointsNftContract.mintNFT(owner.address);
        let mintNft = await mintNftTxn.wait()
        let tokenURI = await pointsNftContract.tokenURI(tokenIdSafe);
        let safeContract = new ethers.Contract(safeAddress,SAFE_ABI.abi,owner)
        
        let txn_addOwnerWithThreshold = await safeContract.interface.encodeFunctionData('addOwnerWithThreshold',[otherAccount.address, 1])
        console.log('txn_addOwnerWithThreshold', txn_addOwnerWithThreshold)
        // await safeContract.execTransaction(
        //   safeAddress, // Recipient address
        //   0,            // Amount to transfer
        //   txn_addOwnerWithThreshold,              // Additional data
        //   0,                 // Operation (0 for call)
        //   0,                 // Safe transaction gas
        //   0,                 // Base gas
        //   0,                 // Gas price
        //   "0x0000000000000000000000000000000000000000", // Gas token address
        //   "0x0000000000000000000000000000000000000000", // Refund receiver
        //   '0x'
        // );
        
        let owners = await safeContract.getOwners()
        
        console.log('safeAddress ', safeAddress)
        console.log('tokenURI', tokenURI)
        console.log('owners', owners)
        
        // await expect(
        //   owners.length
        //   ).to.equal(1)
          
        await expect(
        owners[0]
        ).to.equal(owner.address)
        
        let old_tokenIdSafe = tokenIdSafe
        let old_safeAddress = safeAddress
        let old_owners = owners
        
        await pointsNftContract.transferFrom(owner.address,vitalik, old_tokenIdSafe)
        
        let new_owners = await safeContract.getOwners()

        let new_nft_owner = await pointsNftContract.ownerOf(old_tokenIdSafe);

        console.log('new_owners', new_owners)
        console.log('new_nft_owner', new_nft_owner)

        await expect(
          new_owners.length
        ).to.equal(1)
        
        await expect(
          new_owners[0]
        ).to.equal(vitalik)

        await expect(
          new_nft_owner
        ).to.equal(vitalik)
      });

      it("can send and receive erc20 and erc721", async function () {
        let mintNftTxn = await pointsNftContract.mintNFT(owner.address);
        let mintNft = await mintNftTxn.wait()
        let tokenURI = await pointsNftContract.tokenURI(tokenIdSafe);
        let safeContract = new ethers.Contract(safeAddress,SAFE_ABI.abi,owner)
        let owners = await safeContract.getOwners()
        
        console.log('safeAddress ', safeAddress)
        console.log('tokenURI', tokenURI)
        console.log('owners', owners)
        
        await expect(
          owners.length
        ).to.equal(1)
        
        await expect(
          owners[0]
        ).to.equal(owner.address)
        
        const whaleSigner = await ethers.getImpersonatedSigner(whale);
        let WETH_contract = new ethers.Contract(WETH, ERC20_ABI, whaleSigner)
        
        let before_erc20_balance = await WETH_contract.balanceOf(safeAddress)
        console.log('before_erc20_balance', before_erc20_balance)
        
        await WETH_contract.transfer(safeAddress, '100')
        
        let after_erc20_balance = await WETH_contract.balanceOf(safeAddress)
        console.log('after_erc20_balance', after_erc20_balance)

        await expect(
          BigInt(before_erc20_balance)
        ).to.be.lessThan(BigInt(after_erc20_balance))

        // let transferData = await WETH_contract.interface.encodeFunctionData('transfer',[whale, '100'])
        // await safeContract.execTransaction(
        //   WETH, // Recipient address
        //   0,            // Amount to transfer
        //   transferData,              // Additional data
        //   0,                 // Operation (0 for call)
        //   0,                 // Safe transaction gas
        //   0,                 // Base gas
        //   0,                 // Gas price
        //   "0x0000000000000000000000000000000000000000", // Gas token address
        //   "0x0000000000000000000000000000000000000000", // Refund receiver
        //   '0x'
        // );
        // let after_transfer_erc20_balance = await WETH_contract.balanceOf(safeAddress)
        // console.log('after_transfer_erc20_balance', after_transfer_erc20_balance)

      });
    });
  });

});
