// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtNFT is ERC721URIStorage, Ownable {
    uint256 public tokenCount;
    mapping(uint256 => uint256) public prices;
    mapping(uint256 => bool) public listedTokens;

    struct Auction {
        bool active;
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
    }

    mapping(uint256 => Auction) public auctions;

    event NFTMinted(address owner, uint256 tokenId, string tokenURI);
    event NFTListed(uint256 tokenId, uint256 price);
    event NFTBought(address buyer, uint256 tokenId, uint256 price);
    event AuctionStarted(uint256 tokenId, uint256 duration);
    event BidPlaced(uint256 tokenId, address bidder, uint256 amount);
    event AuctionEnded(uint256 tokenId, address winner, uint256 amount);

    constructor() ERC721("ArtNFT", "ART") Ownable(msg.sender) {}

    function mint(string memory _tokenURI) external {
        tokenCount += 1;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        emit NFTMinted(msg.sender, tokenCount, _tokenURI);
    }

    function listForSale(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can list this token for sale");
        prices[tokenId] = price;
        listedTokens[tokenId] = true;
        emit NFTListed(tokenId, price);
    }

    function buy(uint256 tokenId) external payable {
        require(listedTokens[tokenId], "This token is not for sale");
        require(msg.value >= prices[tokenId], "Insufficient payment");

        address owner = ownerOf(tokenId);
        _transfer(owner, msg.sender, tokenId);
        payable(owner).transfer(msg.value);

        listedTokens[tokenId] = false;
        prices[tokenId] = 0;

        emit NFTBought(msg.sender, tokenId, msg.value);
    }

    function startAuction(uint256 tokenId, uint256 duration) external {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can start an auction");
        require(!auctions[tokenId].active, "Auction already active");

        auctions[tokenId] = Auction({
            active: true,
            highestBidder: address(0),
            highestBid: 0,
            endTime: block.timestamp + duration
        });

        emit AuctionStarted(tokenId, duration);
    }

    function placeBid(uint256 tokenId) external payable {
        require(auctions[tokenId].active, "Auction is not active");
        require(block.timestamp < auctions[tokenId].endTime, "Auction has ended");
        require(msg.value > auctions[tokenId].highestBid, "Bid must be higher than the current highest bid");

        if (auctions[tokenId].highestBidder != address(0)) {
            payable(auctions[tokenId].highestBidder).transfer(auctions[tokenId].highestBid);
        }

        auctions[tokenId].highestBid = msg.value;
        auctions[tokenId].highestBidder = msg.sender;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function finalizeAuction(uint256 tokenId) external {
        require(auctions[tokenId].active, "Auction is not active");
        require(block.timestamp >= auctions[tokenId].endTime, "Auction has not ended yet");

        auctions[tokenId].active = false;

        if (auctions[tokenId].highestBidder != address(0)) {
            address owner = ownerOf(tokenId);
            _transfer(owner, auctions[tokenId].highestBidder, tokenId);
            payable(owner).transfer(auctions[tokenId].highestBid);

            emit AuctionEnded(tokenId, auctions[tokenId].highestBidder, auctions[tokenId].highestBid);
        }
    }

    function getListedTokens() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= tokenCount; i++) {
            if (listedTokens[i]) {
                count++;
            }
        }

        uint256[] memory tokens = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= tokenCount; i++) {
            if (listedTokens[i]) {
                tokens[index] = i;
                index++;
            }
        }
        return tokens;
    }

    function getPrice(uint256 tokenId) external view returns (uint256) {
        return prices[tokenId];
    }

    function getAuctionDetails(uint256 tokenId) external view returns (bool, address, uint256, uint256) {
        Auction memory auction = auctions[tokenId];
        return (auction.active, auction.highestBidder, auction.highestBid, auction.endTime);
    }
}