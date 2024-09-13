import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';

const NFTGallery = ({ provider, contractAddress, ownerAddress, showSellButton, onSell, onAuction, refreshNFTs }) => {
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    loadNFTs();
  }, [provider]);

  const loadNFTs = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
      const totalSupply = await contract.tokenCount();
      const items = [];

      for (let i = 1; i <= totalSupply; i++) {
        const tokenURI = await contract.tokenURI(i);
        const listed = await contract.listedTokens(i);
        const [auctionActive] = await contract.getAuctionDetails(i);

        const response = await fetch(tokenURI);
        if (response.ok) {
          const metadata = await response.json();
          items.push({
            id: i,
            metadata,
            listed,
            auctionActive,
          });
        }
      }

      setNfts(items);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    }
  };

  // This component will automatically refresh NFTs after listing or auction
  useEffect(() => {
    if (refreshNFTs) {
      refreshNFTs(); // Trigger refresh on any updates
    }
  }, [refreshNFTs]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {nfts.map((nft) => (
        <div
          key={nft.id}
          className="bg-gray-100 shadow-md hover:shadow-lg transition-shadow rounded-lg overflow-hidden"
        >
          <img
            src={nft.metadata.image}
            alt={nft.metadata.title}
            className="h-56 w-full object-cover"
          />

          <div className="p-4 bg-white">
            <h3 className="text-lg font-semibold text-gray-800">
              {nft.metadata.title}
            </h3>
            <p className="text-gray-600 mt-2">{nft.metadata.description}</p>

            {showSellButton && !nft.listed && !nft.auctionActive ? (
              <div className="mt-4 flex space-x-4 justify-between">
                <button
                  onClick={() => onSell(nft.id)}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-all transform hover:scale-105"
                >
                  Sell
                </button>
                <button
                  onClick={() => onAuction(nft.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-all transform hover:scale-105"
                >
                  Start Auction
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-gray-400">
                  Already listed or in auction
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NFTGallery;
