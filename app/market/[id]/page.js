"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useParams } from "next/navigation";
import { useMetaMask } from "@/app/context/MetaMaskContext";
import ArtNFT from "@/artifacts/contracts/ArtNFT.sol/ArtNFT.json";
import { shortenAddress } from "@/app/utils/shortenAddress";
import { createNFTPurchaseNotification } from "@/app/utils/notifications";
import { getHardhatProvider } from "@/app/utils/getHardhatProvider";
import {
  getPriceHistory,
  updatePriceHistory,
} from "@/app/utils/firebaseStatistics";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const MarketNFTDetail = () => {
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [priceHistory, setPriceHistory] = useState([]);

  const { id } = useParams();

  // Use MetaMaskContext to get provider, current address, and connection state
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
      loadPriceHistory(); // Load price history on page load
    }
  }, [activeProvider, id]);

  const loadNFTDetails = async () => {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        ArtNFT.abi,
        activeProvider
      );

      const nftListingType = await contract.listingTypes(id);
      if (nftListingType !== 1) {
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

  const loadPriceHistory = async () => {
    try {
      const history = await getPriceHistory(id);
      if (history) setPriceHistory(history);
    } catch (error) {
      console.error("Error loading price history:", error);
    }
  };

  const buyNFT = async () => {
    if (nft.owner.toLowerCase() === address.toLowerCase()) {
      alert("You cannot buy your own NFT.");
      return;
    }

    try {
      const signer = activeProvider.getSigner();
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

      // Update price history in Firestore
      await updatePriceHistory(id, nft.price, "bought");

      // Refresh details after purchase
      loadNFTDetails();
      loadPriceHistory(); // Reload price history
    } catch (error) {
      console.error("Error buying NFT:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Details</h2>
            <p>{nft.description}</p>
          </div>
        );

      case "history":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Price History</h2>
            {priceHistory.length > 0 ? (
              priceHistory.map((entry, index) => (
                <p key={index} className="text-gray-300">
                  {entry.changeType === "starting" ? (
                    <span className="text-blue-500">Initial Price:</span>
                  ) : entry.changeType === "increase" ? (
                    <span className="text-green-500">Increased to:</span>
                  ) : (
                    <span className="text-red-500">Decreased to:</span>
                  )}{" "}
                  {entry.price} ETH on{" "}
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              ))
            ) : (
              <p className="text-gray-300">No price history available.</p>
            )}
          </div>
        );

      case "chart":
        const chartData = {
          labels: priceHistory.map(
            (entry) =>
              new Date(entry.timestamp).toLocaleDateString() +
              " " +
              new Date(entry.timestamp).toLocaleTimeString()
          ),
          datasets: [
            {
              label: "Price in ETH",
              data: priceHistory.map((entry) => parseFloat(entry.price)),
              borderColor: "#1E90FF",
              backgroundColor: "rgba(30, 144, 255, 0.2)",
              color: "white",
              tension: 0.3,
            },
          ],
        };

        const chartOptions = {
          responsive: true,
          maintainAspectRatio: false, // Allows dynamic height
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: "white",
              },
            },
            title: {
              display: true,
              text: "NFT Price History",
              color: "white",
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Date & Time",
                color: "white",
              },
              ticks: {
                color: "white",
              },
              grid: {
                color: "#3B4253",
              },
            },
            y: {
              title: {
                display: true,
                text: "Price (ETH)",
                color: "white",
              },
              ticks: {
                color: "white",
              },
              grid: {
                color: "#3B4253",
              },
            },
          },
        };

        return (
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">
              Price History Chart
            </h2>
            <div className="w-full max-w-6xl mx-auto p-4">
              <div className="w-full" style={{ height: "500px" }}>
                <Line options={chartOptions} data={chartData} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return <p>Loading NFT details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!nft) return <p>NFT not found or inactive.</p>;

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
              <p className="text-xs text-gray-400">
                {shortenAddress(nft.owner)}
              </p>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 p-3 rounded-lg">
            <span className="block text-sm text-gray-500">Price:</span>
            <span className="block text-lg font-semibold text-gray-800">
              {nft.price} ETH
            </span>
          </div>

          <div className="mt-4">
            <button
              className={`py-3 px-4 rounded-lg w-full ${
                !isConnected ||
                nft?.owner?.toLowerCase() === address?.toLowerCase()
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white transition-all`}
              onClick={() =>
                isConnected &&
                nft?.owner?.toLowerCase() !== address?.toLowerCase() &&
                buyNFT()
              }
              disabled={
                !isConnected ||
                nft?.owner?.toLowerCase() === address?.toLowerCase()
              }
              title={
                !isConnected
                  ? "Connect MetaMask to purchase"
                  : nft?.owner?.toLowerCase() === address?.toLowerCase()
                  ? "You cannot buy your own NFT"
                  : "Buy this NFT"
              }
            >
              {!isConnected
                ? "Connect Wallet"
                : nft?.owner?.toLowerCase() === address?.toLowerCase()
                ? "Owner Cannot Buy"
                : "Buy Now"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex space-x-4 border-b">
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all hover:from-blue-600 hover:to-blue-500"
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all hover:from-blue-600 hover:to-blue-500"
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all hover:from-blue-600 hover:to-blue-500"
            onClick={() => setActiveTab("chart")}
          >
            Chart
          </button>
        </div>

        <div className="mt-4 transition-opacity duration-500">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default MarketNFTDetail;
