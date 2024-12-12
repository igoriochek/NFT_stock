'use client';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import NFTCard from './NFTCard';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';

const Market = ({ provider, contractAddress, currentAddress }) => {
  const [listedNFTs, setListedNFTs] = useState([]);
  const [filteredNFTs, setFilteredNFTs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [localProvider, setLocalProvider] = useState(null);

  // Use Hardhat local provider if MetaMask is not connected
  useEffect(() => {
    if (!provider && !localProvider) {
      const hardhatProvider = new ethers.providers.JsonRpcProvider(
        'http://127.0.0.1:8545'
      );
      setLocalProvider(hardhatProvider);
    }
  }, [provider]);

  const activeProvider = provider || localProvider;

  useEffect(() => {
    if (activeProvider) {
      loadListedNFTs();
    }
  }, [activeProvider]);

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFilteredNFTs(listedNFTs);
    } else {
      const filtered = listedNFTs.filter((nft) =>
        nft.categories.some((cat) => selectedCategories.includes(cat))
      );
      setFilteredNFTs(filtered);
    }
  }, [selectedCategories, listedNFTs]);

  const loadListedNFTs = async () => {
    try {
      if (!activeProvider) return;

      const contract = new ethers.Contract(
        contractAddress,
        ArtNFT.abi,
        activeProvider
      );
      const listedTokens = await contract.getListedTokens();
      const items = [];

      for (let i = 0; i < listedTokens.length; i++) {
        const tokenId = listedTokens[i];
        const tokenURI = await contract.tokenURI(tokenId);
        const price = await contract.getPrice(tokenId);
        const owner = await contract.ownerOf(tokenId);
        const categories = await contract.getCategories(tokenId);

        const response = await fetch(tokenURI);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata for token ${tokenId}`);
        }
        const metadata = await response.json();

        items.push({
          id: tokenId,
          price: ethers.utils.formatUnits(price, 'ether'),
          owner,
          categories,
          ...metadata,
        });
      }

      const uniqueCategories = Array.from(
        new Set(items.flatMap((nft) => nft.categories))
      );
      setCategories(uniqueCategories);
      setListedNFTs(items);
    } catch (error) {
      console.error('Error loading listed NFTs:', error);
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
    <div className="w-full px-4 lg:px-16">
      <h1 className="text-5xl font-bold text-gray-100 text-center my-8">
        Market
      </h1>

      {/* Category Filter */}
      <div className="bg-gray-800 p-4 rounded-lg mb-8">
        <h2 className="text-lg font-bold text-gray-300 mb-4">
          Filter by Categories
        </h2>
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

      {/* NFT Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredNFTs.length > 0 ? (
          filteredNFTs.map((nft) => (
            <div key={nft.id} className="flex justify-center">
              <NFTCard
                nft={nft}
                currentAddress={currentAddress}
                activeProvider={activeProvider}
                isAuction={false}
              />
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-400">
            No NFTs matching the selected filters.
          </p>
        )}
      </div>
    </div>
  );
};

export default Market;
