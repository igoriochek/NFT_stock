"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { useMetaMask } from "../context/MetaMaskContext";
import NFTGallery from "../components/NftGallery";
import SellModal from "../modals/SellModal";
import AuctionModal from "../modals/AuctionModal";
import ArtNFT from "@/artifacts/contracts/ArtNFT.sol/ArtNFT.json";
import { incrementMintedCount } from "../utils/firebaseStatistics";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const EXPECTED_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID);
const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;

const Upload = () => {
  const [formInput, setFormInput] = useState({ title: "", description: "" });
  const [fileUrl, setFileUrl] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [nfts, setNfts] = useState([]);

  const {
    isConnected,
    provider,
    address: currentAddress,
    connectMetaMask,
  } = useMetaMask();

  // Function to handle file upload to Pinata (IPFS)
  const onChange = async (e) => {
    const file = e.target.files[0];
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${pinataJwt}`,
          },
        }
      );
      const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
      setFileUrl(url);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // Function to handle category selection
  const handleCategoryChange = (category, isChecked) => {
    if (isChecked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(
        selectedCategories.filter((item) => item !== category)
      );
    }
  };

  // Function to mint the NFT and create a Firebase document
  const uploadAndMint = async () => {
    const { title, description } = formInput;
    if (!title || !description || !fileUrl || selectedCategories.length === 0)
      return;

    const data = {
      pinataMetadata: { name: title },
      pinataContent: {
        title,
        description,
        image: fileUrl,
        creator: currentAddress,
        categories: selectedCategories,
      },
    };

    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pinataJwt}`,
          },
        }
      );
      const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;

      if (!provider) {
        alert("Please connect to MetaMask first.");
        return;
      }

      const network = await provider.getNetwork();
      if (network.chainId !== EXPECTED_CHAIN_ID) {
        alert("Please connect to the correct network.");
        return;
      }

      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);
      let transaction = await contract.mint(url);
      await transaction.wait();

      await incrementMintedCount(currentAddress);

      alert("NFT Minted Successfully!");
      refreshNFTs();
    } catch (error) {
      console.error("Error uploading or minting:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Function to refresh NFTs
  const refreshNFTs = async () => {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        ArtNFT.abi,
        provider
      );
      const totalSupply = await contract.tokenCount();
      const items = [];

      for (let i = 1; i <= totalSupply; i++) {
        const owner = await contract.ownerOf(i);
        if (owner.toLowerCase() === currentAddress.toLowerCase()) {
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
      }
      setNfts(items);
    } catch (error) {
      console.error("Error loading NFTs:", error);
    }
  };

  const handleSellNFT = async (price) => {
    if (!provider) {
      alert("Please connect to MetaMask first.");
      return;
    }

    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);
    await contract.listForSale(selectedTokenId, ethers.utils.parseEther(price));
    alert("NFT Listed for Sale!");

    setShowSellModal(false);
    refreshNFTs();
  };

  const handleStartAuction = async (duration) => {
    if (!provider) {
      alert("Please connect to MetaMask first.");
      return;
    }

    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);
    await contract.startAuction(selectedTokenId, duration);
    alert("Auction Started!");

    setShowAuctionModal(false);
    refreshNFTs();
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-white">
        <h1 className="text-3xl text-white font-bold mb-6">Upload and Mint Your NFT</h1>
        <p className="mb-6">Please connect to MetaMask to proceed.</p>
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
    <div className="container mx-auto p-8 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white text-center mb-8">
        Upload and Mint Your NFT
      </h1>

      <div className="bg-gray-800 p-8 rounded-lg shadow-md max-w-xl mx-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="NFT Title"
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md"
              onChange={(e) =>
                setFormInput({ ...formInput, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              placeholder="NFT Description"
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md"
              onChange={(e) =>
                setFormInput({ ...formInput, description: e.target.value })
              }
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-300 mb-2" htmlFor="file">
              Upload Image
            </label>
            <input
              id="file"
              type="file"
              className="w-full text-gray-400"
              onChange={onChange}
            />
          </div>

          <div>
  <label className="block text-gray-300 mb-2">Select Categories</label>
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {[
      "Photography",
      "Painting",
      "Sculpture",
      "Digital Art",
      "Portrait",
      "Animal",
      "Plant",
      "Vehicle",
      "Landscape",
    ].map((category, index) => (
      <label
        key={index}
        className="flex items-center space-x-2 text-gray-300 bg-gray-700 py-3 px-3 rounded-lg hover:bg-gray-600 transition"
      >
        <input
          type="checkbox"
          value={category}
          className="form-checkbox h-4 w-4 text-blue-600 focus:ring focus:ring-blue-500 rounded"
          style={{ margin: 0 }}
          onChange={(e) =>
            handleCategoryChange(category, e.target.checked)
          }
        />
        <span className="text-sm leading-none">{category}</span>
      </label>
    ))}
  </div>
</div>

          <button
            onClick={uploadAndMint}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
          >
            Upload and Mint NFT
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-300 text-center mb-6">
          My NFTs
        </h2>
        <NFTGallery
          provider={provider}
          contractAddress={contractAddress}
          ownerAddress={currentAddress}
          showSellButton={true}
          onSell={(tokenId) => {
            setSelectedTokenId(tokenId);
            setShowSellModal(true);
          }}
          onAuction={(tokenId) => {
            setSelectedTokenId(tokenId);
            setShowAuctionModal(true);
          }}
          nfts={nfts}
          refreshNFTs={refreshNFTs}
        />
      </div>

      {showSellModal && (
        <SellModal
          closeModal={() => setShowSellModal(false)}
          confirmSell={handleSellNFT}
        />
      )}

      {showAuctionModal && (
        <AuctionModal
          closeModal={() => setShowAuctionModal(false)}
          confirmAuction={handleStartAuction}
        />
      )}
    </div>
  );
};

export default Upload;
