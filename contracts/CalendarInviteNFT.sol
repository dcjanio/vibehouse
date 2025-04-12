// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CalendarInviteNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct CalendarInvite {
        address host;
        uint256 expiration;
        bool isRedeemed;
        string topic;
        uint256 duration;
    }

    mapping(uint256 => CalendarInvite) public invites;

    event InviteCreated(uint256 indexed tokenId, address indexed host, address indexed recipient);
    event InviteRedeemed(uint256 indexed tokenId, address indexed redeemer);

    constructor() ERC721("Calendar Invite", "CALNFT") Ownable() {}

    function createInvite(
        address recipient,
        string memory topic,
        uint256 duration,
        uint256 expiration,
        string memory metadataURI
    ) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, metadataURI);

        invites[newTokenId] = CalendarInvite({
            host: msg.sender,
            expiration: expiration,
            isRedeemed: false,
            topic: topic,
            duration: duration
        });

        emit InviteCreated(newTokenId, msg.sender, recipient);
        return newTokenId;
    }

    function redeemInvite(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only token owner can redeem");
        require(!invites[tokenId].isRedeemed, "Invite already redeemed");
        require(block.timestamp <= invites[tokenId].expiration, "Invite expired");

        invites[tokenId].isRedeemed = true;
        emit InviteRedeemed(tokenId, msg.sender);
    }

    function _burn(uint256 tokenId) internal override(ERC721URIStorage) {
        super._burn(tokenId);
    }
} 