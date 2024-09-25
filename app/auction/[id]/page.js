"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useParams } from "next/navigation";
import { useMetaMask } from "@/app/context/MetaMaskContext"
import ArtNFT from "@/artifacts/contracts/ArtNFT.sol/ArtNFT.json";
import PlaceBidModal from "@/app/modals/PlaceBidModal";
import { shortenAddress } from "@/app/utils/shortenAddress";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const NFTDetail = () => {
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("bids");
  const [bids, setBids] = useState([]);

  const { id } = useParams();

  // Use MetaMaskContext to get provider and address
  const { isConnected, provider, address, connectMetaMask } = useMetaMask();

  useEffect(() => {
    if (provider && id && contractAddress) {
      loadNFTDetails();
      loadBidHistory(); // Load bid history
      listenForNewBids(); // Listen for new bids in real-time
    }
  }, [provider, id]);

  const loadNFTDetails = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
      const tokenURI = await contract.tokenURI(id);
      const response = await fetch(tokenURI);
      const metadata = await response.json();

      const owner = await contract.ownerOf(id);
      const [active, highestBidder, highestBid, endTime] = await contract.getAuctionDetails(id);

      setNft({
        id,
        owner,
        highestBid,
        highestBidder,
        endTime,
        ...metadata,
      });

      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const loadBidHistory = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
      const filter = contract.filters.BidPlaced(); // Remove the id parameter as it's non-indexed
      const events = await contract.queryFilter(filter);

      const bidHistory = events
        .filter((event) => event.args.tokenId.toString() === id)
        .map((event) => ({
          bidder: event.args.bidder,
          amount: ethers.utils.formatUnits(event.args.amount, "ether"),
          timestamp: event.blockNumber,
        }));

      setBids(bidHistory);
    } catch (error) {
      console.error("Error loading bid history:", error);
    }
  };

  const listenForNewBids = () => {
    const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
    contract.on("BidPlaced", (tokenId, bidder, amount) => {
      if (tokenId.toString() === id) {
        loadBidHistory();
      }
    });

    return () => {
      contract.removeAllListeners("BidPlaced");
    };
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "bids":
        return (
          <div>
            {bids.length > 0 ? (
              bids.map((bid, index) => (
                <p key={index}>
                  Bid placed: {bid.amount} ETH by {shortenAddress(bid.bidder)}
                </p>
              ))
            ) : (
              <p>No bids have been placed yet.</p>
            )}
          </div>
        );
      case "details":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Details</h2>
            <p>{nft.description}</p>

            <h2 className="text-xl font-bold mt-8">Share Item</h2>
            <div className="flex space-x-4 mt-4">
              {/* Twitter Share */}
              <a href={`https://twitter.com/intent/tweet?url=${window.location.href}&text=${nft.title}`} 
                 className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all">
                <FaTwitter className="text-blue-500 w-6 h-6" />
              </a>
              
              {/* Facebook Share */}
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`} 
                 className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all">
                <FaFacebook className="text-blue-600 w-6 h-6" />
              </a>

              {/* Instagram Share (Custom link, as Instagram doesn't support web-based shares) */}
              <a href="https://www.instagram.com" 
                 className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all" target="_blank" rel="noreferrer">
                <FaInstagram className="text-pink-500 w-6 h-6" />
              </a>

              {/* LinkedIn Share */}
              <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}&title=${nft.title}`} 
                 className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all">
                <FaLinkedin className="text-blue-700 w-6 h-6" />
              </a>
            </div>
          </div>
        );
      case "history":
        return (
          <div>
            {bids.length > 0 ? (
              bids.map((bid, index) => (
                <p key={index}>
                  Bid accepted {bid.amount} ETH by {shortenAddress(bid.bidder)} at block {bid.timestamp}
                </p>
              ))
            ) : (
              <p>No bidding history available.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <p>Loading NFT details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!nft) return <p>NFT not found or inactive.</p>;

  const isAuctionEnded = Math.floor(Date.now() / 1000) >= nft.endTime;
  const minBid = parseFloat(ethers.utils.formatUnits(nft.highestBid, "ether")) + 0.1;

  // If MetaMask is not connected, prompt to connect
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-white">
        <h1 className="text-3xl font-bold mb-6">NFT Details</h1>
        <p className="mb-6">Please connect to MetaMask to view NFT details and place bids.</p>
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
              <p className="text-sm font-bold text-white">Owner</p>
              <p className="text-xs text-gray-400">{shortenAddress(nft.owner)}</p>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <div>
              <p className="text-sm text-gray-400">Minimum Bid:</p>
              <p className="font-semibold text-lg text-white">{minBid} ETH</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Bid:</p>
              <p className="font-semibold text-lg text-white">{ethers.utils.formatUnits(nft.highestBid, "ether")} ETH</p>
            </div>
          </div>

          <div className="mt-4">
            <CountdownTimer endTime={nft.endTime} />
          </div>

          <div className="mt-4">
            <button
              className={`py-3 px-4 rounded-lg ${
                isAuctionEnded
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white transition-all`}
              onClick={() => !isAuctionEnded && setShowModal(true)}
              disabled={isAuctionEnded}
              title={isAuctionEnded ? "You cannot bid on ended auction" : ""}
            >
              Place a Bid
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex space-x-4 border-b">
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all hover:from-blue-600 hover:to-blue-500" onClick={() => setActiveTab("bids")}>
            Bids
          </button>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all hover:from-blue-600 hover:to-blue-500" onClick={() => setActiveTab("details")}>
            Details
          </button>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all hover:from-blue-600 hover:to-blue-500" onClick={() => setActiveTab("history")}>
            History
          </button>
        </div>

        <div className="mt-4 transition-opacity duration-500">{renderTabContent()}</div>
      </div>

      {showModal && (
        <PlaceBidModal 
          nft={nft} 
          closeModal={() => setShowModal(false)} 
          provider={provider} 
          contractAddress={contractAddress} 
          refreshAuctions={loadNFTDetails}
          minBid={minBid} // Pass dynamic minBid to the modal
        />
      )}
    </div>
  );
};

const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  function calculateTimeLeft(endTime) {
    const now = Math.floor(Date.now() / 1000);
    const remainingTime = endTime - now;
    if (remainingTime <= 0) return "Auction Ended";

    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return <span className="text-blue-600 font-semibold">{timeLeft}</span>;
};

export default NFTDetail;
