async function main() {
  const networkName = hre.network.name
  const Points = await ethers.getContractFactory("Points")

  // Start deployment, returning a promise that resolves to a contract object
  const points = await Points.deploy()
  console.log("Contract deployed to address:", points.address)

  console.log("points deployed to: ", points.address);
  console.log(`npx hardhat clean && npx hardhat verify --network "${networkName}" "${points.address}" `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })