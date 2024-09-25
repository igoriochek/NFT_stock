'use client';
import { useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { useMetaMask } from "../context/MetaMaskContext"; // Use the MetaMask context
import NFTGallery from "../components/NftGallery";
import SellModal from "../modals/SellModal";
import AuctionModal from "../modals/AuctionModal";
import { db } from "../firebase"; // Import Firebase
import { doc, setDoc } from "firebase/firestore"; // Firebase methods for creating documents
import ArtNFT from "@/artifacts/contracts/ArtNFT.sol/ArtNFT.json";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const EXPECTED_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID);
const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;

const Upload = () => {
  const [formInput, setFormInput] = useState({ title: "", description: "" });
  const [fileUrl, setFileUrl] = useState(null);
  const [ipfsHash, setIpfsHash] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [nfts, setNfts] = useState([]);

  // Use the MetaMask context to get provider, currentAddress, balance, and connection state
  const { isConnected, provider, address: currentAddress, connectMetaMask } = useMetaMask();

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
      console.log("Error uploading file: ", error);
    }
  };

  // Function to mint the NFT and create a Firebase document
  const uploadAndMint = async () => {
    const { title, description } = formInput;
    if (!title || !description || !fileUrl) return;

    // Data to be pinned to IPFS via Pinata
    const data = {
      pinataMetadata: { name: title },
      pinataContent: { title, description, image: fileUrl, creator: currentAddress },
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
      setIpfsHash(url);

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
      let transaction = await contract.mint(url); // Mint the NFT with the IPFS URL
      const receipt = await transaction.wait(); // Wait for transaction to complete
      const tokenId = receipt.events[0].args.tokenId.toString(); // Get tokenId from event

      alert("NFT Minted Successfully!");

      // Create a document in Firebase after minting the NFT
      const nftRef = doc(db, "nfts", tokenId); // Use the tokenId as document ID
      await setDoc(nftRef, {
        owner: currentAddress, // Store the owner's address
        tokenId: tokenId,
        createdAt: new Date(), // Store creation time
        likes: 0, // Initialize likes count to 0
        auctionActive: false, // Default auction status
        listed: false, // Default listing status
      });

      refreshNFTs(); // Refresh the gallery after minting

    } catch (error) {
      console.error("Error uploading or minting:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Function to refresh the NFTs for the current user
  const refreshNFTs = async () => {
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
      console.error("Error loading NFTs:", error);
    }
  };

  // Function to handle selling an NFT
  const handleSellNFT = async (price) => {
    if (!provider) {
      alert("Please connect to MetaMask first.");
      return;
    }

    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);

    // Ensure selectedTokenId is a string
    const tokenIdString = selectedTokenId.toString();

    await contract.listForSale(selectedTokenId, ethers.utils.parseEther(price));
    alert("NFT Listed for Sale!");

    // Update Firebase document with listed status
    const nftRef = doc(db, "nfts", tokenIdString); // Ensure tokenId is a string
    await setDoc(nftRef, { listed: true }, { merge: true });

    setShowSellModal(false);
    refreshNFTs();
  };

  // Function to handle starting an auction for an NFT
  const handleStartAuction = async (duration) => {
    if (!provider) {
      alert("Please connect to MetaMask first.");
      return;
    }

    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);

    // Ensure selectedTokenId is a string
    const tokenIdString = selectedTokenId.toString();

    await contract.startAuction(selectedTokenId, duration);
    alert("Auction Started!");

    // Update Firebase document with auction status
    const nftRef = doc(db, "nfts", tokenIdString); // Ensure tokenId is a string
    await setDoc(nftRef, { auctionActive: true }, { merge: true });

    setShowAuctionModal(false);
    refreshNFTs();
  };

  // Event handlers for selling and auction
  const handleSellClick = (tokenId) => {
    setSelectedTokenId(tokenId);
    setShowSellModal(true);
  };

  const handleAuctionClick = (tokenId) => {
    setSelectedTokenId(tokenId);
    setShowAuctionModal(true);
  };

  // If MetaMask is not connected, show the connect message
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-white">
        <h1 className="text-3xl font-bold mb-6">Upload and Mint Your NFT</h1>
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
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring focus:border-blue-400"
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
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring focus:border-blue-400"
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
              className="w-full text-gray-400 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring focus:border-blue-400"
              onChange={onChange}
            />
          </div>

          <button
            onClick={uploadAndMint}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-300"
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
          onSell={handleSellClick}
          onAuction={handleAuctionClick}
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
