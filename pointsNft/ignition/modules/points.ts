import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Points", (m) => {
    const pointsSafeDeployer = m.contract("PointsSafeDeployer", []);
    const pointsSafeModule = m.contract("PointsSafeModule", []);
    const pointsSafeGuard = m.contract("PointsSafeGuard", []);
    const pointsNftContract = m.contract("Points", [pointsSafeDeployer, pointsSafeModule, pointsSafeGuard]);
    return { pointsNftContract, pointsSafeDeployer, pointsSafeModule, pointsSafeGuard };
});
