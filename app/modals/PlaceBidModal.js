import React, { useState } from 'react';
import { ethers } from 'ethers';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';
import { useMetaMask } from "@/app/context/MetaMaskContext";
import {
  createNewBidNotification,
  createOutbidNotification,
} from "@/app/utils/notifications";

const PlaceBidModal = ({ nft, closeModal, provider, contractAddress, refreshAuctions }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { address } = useMetaMask();
  const minBid = parseFloat(ethers.utils.formatUnits(nft.highestBid, 'ether')) + 0.1;
  const serviceFee = 0.25;
  const totalBidAmount = (parseFloat(bidAmount || 0) + serviceFee).toFixed(2);

  const placeBid = async () => {
    if (!provider || !contractAddress || !address) {
      alert("Wallet not connected!");
      return;
    }
  
    if (!bidAmount || isNaN(parseFloat(bidAmount)) || parseFloat(bidAmount) <= 0) {
      alert("Please enter a valid bid amount!");
      return;
    }
  
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);
  
      
      const parsedBidAmount = ethers.utils.parseEther(bidAmount.toString());
  
      const transaction = await contract.placeBid(nft.id, {
        value: parsedBidAmount,
      });
  
      await transaction.wait();
  
      alert("Bid placed successfully!");
      refreshAuctions();
      closeModal();
  
      // Notifications
      const previousBidderId = nft.highestBidder;
      const currentBidderId = address;
      const bidAmountFormatted = ethers.utils.formatUnits(parsedBidAmount, "ether");
  
      await createNewBidNotification({
        sellerId: nft.owner,
        bidderId: currentBidderId,
        nftId: nft.id,
        bidAmount: bidAmountFormatted,
      });
  
      if (previousBidderId && previousBidderId !== currentBidderId) {
        await createOutbidNotification({
          previousBidderId,
          nftId: nft.id,
          refundAmount: ethers.utils.formatUnits(nft.highestBid, "ether"),
        });
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      alert(`Error: ${error.message}`);
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Place Your Bid</h2>
          <button
            className="text-gray-700 hover:text-gray-600 text-xl font-bold p-2 focus:outline-none"
            onClick={closeModal}
            style={{ backgroundColor: 'transparent' }}
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bidAmount">
            Bid Amount (ETH)
          </label>
          <input
            id="bidAmount"
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter bid amount"
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <p className="text-gray-500 text-sm mb-4">
          Minimum bid is <span className="font-bold">{minBid} ETH</span>
        </p>

        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-700 text-sm">Total bid amount:</p>
          <p className="text-gray-700 text-sm font-bold">{totalBidAmount} ETH</p>
        </div>

        <button
          className={`bg-blue-500 text-white py-3 px-4 rounded-lg w-full hover:bg-blue-600 transition-all ${
            loading ? 'cursor-not-allowed' : ''
          }`}
          onClick={placeBid}
          disabled={loading}
        >
          {loading ? 'Placing Bid...' : 'Place Bid'}
        </button>
      </div>
    </div>
  );
};

export default PlaceBidModal;
