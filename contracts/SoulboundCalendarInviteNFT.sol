// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SoulboundCalendarInviteNFT
 * @dev ERC721 token that represents calendar invites as soulbound NFTs
 * Only the contract owner can create invites, and tokens cannot be transferred
 * once they are minted to the recipient (soulbound).
 */
contract SoulboundCalendarInviteNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct CalendarInvite {
        address host;
        uint256 expiration;
        bool isRedeemed;
        string topic;
        uint256 duration;
        uint256 createdAt;
    }

    mapping(uint256 => CalendarInvite) public invites;
    mapping(address => uint256[]) private _userTokens;

    event InviteCreated(uint256 indexed tokenId, address indexed host, address indexed recipient);
    event InviteRedeemed(uint256 indexed tokenId, address indexed redeemer);

    constructor() ERC721("Soulbound Calendar Invite", "SBCAL") Ownable() {}

    /**
     * @dev Creates a new calendar invite NFT
     * @param recipient Address that will receive the NFT
     * @param topic Meeting topic
     * @param duration Meeting duration in seconds
     * @param expiration Timestamp when the invite expires
     * @param metadataURI URI for the NFT metadata
     * @return uint256 ID of the newly created token
     */
    function createInvite(
        address recipient,
        string memory topic,
        uint256 duration,
        uint256 expiration,
        string memory metadataURI
    ) public onlyOwner returns (uint256) {
        require(recipient != address(0), "Invalid recipient address");
        require(bytes(topic).length > 0, "Topic cannot be empty");
        require(duration > 0, "Duration must be greater than 0");
        require(expiration > block.timestamp, "Expiration must be in the future");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, metadataURI);

        invites[newTokenId] = CalendarInvite({
            host: msg.sender,
            expiration: expiration,
            isRedeemed: false,
            topic: topic,
            duration: duration,
            createdAt: block.timestamp
        });
        
        _userTokens[recipient].push(newTokenId);

        emit InviteCreated(newTokenId, msg.sender, recipient);
        return newTokenId;
    }

    /**
     * @dev Redeems a calendar invite
     * @param tokenId ID of the token to redeem
     */
    function redeemInvite(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only token owner can redeem");
        require(!invites[tokenId].isRedeemed, "Invite already redeemed");
        require(block.timestamp <= invites[tokenId].expiration, "Invite expired");

        invites[tokenId].isRedeemed = true;
        emit InviteRedeemed(tokenId, msg.sender);
    }

    /**
     * @dev Returns all token IDs owned by a given address
     * @param owner Address to query tokens for
     * @return uint256[] Array of token IDs owned by the address
     */
    function tokenIdsOf(address owner) public view returns (uint256[] memory) {
        return _userTokens[owner];
    }

    /**
     * @dev Returns the total number of tokens minted
     * @return uint256 Current token ID counter
     */
    function tokenIdCounter() public view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     * @dev Returns invite details for a given token ID
     * @param tokenId ID of the token to query
     * @return CalendarInvite struct containing invite details
     */
    function getInviteDetails(uint256 tokenId) public view returns (CalendarInvite memory) {
        require(_exists(tokenId), "Token does not exist");
        return invites[tokenId];
    }

    /**
     * @dev Override _beforeTokenTransfer to implement soulbound functionality
     * @param from Address tokens are transferred from
     * @param to Address tokens are transferred to
     * @param tokenId ID of the token being transferred
     * @param batchSize Size of the batch (always 1 for ERC721)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // If this is a transfer (not a mint or burn)
        if (from != address(0) && to != address(0)) {
            // Only allow transfers by the contract owner (for exceptional cases)
            require(msg.sender == owner(), "SoulboundCalendarInviteNFT: tokens are soulbound and cannot be transferred");
        }
        
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Override burn function
     * @param tokenId ID of the token to burn
     */
    function _burn(uint256 tokenId) internal override(ERC721URIStorage) {
        super._burn(tokenId);
    }
} 