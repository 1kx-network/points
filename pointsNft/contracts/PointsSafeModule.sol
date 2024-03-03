// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";
import "@gnosis.pm/safe-contracts/contracts/GnosisSafe.sol";

contract PointsSafeModule {
    address internal constant SENTINEL_OWNERS = address(0x1);

    function setupModuleAndGuard(address module, address guard) external {
        GnosisSafe safe = GnosisSafe(payable(address(this)));
        safe.enableModule(module);
        safe.setGuard(guard);
    }

    function resetSafeOwnership(GnosisSafe safeContract, address owner) public {
        bytes memory data = abi.encodeWithSignature("resetOwner(address)", owner);
        safeContract.execTransactionFromModule(payable(address(this)),
                                               0,
                                               data,
                                               Enum.Operation.DelegateCall);
    }

    function resetOwner(address newOwner) public {
        address payable thisAddr = payable(address(this));
        GnosisSafe safe = GnosisSafe(thisAddr);
        address[] memory owners = safe.getOwners();
        if (safe.isOwner(newOwner) && safe.getThreshold() == 1 && owners.length == 1) {
            // All set, nothing to do.
            return;
        }
        require(owners.length >= 1, "invalid owners length");
        address prevOwner = SENTINEL_OWNERS;
        // Remove all owners except the last one.
        for (uint i = 0; i < owners.length - 1; i++) {
            safe.removeOwner(prevOwner, owners[i], 1);
        }
        // Swap the latest remaining owner with the new owner.
        safe.swapOwner(prevOwner, owners[owners.length - 1], newOwner);
        assert(safe.getOwners().length == 1);
        if (safe.getThreshold() != 1) {
            safe.changeThreshold(1);
        }
    }
}
