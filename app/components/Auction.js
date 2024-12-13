'use client';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import NFTCard from './NFTCard';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';
import FilterPanel from './FilterPanel';

const Auction = ({ provider, contractAddress, currentAddress }) => {
  const [auctions, setAuctions] = useState([]);
  const [filteredAuctions, setFilteredAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [localProvider, setLocalProvider] = useState(null);
  const [filters, setFilters] = useState({
    selectedCategories: [],
    priceRange: [0, 100],
    sortOrder: 'newest',
  });

  // Use Hardhat local provider if MetaMask is not connected
  useEffect(() => {
    if (!provider && !localProvider) {
      const hardhatProvider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      setLocalProvider(hardhatProvider);
    }
  }, [provider]);

  const activeProvider = provider || localProvider;

  useEffect(() => {
    if (activeProvider) {
      loadAuctions();
    }
  }, [activeProvider]);

  useEffect(() => {
    let filtered = auctions;

    // Filter by categories
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter((auction) =>
        auction.categories.some((cat) => filters.selectedCategories.includes(cat))
      );
    }

    // Filter by price range
    filtered = filtered.filter(
      (auction) =>
        ethers.utils.formatUnits(auction.highestBid, 'ether') >= filters.priceRange[0] &&
        ethers.utils.formatUnits(auction.highestBid, 'ether') <= filters.priceRange[1]
    );

    // Sort by selected order
    if (filters.sortOrder === 'low_to_high') {
      filtered.sort((a, b) => a.highestBid.sub(b.highestBid));
    } else if (filters.sortOrder === 'high_to_low') {
      filtered.sort((a, b) => b.highestBid.sub(a.highestBid));
    } else if (filters.sortOrder === 'newest') {
      filtered.sort((a, b) => b.id - a.id);
    } else if (filters.sortOrder === 'oldest') {
      filtered.sort((a, b) => a.id - b.id);
    }

    setFilteredAuctions(filtered);
  }, [filters, auctions]);

  const loadAuctions = async () => {
    try {
      if (!activeProvider) return;

      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, activeProvider);
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
              : ethers.BigNumber.from(highestBid || '0'),
            endTime,
            owner,
            categories: nftCategories,
            ...metadata,
          });
        }
      }

      const uniqueCategories = Array.from(
        new Set(items.flatMap((auction) => auction.categories))
      );
      setCategories(uniqueCategories);
      setAuctions(items);
    } catch (error) {
      console.error('Error loading auctions:', error);
    }
  };

  return (
    <div className="w-full px-4 lg:px-16">
      <h1 className="text-5xl font-bold text-gray-100 text-center my-8">Live Auctions</h1>

      <FilterPanel
        categories={categories}
        onFilterChange={(newFilters) => setFilters(newFilters)}
      />

      {/* Auction Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredAuctions.length > 0 ? (
          filteredAuctions.map((nft) => (
            <div key={nft.id} className="flex justify-center">
              <NFTCard
                nft={nft}
                currentAddress={currentAddress}
                isAuction={true}
              />
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-400">
            No active auctions matching the selected filters.
          </p>
        )}
      </div>
    </div>
  );
};

export default Auction;
