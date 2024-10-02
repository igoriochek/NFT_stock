'use client';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import NFTCard from './NFTCard';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';

const Auction = ({ provider, contractAddress, currentAddress }) => {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    if (provider) {
      loadAuctions();
    }
  }, [provider]);

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
          const owner = await contract.ownerOf(i); // Fetch the owner from the contract
  
          const response = await fetch(tokenURI);
  
          if (!response.ok) {
            throw new Error(`Failed to fetch metadata for token ${i}`);
          }
  
          const metadata = await response.json();
  
          // Push all relevant NFT data into the items array, including the owner
          items.push({
            id: i,
            highestBidder,
            highestBid: highestBid.toString(),
            endTime,
            owner, // Add owner field here
            ...metadata, // Include metadata like title, image, etc.
          });
        }
      }
  
      setAuctions(items);
    } catch (error) {
      console.error('Error loading auctions:', error);
    }
  };
  

  return (
    <div className="container mx-auto px-8 lg:px-16">
      <h1 className="text-5xl font-bold text-gray-100 text-center my-8 shadow-md">Live Auctions</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10">
        {auctions.length > 0 ? (
          auctions.map((nft) => (
            <div key={nft.id} className="flex justify-center">
              <NFTCard
                nft={nft}
                currentAddress={currentAddress}
                isAuction={true}
              />
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-400">No active auctions.</p>
        )}
      </div>
    </div>
  );
};

export default Auction;
