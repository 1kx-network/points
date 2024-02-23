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



contract PointsSafeGuard is BaseGuard, ISignatureValidatorConstants, SignatureDecoder {

    address private immutable moduleAddress;

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

        bytes32 dataFunctionSelector;
        
        bytes memory functionSelector = new bytes(10);
        for (uint256 i; i < 10; ) {
            functionSelector[i] = data[i];
            unchecked {++i;}
        }
        

        dataFunctionSelector = keccak256(functionSelector);
        
        bytes32 badSelector = keccak256("0xe19a9dd9");
        require(dataFunctionSelector != badSelector, "not allowed to change the guard");
    }

    function checkAfterExecution(bytes32, bool) external view override {

        GnosisSafe safe = GnosisSafe(payable(msg.sender));

        uint256 pageSize = 2;

        (address[] memory modules, ) = safe.getModulesPaginated(moduleAddress, pageSize);
        require(modules.length == 1, "Too much modules on the safe");

        require(safe.isModuleEnabled(moduleAddress), "Module not enabled");

   }
}

