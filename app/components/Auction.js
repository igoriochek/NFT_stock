'use client';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import NFTCard from './NFTCard';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';

const Auction = ({ provider, contractAddress, currentAddress }) => {
  const [auctions, setAuctions] = useState([]);
  const [filteredAuctions, setFilteredAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    if (provider) {
      loadAuctions();
    }
  }, [provider]);

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFilteredAuctions(auctions);
    } else {
      const filtered = auctions.filter((auction) =>
        auction.categories.some((cat) => selectedCategories.includes(cat))
      );
      setFilteredAuctions(filtered);
    }
  }, [selectedCategories, auctions]);

  const loadAuctions = async () => {
    try {
      if (!provider) return;

      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
      const totalSupply = await contract.tokenCount();
      const items = [];

      for (let i = 1; i <= totalSupply; i++) {
        const [active, highestBidder, highestBid, endTime] = await contract.getAuctionDetails(i);
        if (active) {
          const tokenURI = await contract.tokenURI(i);
          const owner = await contract.ownerOf(i);
          const nftCategories = await contract.getCategories(i);

          const response = await fetch(tokenURI);

          if (!response.ok) {
            throw new Error(`Failed to fetch metadata for token ${i}`);
          }

          const metadata = await response.json();

          items.push({
            id: i,
            highestBidder,
            highestBid: ethers.BigNumber.isBigNumber(highestBid)
              ? highestBid
              : ethers.BigNumber.from(highestBid || "0"), // Ensure valid BigNumber
            endTime,
            owner,
            categories: nftCategories,
            ...metadata,
          });
        }
      }

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(items.flatMap((auction) => auction.categories))
      );
      setCategories(uniqueCategories);
      setAuctions(items);
    } catch (error) {
      console.error('Error loading auctions:', error);
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="container mx-auto px-8 lg:px-16">
      <h1 className="text-5xl font-bold text-gray-100 text-center my-8 shadow-md">Live Auctions</h1>

      {/* Category Filter */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-bold text-gray-300 mb-4">Filter by Categories</h2>
        <div className="flex flex-wrap gap-4">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-lg border ${
                selectedCategories.includes(category)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Auction Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredAuctions.length > 0 ? (
          filteredAuctions.map((nft) => (
            <div key={nft.id} className="flex justify-center">
              <NFTCard
                nft={nft} // Pass raw data
                currentAddress={currentAddress}
                isAuction={true}
              />
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-400">No active auctions matching the selected filters.</p>
        )}
      </div>
    </div>
  );
};

export default Auction;
