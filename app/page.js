"use client";
import React from "react";
import Link from "next/link";
import Market from "./components/Market";
import Auction from "./components/Auction";
import CreatorsSection from "./components/CreatorsSection"; // Import the new CreatorsSection component
import { useMetaMask } from "./context/MetaMaskContext";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const HomePage = () => {
  const { isConnected, address, provider, connectMetaMask } = useMetaMask();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">
            Connect MetaMask to Explore NFTs
          </h1>
          <button
            onClick={connectMetaMask}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Connect MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white w-full">
      {/* Welcome Banner Section */}
      <section className="text-center py-16 bg-gradient-to-r from-blue-500 to-purple-600 w-full">
        <h1 className="text-5xl font-bold mb-4">
          Discover, Collect & Sell Rare Digital Artwork
        </h1>
        <p className="text-lg text-gray-200 mb-6">
          Explore, place bids, and own unique digital assets on the blockchain.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/auction"
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold"
          >
            Place a Bid
          </Link>
          <Link
            href="/market"
            className="bg-white hover:bg-gray-100 text-blue-600 py-3 px-6 rounded-lg font-semibold"
          >
            View Artwork
          </Link>
        </div>
      </section>

      {/* Market Section */}
      <section className="w-full px-4 lg:px-16 py-16">
        <Market
          provider={provider}
          contractAddress={contractAddress}
          currentAddress={address}
        />
      </section>

      {/* Auctions Section */}
      <section className="bg-gray-800 py-16 w-full px-4 lg:px-16">
        <Auction
          provider={provider}
          contractAddress={contractAddress}
          currentAddress={address}
        />
      </section>

      {/* Featured Creators Section */}
      <section className="w-full px-4 lg:px-16 py-16">
        <CreatorsSection />
      </section>
    </div>
  );
};

export default HomePage;
