import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"; // Firebase Firestore functions
import { db } from "../firebase"; // Firebase initialization
import Link from "next/link";
import { shortenAddress } from "../utils/shortenAddress"; // Utility to shorten wallet addresses
import { ethers } from "ethers"; // Needed for ETH conversion
import { getUserProfileByAddress } from "../utils/firebaseUtils"; // Utility function for fetching username

const NFTCard = ({ nft, currentAddress, isAuction, onBid }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [ownerUsername, setOwnerUsername] = useState(""); // State for owner username
  const [ownerProfilePicture, setOwnerProfilePicture] = useState(
    "/images/default-avatar.png"
  ); // State for owner profile picture

  // Fetch the likes count and user liked status when the page loads
  useEffect(() => {
    const fetchLikesAndStatus = async () => {
      if (!nft?.id) return;

      try {
        const nftLikesRef = doc(db, "nftLikes", nft.id.toString());
        const nftLikesDoc = await getDoc(nftLikesRef);

        if (nftLikesDoc.exists()) {
          const data = nftLikesDoc.data();
          setLikeCount(data.likeCount || 0); // Set like count from Firebase
        }

        // Check if the user has liked this NFT
        if (currentAddress) {
          const userRef = doc(db, "users", currentAddress);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (
              userData.likedArtworks &&
              userData.likedArtworks.includes(nft.id.toString())
            ) {
              setLiked(true); // Set liked status if the user has liked it
            }
          }
        }
      } catch (error) {
        console.error("Error fetching like data:", error);
      }
    };

    fetchLikesAndStatus();
  }, [nft?.id, currentAddress]);

  // Fetch owner's username and profile picture from Firebase
  useEffect(() => {
    const fetchOwnerData = async () => {
      if (!nft?.owner) return;

      try {
        const ownerProfile = await getUserProfileByAddress(nft.owner); // Fetch profile from Firebase
        setOwnerUsername(ownerProfile?.username || shortenAddress(nft.owner)); // Set username or fallback to wallet address
        setOwnerProfilePicture(
          ownerProfile?.profilePicture || "/images/default-avatar.png"
        ); // Set profile picture
      } catch (error) {
        console.error("Error fetching owner data:", error);
        setOwnerUsername(shortenAddress(nft.owner)); // Fallback to wallet address in case of error
        setOwnerProfilePicture("/images/default-avatar.png");
      }
    };

    fetchOwnerData();
  }, [nft?.owner]);

  useEffect(() => {
    if (isAuction && nft?.endTime) {
      const interval = setInterval(() => {
        setTimeLeft(calculateTimeLeft(nft.endTime));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isAuction, nft?.endTime]);

  const calculateTimeLeft = (endTime) => {
    const now = Math.floor(Date.now() / 1000);
    const remainingTime = endTime - now;
    if (remainingTime <= 0) return "Auction Ended";

    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    return `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  };

  const handleLikeClick = async () => {
    if (!currentAddress || !nft?.id) {
      alert("Please connect to MetaMask and ensure the NFT data is loaded.");
      return;
    }

    const nftId = nft.id.toString(); // Ensure ID is a string

    try {
      const userRef = doc(db, "users", currentAddress);
      const nftLikesRef = doc(db, "nftLikes", nftId);

      const userDoc = await getDoc(userRef);
      const nftLikesDoc = await getDoc(nftLikesRef);

      let updatedLikes = likeCount; // Start with current like count
      let userLikes = [];

      if (nftLikesDoc.exists()) {
        const data = nftLikesDoc.data();
        userLikes = data.userLikes || [];
      }

      let userLikedArtworks = [];
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userLikedArtworks = userData.likedArtworks || [];
      }

      if (liked) {
        // Unlike the NFT
        updatedLikes--;
        userLikes = userLikes.filter((id) => id !== currentAddress);
        userLikedArtworks = userLikedArtworks.filter((id) => id !== nftId);
      } else {
        // Like the NFT
        updatedLikes++;
        userLikes.push(currentAddress);
        userLikedArtworks.push(nftId);
      }

      // Update NFT likes document
      await setDoc(
        nftLikesRef,
        { likeCount: updatedLikes, userLikes },
        { merge: true }
      );

      // Update user liked artworks
      await updateDoc(userRef, { likedArtworks: userLikedArtworks });

      setLiked(!liked);
      setLikeCount(updatedLikes);
    } catch (error) {
      console.error("Error liking/unliking NFT:", error);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden p-4 w-full max-w-full mx-auto transition-transform transform hover:scale-105">
      <div className="relative">
        <Link href={isAuction ? `/auction/${nft?.id}` : `/market/${nft?.id}`}>
          <img
            src={nft?.image || "https://via.placeholder.com/565x551"}
            alt={nft?.title || "NFT Image"}
            className="w-full h-64 object-cover rounded-md cursor-pointer"
          />
        </Link>

        {isAuction && (
          <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-md font-semibold">
            {timeLeft}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <img
            src={ownerProfilePicture || "/images/default-avatar.png"}
            alt={ownerUsername}
            className="w-9 h-9 rounded-full border-2 border-blue-400 object-cover"
          />
          <span className="text-sm font-medium text-gray-700 truncate w-32">
            {ownerUsername || shortenAddress(nft.owner)}{" "}
            {/* Display the owner's username or fallback to address */}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleLikeClick}
            className={`p-1 w-8 h-8 rounded-full transition-colors duration-300 focus:outline-none ${
              liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
            }`}
            aria-label="Like NFT"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              fill={liked ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={liked ? 0 : 2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21C12 21 5 14.5 5 9.5C5 7.5 6.5 6 8.5 6C10 6 11 7 12 8C13 7 14 6 15.5 6C17.5 6 19 7.5 19 9.5C19 14.5 12 21 12 21Z"
              />
            </svg>
          </button>
          <span className="text-sm text-gray-600">{likeCount} Likes</span>
        </div>
      </div>

      <div className="mt-4">
        <Link href={isAuction ? `/auction/${nft?.id}` : `/market/${nft?.id}`}>
          <h3 className="text-lg font-semibold text-gray-800 hover:underline cursor-pointer">
            {nft?.title || "Untitled NFT"}
          </h3>
        </Link>
        <p className="text-sm text-gray-500">
          {nft?.description || "No description available."}
        </p>
      </div>

      <div className="mt-4 bg-gray-50 p-3 rounded-lg flex justify-between items-center">
        {isAuction ? (
          <div>
            <span className="block text-sm text-gray-500">Current Bid</span>
            <span className="block text-lg font-semibold text-gray-800">
              {nft?.highestBid
                ? `${ethers.utils.formatUnits(nft.highestBid, "ether")} ETH`
                : "0 ETH"}
            </span>
          </div>
        ) : (
          <div>
            <span className="block text-sm text-gray-500">Price</span>
            <span className="block text-lg font-semibold text-gray-800">
              {nft?.price ? `${nft.price} ETH` : "0 ETH"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        {nft?.owner &&
        nft.owner.toLowerCase() === currentAddress?.toLowerCase() ? (
          <p className="text-sm text-gray-500 text-center">Your NFT</p>
        ) : null}
      </div>
    </div>
  );
};

export default NFTCard;
