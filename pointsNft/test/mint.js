const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {
  anyValue
} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {
  expect
} = require("chai");

describe("Points", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployPoints() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Points = await ethers.getContractFactory("Points");
    const points = await Points.deploy();

    return {
      points,
      owner,
      otherAccount
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const {
        points,
        owner
      } = await loadFixture(deployPoints);

      expect(await points.owner()).to.equal(owner.address);
    });

    it("Should have right sumbol", async function () {
      const {
        points,
        owner
      } = await loadFixture(deployPoints);

      expect(await points.symbol()).to.equal("Points");
    });
  });

  describe("Mint", function () {
    describe("Validations", function () {
      it("mint nft to address with an account that's not owner", async function () {
        const {
          points,
          otherAccount,
          owner
        } = await loadFixture(deployPoints);

        await expect(
          points.connect(otherAccount).mintNFT(owner.address, 'asdasd')
        ).to.be.reverted
      });

      it("mint nft to address", async function () {
        const {
          points,
          otherAccount
        } = await loadFixture(
          deployPoints
        );

        await expect(points.mintNFT(otherAccount.address, 'asdasd')).not.to.be.reverted;
      });
    });
  });

  describe("Ownership", function () {

    it("transfer ownership", async function () {
      const {
        points,
        otherAccount,
        owner
      } = await loadFixture(
        deployPoints
      );
      expect(await points.owner()).to.equal(owner.address);
      
      await points.transferOwnership(otherAccount.address)

      expect(await points.owner()).to.equal(otherAccount.address);

      await expect(points.connect(otherAccount).mintNFT(otherAccount.address, 'asdasd')).not.to.be.reverted;
    });

  });

});