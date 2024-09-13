import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';

const NFTCard = ({ nft, currentAddress, onBuy, isAuction, onBid }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (isAuction && nft.endTime) {
      const interval = setInterval(() => {
        setTimeLeft(calculateTimeLeft(nft.endTime));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isAuction, nft.endTime]);

  const calculateTimeLeft = (endTime) => {
    const now = Math.floor(Date.now() / 1000);
    const remainingTime = endTime - now;
    if (remainingTime <= 0) return 'Auction Ended';

    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const handleLikeClick = () => {
    setLiked(!liked);
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden p-4 w-full max-w-lg mx-auto transition-transform transform hover:scale-105">
      <div className="relative">
        {/* Use different routes based on whether it's an auction or market listing */}
        <Link href={isAuction ? `/auction/${nft.id}` : `/market/${nft.id}`}>
          <img
            src={nft.image || 'https://via.placeholder.com/565x551'}
            alt={nft.title}
            className="w-full h-64 object-cover rounded-md cursor-pointer"
          />
        </Link>

        {isAuction && (
          <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-md font-semibold">
            {timeLeft}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        {/* Owner Profile */}
        <div className="flex items-center space-x-2">
          <img
            src={nft.ownerAvatar || '/default-avatar.png'}
            alt={nft.owner || 'Unknown owner'}
            className="w-9 h-9 rounded-full border-2 border-blue-400 object-cover"
          />
          <span className="text-sm font-medium text-gray-700 truncate w-32">
            {nft.owner ? `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}` : 'Unknown Owner'}
          </span>
        </div>

        {/* Like Button */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleLikeClick}
            className={`p-1 w-8 h-8 rounded-full transition-colors duration-300 focus:outline-none ${
              liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
            aria-label="Like NFT"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              fill={liked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={liked ? 0 : 2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21C12 21 5 14.5 5 9.5C5 7.5 6.5 6 8.5 6C10 6 11 7 12 8C13 7 14 6 15.5 6C17.5 6 19 7.5 19 9.5C19 14.5 12 21 12 21Z"
              />
            </svg>
          </button>
          <span className="text-sm text-gray-600">{nft.likes || 0} Likes</span>
        </div>
      </div>

      <div className="mt-4">
        {/* Use different routes for title based on whether it's an auction or market listing */}
        <Link href={isAuction ? `/auction/${nft.id}` : `/market/${nft.id}`}>
          <h3 className="text-lg font-semibold text-gray-800 hover:underline cursor-pointer">
            {nft.title || 'Untitled NFT'}
          </h3>
        </Link>
        <p className="text-sm text-gray-500">{nft.description || 'No description available.'}</p>
      </div>

      <div className="mt-4 bg-gray-50 p-3 rounded-lg flex justify-between items-center">
        {isAuction ? (
          <>
            <span className="block text-sm text-gray-500">Current Bid</span>
            <span className="block text-lg font-semibold text-gray-800">
              {ethers.utils.formatUnits(nft.highestBid, 'ether')} ETH
            </span>
          </>
        ) : (
          <>
            <span className="block text-sm text-gray-500">Price</span>
            <span className="block text-lg font-semibold text-gray-800">{nft.price} ETH</span>
          </>
        )}
      </div>

      <div className="mt-4">
        {nft.owner && nft.owner.toLowerCase() !== currentAddress?.toLowerCase() ? (
          <>
            {isAuction ? (
              <button
                onClick={() => onBid(nft)}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg w-full hover:bg-blue-600 transition-all font-semibold"
              >
                Place Bid
              </button>
            ) : (
              <button
                onClick={() => onBuy(nft)}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg w-full hover:bg-blue-600 transition-all font-semibold"
              >
                Buy Now
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center">Your NFT</p>
        )}
      </div>
    </div>
  );
};

export default NFTCard;
