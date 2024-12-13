"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useParams } from "next/navigation";
import { useMetaMask } from "@/app/context/MetaMaskContext";
import ArtNFT from "@/artifacts/contracts/ArtNFT.sol/ArtNFT.json";
import PlaceBidModal from "@/app/modals/PlaceBidModal";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { shortenAddress } from "@/app/utils/shortenAddress";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { getUserProfileByAddress } from "@/app/utils/firebaseUtils";
import {
  createAuctionWinNotification,
  createAuctionSaleNotification,
} from "@/app/utils/notifications";
import {
  incrementBoughtCount,
  incrementSoldCount,
  updatePriceHistory,
  getPriceHistory,
} from "@/app/utils/firebaseStatistics";
import { getHardhatProvider } from "@/app/utils/getHardhatProvider";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const NFTDetail = () => {
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("bids");
  const [bids, setBids] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const { id } = useParams();

  // Use MetaMaskContext to get provider and address
  const {
    isConnected,
    provider: metaMaskProvider,
    address,
    connectMetaMask,
  } = useMetaMask();
  const hardhatProvider = getHardhatProvider();
  const activeProvider = isConnected ? metaMaskProvider : hardhatProvider;

  useEffect(() => {
    if (activeProvider && id && contractAddress) {
      loadNFTDetails();
      fetchPriceHistory();
      loadBidHistory();
      listenForNewBids(); // Listen for new bids in real-time
      listenForAuctionEnd(); // Listen for auction completion
    }
    // Cleanup to avoid duplicate listeners
    return () => {
      const contract = new ethers.Contract(
        contractAddress,
        ArtNFT.abi,
        activeProvider
      );
      contract.removeAllListeners("AuctionEnded");
      contract.removeAllListeners("BidPlaced");
    };
  }, [activeProvider, id]);

  const fetchPriceHistory = async () => {
    const history = await getPriceHistory(id);
    setPriceHistory(history);
  };

  const loadNFTDetails = async () => {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        ArtNFT.abi,
        activeProvider
      );

      const nftListingType = await contract.listingTypes(id);
      if (nftListingType !== 2) {
        // Check if the NFT is listed as Auction
        // Redirect to the correct page if it's not listed in Auction
        window.location.href = `/market/${id}`;
        return;
      }

      const tokenURI = await contract.tokenURI(id);
      const response = await fetch(tokenURI);
      const metadata = await response.json();
      const owner = await contract.ownerOf(id);
      const auctionDetails = await contract.getAuctionDetails(id);

      setNft({
        id,
        owner,
        highestBid: auctionDetails[2],
        highestBidder: auctionDetails[1],
        endTime: auctionDetails[3],
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
      const contract = new ethers.Contract(
        contractAddress,
        ArtNFT.abi,
        activeProvider
      );

      // Fetch all BidPlaced events
      const filter = contract.filters.BidPlaced();
      const events = await contract.queryFilter(filter);

      // Filter only the bids related to the current NFT (by comparing tokenId)
      const bidHistory = await Promise.all(
        events
          .filter((event) => event.args.tokenId.toString() === id.toString()) // Filter by tokenId
          .map(async (event) => {
            const bidder = event.args.bidder;
            const bidderProfile = await getUserProfileByAddress(bidder);
            const bidderName =
              bidderProfile?.username || shortenAddress(bidder);

            // Get the block information using the block number
            const block = await activeProvider.getBlock(event.blockNumber);
            const transactionDate = new Date(block.timestamp * 1000); // Convert to milliseconds and create a date object

            return {
              bidder: bidderName,
              amount: ethers.utils.formatUnits(event.args.amount, "ether"),
              timestamp: event.blockNumber,
              date: transactionDate.toLocaleDateString(), // Format the date
              time: transactionDate.toLocaleTimeString(), // Format the time
            };
          })
      );

      setBids(bidHistory);
    } catch (error) {
      console.error("Error loading bid history:", error);
    }
  };

  const listenForNewBids = () => {
    const contract = new ethers.Contract(
      contractAddress,
      ArtNFT.abi,
      activeProvider
    );

    // Listen for bids only on the current NFT (filter by tokenId)
    contract.on("BidPlaced", (tokenId, bidder, amount) => {
      if (tokenId.toString() === id.toString()) {
        // Ensure both are strings for comparison
        loadBidHistory();
      }
    });

    return () => {
      contract.removeAllListeners("BidPlaced");
    };
  };

  // Auction End Listener
  const listenForAuctionEnd = () => {
    const contract = new ethers.Contract(
      contractAddress,
      ArtNFT.abi,
      activeProvider
    );

    contract.on("AuctionEnded", async (tokenId, winner, finalBid) => {
      if (tokenId.toString() === id.toString()) {
        const finalBidFormatted = ethers.utils.formatUnits(finalBid, "ether");

        const lastPriceEntry = priceHistory[priceHistory.length - 1] || {
          price: "0",
        };
        const lastPrice = parseFloat(lastPriceEntry.price);

        const changeType =
          lastPrice === 0
            ? "starting"
            : finalBidFormatted > lastPrice
            ? "increase"
            : "decrease";

        await updatePriceHistory(tokenId, finalBidFormatted, changeType);

        // Notify Auction Winner
        await createAuctionWinNotification({
          winnerId: winner,
          nftId: tokenId,
          finalBid: finalBidFormatted,
        });

        // Notify Seller About Sale
        await createAuctionSaleNotification({
          sellerId: nft.owner,
          nftId: tokenId,
          finalBid: finalBidFormatted,
        });

        await incrementBoughtCount(winner);
        await incrementSoldCount(nft.owner);

        // Refresh Auction Details
        loadNFTDetails();
      }
    });

    return () => {
      contract.removeAllListeners("AuctionEnded");
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
                  Bid placed: {bid.amount} ETH by {bid.bidder} {}
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
              <a
                href={`https://twitter.com/intent/tweet?url=${window.location.href}&text=${nft.title}`}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all"
              >
                <FaTwitter className="text-blue-500 w-6 h-6" />
              </a>

              {/* Facebook Share */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all"
              >
                <FaFacebook className="text-blue-600 w-6 h-6" />
              </a>

              {/* Instagram Share (Custom link, as Instagram doesn't support web-based shares) */}
              <a
                href="https://www.instagram.com"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all"
                target="_blank"
                rel="noreferrer"
              >
                <FaInstagram className="text-pink-500 w-6 h-6" />
              </a>

              {/* LinkedIn Share */}
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}&title=${nft.title}`}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all"
              >
                <FaLinkedin className="text-blue-700 w-6 h-6" />
              </a>
            </div>
          </div>
        );
      case "history":
        return (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Bid History Chart</h2>
            {bids.length > 0 ? (
              <div>
                <Line
                  data={{
                    labels: bids.map((bid) =>
                      new Date(bid.timestamp).toLocaleString()
                    ),
                    datasets: [
                      {
                        label: "Bid Amount (ETH)",
                        data: bids.map((bid) => parseFloat(bid.amount)),
                        borderColor: "#4caf50",
                        backgroundColor: "rgba(76, 175, 80, 0.2)",
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: {
                        labels: {
                          color: "white",
                        },
                      },
                    },
                    scales: {
                      x: {
                        ticks: {
                          color: "white",
                        },
                      },
                      y: {
                        ticks: {
                          color: "white",
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p>No bid history available.</p>
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
  const minBid =
    parseFloat(ethers.utils.formatUnits(nft.highestBid, "ether")) + 0.1;

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
              <p className="text-sm font-bold text-gray-400 ">Owner:</p>
              <p className="text-xs text-white">{shortenAddress(nft.owner)}</p>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <div>
              <p className="text-sm text-gray-400">Minimum Bid:</p>
              <p className="font-semibold text-lg text-white">{minBid} ETH</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Bid:</p>
              <p className="font-semibold text-lg text-white">
                {ethers.utils.formatUnits(nft.highestBid, "ether")} ETH
              </p>
            </div>
          </div>

          <div className="mt-4">
            <CountdownTimer endTime={nft.endTime} />
          </div>

          <div className="mt-4">
            <button
              className={`py-3 px-4 rounded-lg ${
                !isConnected ||
                isAuctionEnded ||
                nft?.owner?.toLowerCase() === address?.toLowerCase()
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white transition-all`}
              onClick={() =>
                isConnected &&
                !isAuctionEnded &&
                nft?.owner?.toLowerCase() !== address?.toLowerCase() &&
                setShowModal(true)
              }
              disabled={
                !isConnected ||
                isAuctionEnded ||
                nft?.owner?.toLowerCase() === address?.toLowerCase()
              }
              title={
                !isConnected
                  ? "Connect MetaMask to place a bid"
                  : isAuctionEnded
                  ? "You cannot bid on ended auction"
                  : nft?.owner?.toLowerCase() === address?.toLowerCase()
                  ? "You cannot bid on your own NFT"
                  : "Place a bid"
              }
            >
              {!isConnected
                ? "Connect Wallet"
                : nft?.owner?.toLowerCase() === address?.toLowerCase()
                ? "Owner cannot bid"
                : isAuctionEnded
                ? "Auction Ended"
                : "Place a Bid"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex space-x-4 border-b">
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all hover:from-blue-600 hover:to-blue-500"
            onClick={() => setActiveTab("bids")}
          >
            Bids
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all hover:from-blue-600 hover:to-blue-500"
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-2 px-4 rounded-lg ${
              activeTab === "history" ? "bg-blue-500" : "bg-blue-600"
            } text-white`}
          >
            History
          </button>
        </div>

        <div className="mt-4 transition-opacity duration-500">
          {renderTabContent()}
        </div>
      </div>

      {showModal && (
        <PlaceBidModal
          nft={nft}
          closeModal={() => setShowModal(false)}
          provider={activeProvider}
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
