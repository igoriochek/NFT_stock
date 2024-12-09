"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useParams } from "next/navigation";
import { useMetaMask } from "@/app/context/MetaMaskContext"
import ArtNFT from "@/artifacts/contracts/ArtNFT.sol/ArtNFT.json";
import { shortenAddress } from "@/app/utils/shortenAddress";
import { createNFTPurchaseNotification } from "@/app/utils/notifications";
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const MarketNFTDetail = () => {
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { id } = useParams();

  // Use MetaMaskContext to get provider, current address, and connection state
  const { isConnected, provider, address, connectMetaMask } = useMetaMask();

  useEffect(() => {
    if (provider && id && contractAddress) {
      loadNFTDetails();
    }
  }, [provider, id]);
  
  const loadNFTDetails = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
  
      const nftListingType = await contract.listingTypes(id);
      if (nftListingType !== 1) { // Check if the NFT is listed as Market
        // Redirect to the correct page if it's not listed in Market
        window.location.href = `/auction/${id}`;
        return;
      }
  
      const tokenURI = await contract.tokenURI(id);
      const response = await fetch(tokenURI);
      const metadata = await response.json();
      const owner = await contract.ownerOf(id);
      const nftPrice = await contract.getPrice(id);
  
      setNft({
        id,
        owner,
        price: ethers.utils.formatUnits(nftPrice, "ether"),
        ...metadata,
      });
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };
  

  const buyNFT = async () => {
    if (nft.owner.toLowerCase() === address.toLowerCase()) {
      alert("You cannot buy your own NFT.");
      return;
    }
  
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);
  
      const transaction = await contract.buy(nft.id, {
        value: ethers.utils.parseEther(nft.price),
      });
      await transaction.wait();
  
      alert("NFT bought successfully!");
  
      // Notify the previous owner
      await createNFTPurchaseNotification({
        sellerId: nft.owner,
        buyerId: address,
        nftId: nft.id,
        nftTitle: nft.title,
        purchasePrice: nft.price,
      });
    } catch (error) {
      console.error("Error buying NFT:", error);
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) return <p>Loading NFT details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!nft) return <p>NFT not found or inactive.</p>;

  // If MetaMask is not connected, prompt to connect
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-white">
        <h1 className="text-3xl font-bold mb-6">NFT Details</h1>
        <p className="mb-6">Please connect to MetaMask to view NFT details and make purchases.</p>
        <button
          onClick={connectMetaMask}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg"
        >
          Connect MetaMask
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2">
          <img src={nft.image} alt={nft.title} className="rounded-lg w-full" />
        </div>

        <div className="w-full md:w-1/2 md:ml-8 mt-4 md:mt-0">
          <h1 className="text-3xl font-bold text-white">{nft.title}</h1>
          <p className="text-gray-300 mt-2">{nft.description}</p>

          <div className="flex justify-between mt-6">
            <div className="text-center">
              <p className="text-sm font-bold text-white">{shortenAddress(nft.owner)}</p>
              <p className="text-xs text-gray-400">Owner</p>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 p-3 rounded-lg">
            <span className="block text-sm text-gray-500">Price:</span>
            <span className="block text-lg font-semibold text-gray-800">
              {nft.price} ETH {/* Display the price from the smart contract */}
            </span>
          </div>

          <div className="mt-4">
            <button
              onClick={buyNFT}
              className="bg-blue-500 text-white py-3 px-4 rounded-lg w-full hover:bg-blue-600 transition-all"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketNFTDetail;
