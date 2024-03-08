import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { getSafeSingletonDeployment, getProxyFactoryDeployment, getCompatibilityFallbackHandlerDeployment } from '@safe-global/safe-deployments';

export default buildModule("Points", (m) => {
    const filter = { version: "1.3.0", released: true };
    const chainId = 1;  // TODO: make configurable.
    const safeAddress = getSafeSingletonDeployment(filter).networkAddresses[chainId];
    const proxyFactoryAddress = getProxyFactoryDeployment(filter).networkAddresses[chainId];
    const compatibilityFallbackHandler = getCompatibilityFallbackHandlerDeployment(filter).networkAddresses[chainId];
    const pointsSafeModule = m.contract("PointsSafeModule", []);
    const pointsSafeGuard = m.contract("PointsSafeGuard", [pointsSafeModule]);
    const pointsNftContract = m.contract("Points", [safeAddress, proxyFactoryAddress, pointsSafeModule, pointsSafeGuard, compatibilityFallbackHandler]);
    return { pointsNftContract, pointsSafeModule, pointsSafeGuard };
});
