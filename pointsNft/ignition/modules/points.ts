import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Points", (m) => {
    const safeSingleton = "0xd9db270c1b5e3bd161e8c8503c55ceabee709552"
    const safeFactory = "0xa6b71e26c5e0845f74c812102ca7114b6a896ab2"
    const pointsSafeModule = m.contract("PointsSafeModule", []);
    const pointsSafeGuard = m.contract("PointsSafeGuard", []);
    const pointsNftContract = m.contract("Points", [safeSingleton, safeFactory, pointsSafeModule, pointsSafeGuard]);
    return { pointsNftContract, pointsSafeModule, pointsSafeGuard };
});
