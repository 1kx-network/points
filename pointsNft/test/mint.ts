import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import  anyValue from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import Points from "../ignition/modules/points";
import hre from 'hardhat';

import { EthersAdapter, SafeFactory, SafeAccountConfig } from '@safe-global/protocol-kit';
import Safe from '@safe-global/protocol-kit';
import { SafeTransactionData } from '@safe-global/safe-core-sdk-types';

async function getOwnerAdapters(): Promise<EthersAdapter[]> {
    return (await ethers.getSigners()).slice(0, 3).map((signer) => new EthersAdapter({ ethers, signerOrProvider: signer }));
}

describe("Points", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployPoints() {
    const { pointsNftContract } = await ignition.deploy(Points, { chainId: (await hre.getChainId()).toString() });
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    return {
      pointsNftContract,
      owner,
      otherAccount
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const {
        pointsNftContract,
        owner
      } = await loadFixture(deployPoints);

      expect(await pointsNftContract.owner()).to.equal(owner.address);
    });

    it("Should have right symbol", async function () {
      const {
        pointsNftContract,
        owner
      } = await loadFixture(deployPoints);

      expect(await pointsNftContract.symbol()).to.equal("PT");
    });
  });

  describe("Mint", function () {
    describe("Validations", function () {
      it("mint nft to address with an account that created the NFT contract", async function () {
        const {
          pointsNftContract,
          owner
        } = await loadFixture(deployPoints);

        await expect(
          pointsNftContract.mintNFT(owner.address)
        ).not.to.be.reverted
      });


      it("mint nft to address with an account that's not owner", async function () {
        const {
          pointsNftContract,
          otherAccount,
          owner
        } = await loadFixture(deployPoints);

        await expect(
          pointsNftContract.connect(otherAccount).mintNFT(owner.address)
        ).not.to.be.reverted
      });

      it("mint nft to address", async function () {
        const {
          pointsNftContract,
          otherAccount
        } = await loadFixture(
          deployPoints
        );

        await expect(pointsNftContract.mintNFT(otherAccount.address)).not.to.be.reverted;
      });
    });
  });

  describe("Ownership", function () {

    it("transfer ownership", async function () {
      const {
        pointsNftContract,
        otherAccount,
        owner
      } = await loadFixture(
        deployPoints
      );
      expect(await pointsNftContract.owner()).to.equal(owner.address);
      
      await pointsNftContract.transferOwnership(otherAccount.address)

      expect(await pointsNftContract.owner()).to.equal(otherAccount.address);

      await expect(pointsNftContract.connect(otherAccount).mintNFT(otherAccount.address)).not.to.be.reverted;
    });

  });

});
