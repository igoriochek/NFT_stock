"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import NFTCard from "./NFTCard";
import ArtNFT from "@/artifacts/contracts/ArtNFT.sol/ArtNFT.json";
import FilterPanel from "./FilterPanel";
import { getHardhatProvider } from "../utils/getHardhatProvider";

const Market = ({ provider, contractAddress, currentAddress }) => {
  const [listedNFTs, setListedNFTs] = useState([]);
  const [filteredNFTs, setFilteredNFTs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priceSteps, setPriceSteps] = useState([]); // Array of unique prices
  const [filters, setFilters] = useState({
    selectedCategories: [],
    priceRange: [0, 0], // Min and max indexes
    sortOrder: "newest",
  });
  const [activeProvider, setActiveProvider] = useState(null);

  // Initialize provider only once
  useEffect(() => {
    const initProvider = () => {
      if (provider) {
        setActiveProvider(provider);
      } else {
        const hardhatProvider = getHardhatProvider();
        setActiveProvider(hardhatProvider);
      }
    };

    initProvider();
  }, [provider]);

  // Load NFTs on provider change
  useEffect(() => {
    if (activeProvider) {
      loadListedNFTs();
    }
  }, [activeProvider]);

  // Apply filters to the listed NFTs
  useEffect(() => {
    let filtered = listedNFTs;

    // Filter by categories
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter((nft) =>
        nft.categories.some((cat) =>
          filters.selectedCategories.includes(cat)
        )
      );
    }

    // Filter by price range (use priceSteps)
    if (priceSteps.length > 0) {
      const [minIndex, maxIndex] = filters.priceRange;
      const minPrice = priceSteps[minIndex];
      const maxPrice = priceSteps[maxIndex];

      filtered = filtered.filter(
        (nft) =>
          parseFloat(nft.price) >= minPrice &&
          parseFloat(nft.price) <= maxPrice
      );
    }

    // Sort by selected order
    if (filters.sortOrder === "low_to_high") {
      filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (filters.sortOrder === "high_to_low") {
      filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (filters.sortOrder === "newest") {
      filtered.sort((a, b) => b.id - a.id);
    } else if (filters.sortOrder === "oldest") {
      filtered.sort((a, b) => a.id - b.id);
    }

    setFilteredNFTs(filtered);
  }, [filters, listedNFTs, priceSteps]);

  // Load listed NFTs from the contract
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
          price: parseFloat(ethers.utils.formatUnits(price, "ether")), // Parse price
          owner,
          categories,
          ...metadata,
        });
      }

      // Extract unique prices and sort them
      const uniquePrices = Array.from(new Set(items.map((nft) => nft.price))).sort(
        (a, b) => a - b
      );

      // Update state
      setPriceSteps(uniquePrices);
      setCategories([...new Set(items.flatMap((nft) => nft.categories))]);
      setListedNFTs(items);

      // Initialize filters with proper price range
      setFilters((prev) => ({
        ...prev,
        priceRange: [0, uniquePrices.length - 1], // Set to min and max indexes
      }));
    } catch (error) {
      console.error("Error loading listed NFTs:", error);
    }
  };

  return (
    <div className="w-full px-4 lg:px-16">
      <h1 className="text-5xl font-bold text-gray-100 text-center my-8">
        Market
      </h1>

      {/* Pass categories and priceSteps to FilterPanel */}
      <FilterPanel
        categories={categories}
        priceSteps={priceSteps} // Pass unique prices
        onFilterChange={(newFilters) => setFilters(newFilters)}
      />

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
