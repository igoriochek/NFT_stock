"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useParams } from "next/navigation";
import ArtNFT from "@/artifacts/contracts/ArtNFT.sol/ArtNFT.json";
import MetamaskAuth from "@/app/components/MetamaskAuth";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const MarketNFTDetail = () => {
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState(null); // Store the price of the NFT

  const { id } = useParams();

  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const address = accounts[0];
          setProvider(provider);
          setAddress(address);
        }
      }
    };

    if (!provider) {
      checkMetaMaskConnection();
    }
  }, [provider]);

  useEffect(() => {
    if (provider && id && contractAddress) {
      loadNFTDetails();
    }
  }, [provider, id]);

  const loadNFTDetails = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
      const tokenURI = await contract.tokenURI(id);
      const response = await fetch(tokenURI);
      const metadata = await response.json();

      const owner = await contract.ownerOf(id);
      const nftPrice = await contract.getPrice(id); // Fetch the price from the smart contract

      setNft({
        id,
        owner,
        price: ethers.utils.formatUnits(nftPrice, "ether"), // Convert price to ETH
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
        value: ethers.utils.parseUnits(nft.price, 'ether'),
      });
      await transaction.wait();

      alert("NFT bought successfully!");
    } catch (error) {
      console.error("Error buying NFT:", error);
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) return <p>Loading NFT details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!nft) return <p>NFT not found or inactive.</p>;

  return (
    <div className="container mx-auto p-8">
      {!provider && <MetamaskAuth setAddress={setAddress} setProvider={setProvider} />}
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2">
          <img src={nft.image} alt={nft.title} className="rounded-lg w-full" />
        </div>

        <div className="w-full md:w-1/2 md:ml-8 mt-4 md:mt-0">
          <h1 className="text-3xl font-bold text-white">{nft.title}</h1>
          <p className="text-gray-300 mt-2">{nft.description}</p>

          <div className="flex justify-between mt-6">
            <div className="text-center">
              <p className="text-sm font-bold text-white">{nft.owner}</p>
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
