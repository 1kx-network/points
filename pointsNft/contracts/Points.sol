// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@gnosis.pm/safe-contracts/contracts/GnosisSafe.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./PointsSafeDeployer.sol";
import "./PointsSafeGuard.sol";
import "./PointsSafeModule.sol";


contract Points is ERC721Enumerable, Ownable {
    PointsSafeDeployer immutable safeDeployer;
    PointsSafeModule immutable safeModule;
    PointsSafeGuard immutable safeGuard;

    string baseURI = "https://on-chain-points.netlify.app/metadata/";

    constructor(PointsSafeDeployer _safeDeployer,
                PointsSafeModule _safeModule,
                PointsSafeGuard _safeGuard) ERC721("Points", "PT") Ownable(msg.sender) {
        safeDeployer = _safeDeployer;
        safeModule = _safeModule;
        safeGuard = _safeGuard;
    }

    function mintNFT(address recipient)
       external returns (uint256)
    {
        if (recipient == address(0)) {
            recipient = msg.sender;
        }
        address newSafe = safeDeployer.deployNewSafe();
        uint256 tokenId = uint256(uint160(newSafe));
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
        safeModule.resetSafeOwnership(safeContract, to);
        return from_address;
    }
}
