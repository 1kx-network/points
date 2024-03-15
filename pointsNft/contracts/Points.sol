// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";

// Import this file to use console.log
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@gnosis.pm/safe-contracts-v1.3.0/contracts/GnosisSafe.sol";
import "@gnosis.pm/safe-contracts-v1.3.0/contracts/proxies/GnosisSafeProxyFactory.sol";
import "@gnosis.pm/safe-contracts-v1.3.0/contracts/proxies/GnosisSafeProxy.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract Points is ERC721Enumerable, Ownable, Guard {
    GnosisSafe immutable safeSingleton;
    GnosisSafeProxyFactory immutable safeFactory;
    address immutable safeFallBackHandler;

    address internal constant SENTINEL_OWNERS = address(0x1);

    // Copied from GuardManager.sol, verified for all versions of Safe.
    // keccak256("guard_manager.guard.address")
    uint256 internal constant GUARD_STORAGE_SLOT = 0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8;

    
    string baseURI = "https://on-chain-points.netlify.app/metadata/";

    constructor(GnosisSafe _safeSingleton,
                GnosisSafeProxyFactory _safeFactory,
                address _safeFallBackHandler) ERC721("Points", "PT") Ownable(msg.sender) {
        safeFactory = _safeFactory;
        safeSingleton = _safeSingleton;
        safeFallBackHandler = _safeFallBackHandler;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(Guard).interfaceId || // 0xe6d7a83a
            interfaceId == type(IERC165).interfaceId || // 0x01ffc9a7
            super.supportsInterface(interfaceId);
    }

    function mintNFT(address recipient)
       external returns (uint256)
    {
        bytes memory setModule = abi.encodeWithSignature(
            "setupModuleAndGuard(address)", 
            address(this)
        );
        address[] memory owners = new address[](1);
        owners[0] = recipient;
        bytes memory initializer = abi.encodeWithSignature(
            "setup(address[],uint256,address,bytes,address,address,uint256,address)", 
            owners,
            1,              // _threshold
            address(this),     // to
            setModule,      // data
            safeFallBackHandler,     // fallBackHandler    
            address(0),     // paymentToken
            0,              // payment
            address(0)      // paymentReceiver
        );

        uint256 nonce = uint256(uint160(msg.sender)) + block.timestamp;
        GnosisSafeProxy newSafe = safeFactory.createProxyWithNonce(address(safeSingleton), initializer, nonce);
        uint256 tokenId = uint256(uint160(address(newSafe)));
        if (recipient == address(0)) {
            recipient = msg.sender;
        }
        _mint(recipient, tokenId);

        return tokenId;
    }

    function tokenURI(uint256 id) public view override(ERC721) returns (string memory) {
        return string(abi.encodePacked(baseURI, Strings.toString(id)));
    }

    function updateBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth) internal override returns (address) {
        address from_address = super._update(to, tokenId, auth);

        GnosisSafe safeContract = GnosisSafe(payable(address(uint160(tokenId))));
        bytes memory data = abi.encodeWithSignature("resetOwner(address)", to);
        safeContract.execTransactionFromModule(payable(address(this)),
                                               0,
                                               data,
                                               Enum.Operation.DelegateCall);
        return from_address;
    }

    function setupModuleAndGuard(address module) external {
        GnosisSafe safe = GnosisSafe(payable(address(this)));
        safe.enableModule(module);
        safe.setGuard(module);
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

    // Guard functionality. Guard is a separate functionality, but merged into the NFT contract to simplify
    // access control.
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
        bytes memory guard_slot = safe.getStorageAt(GUARD_STORAGE_SLOT, 1);
        address guard = address(uint160(uint256(bytes32(guard_slot))));
        require(guard == address(this), "Attemping to remove the Points Guard");
        require(safe.isModuleEnabled(address(this)), "Attempting to remove the Points Module");
    }
}
