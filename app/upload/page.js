"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import MetamaskAuth from "../components/MetamaskAuth";
import NFTGallery from "../components/NftGallery";
import { ethers } from "ethers";
import ArtNFT from "@/artifacts/contracts/ArtNFT.sol/ArtNFT.json";
import SellModal from "../modals/SellModal";
import AuctionModal from "../modals/AuctionModal";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const EXPECTED_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID);
const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;

const Upload = () => {
  const [address, setAddress] = useState("");
  const [provider, setProvider] = useState(null);
  const [formInput, setFormInput] = useState({ title: "", description: "" });
  const [fileUrl, setFileUrl] = useState(null);
  const [ipfsHash, setIpfsHash] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setProvider(provider);
          setAddress(accounts[0]);
        }
      }
    };

    checkMetaMaskConnection();
  }, []);

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

  const uploadAndMint = async () => {
    const { title, description } = formInput;
    if (!title || !description || !fileUrl) return;
    const data = {
      pinataMetadata: { name: title },
      pinataContent: { title, description, image: fileUrl, creator: address },
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
        alert("Please connect to Metamask first.");
        return;
      }

      const network = await provider.getNetwork();
      if (network.chainId !== EXPECTED_CHAIN_ID) {
        alert(`Please connect to the correct network.`);
        return;
      }

      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);
      let transaction = await contract.mint(url);
      await transaction.wait();
      alert("NFT Minted Successfully!");
    } catch (error) {
      console.error("Error uploading or minting:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Step 1: Declare the refreshNFTs function
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
      setNfts(items); // Update the NFT state
    } catch (error) {
      console.error('Error loading NFTs:', error);
    }
  };

  const handleSellNFT = async (price) => {
    if (!provider) {
      alert("Please connect to Metamask first.");
      return;
    }
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);
    await contract.listForSale(selectedTokenId, ethers.utils.parseEther(price));
    alert("NFT Listed for Sale!");
    setShowSellModal(false);

    // Update the NFT list after listing
    refreshNFTs();
  };

  const handleStartAuction = async (duration) => {
    if (!provider) {
      alert("Please connect to Metamask first.");
      return;
    }
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);
    await contract.startAuction(selectedTokenId, duration);
    alert("Auction Started!");
    setShowAuctionModal(false);

    // Update the NFT list after auction starts
    refreshNFTs();
  };

  const handleSellClick = (tokenId) => {
    setSelectedTokenId(tokenId);
    setShowSellModal(true);
  };

  const handleAuctionClick = (tokenId) => {
    setSelectedTokenId(tokenId);
    setShowAuctionModal(true);
  };

  return (
    <div className="container mx-auto p-8 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white text-center mb-8">
        Upload and Mint Your NFT
      </h1>

      <div className="bg-gray-800 p-8 rounded-lg shadow-md max-w-xl mx-auto">
        {!provider && (
          <MetamaskAuth setAddress={setAddress} setProvider={setProvider} />
        )}

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

      {provider && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-300 text-center mb-6">
            My NFTs
          </h2>
          {/* NFT Gallery */}
          <NFTGallery
            provider={provider}
            contractAddress={contractAddress}
            ownerAddress={address}
            showSellButton={true}
            onSell={handleSellClick}
            onAuction={handleAuctionClick}
            nfts={nfts} // Pass the loaded NFTs
            refreshNFTs={refreshNFTs} // Pass refreshNFTs to the gallery
          />
        </div>
      )}

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
