// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@gnosis.pm/safe-contracts/contracts/base/GuardManager.sol";
import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";
import "@gnosis.pm/safe-contracts/contracts/common/SignatureDecoder.sol";
import "@gnosis.pm/safe-contracts/contracts/GnosisSafe.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@gnosis.pm/safe-contracts/contracts/interfaces/ISignatureValidator.sol";

/**
 * @title BaseGuard
 * @notice The BaseGuard implements support for ERC165, since gnosis safe v1.3.0 doesn't implement it.
 *         At time of writing this contract, it is implemented in their repo, but not released with v1.3.0
 */
abstract contract BaseGuard is Guard {
    
    function supportsInterface(bytes4 interfaceId) external view virtual returns (bool) {
        return
            interfaceId == type(Guard).interfaceId || // 0xe6d7a83a
            interfaceId == type(IERC165).interfaceId; // 0x01ffc9a7
    }
}

/**
 * @title PoinstSafeGuard - makes sure that any transaction cannot remove the guard itself and cannot remove our module.
 */
contract PointsSafeGuard is BaseGuard {

    address private immutable moduleAddress;

    // Copied from GuardManager.sol, verified for all versions of Safe.
    // keccak256("guard_manager.guard.address")
    bytes32 internal constant GUARD_STORAGE_SLOT = 0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8;

    constructor(address moduleAddress_) {
        moduleAddress = moduleAddress_;
    }

    function checkTransaction(
        address,
        uint256,
        bytes memory data,
        Enum.Operation,
        uint256,
        uint256,
        uint256,
        address,
        address payable,
        bytes memory,
        address
    ) external view override {
        // We pass all transactions, only checking the post-condition.
    }

    function checkAfterExecution(bytes32, bool) external view override {
        GnosisSafe safe = GnosisSafe(payable(msg.sender));
        address guard;
        bytes32 slot = GUARD_STORAGE_SLOT;
        assembly {
           guard := sload(slot)
        }
        require(guard == address(this), "Attemping to remove the Points Guard");
        require(safe.isModuleEnabled(moduleAddress), "Attempting to remove the Points Module");
   }
}
