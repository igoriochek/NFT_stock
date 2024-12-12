"use client";
import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
  updateDoc,
} from "firebase/firestore"; // Firestore methods
import { db } from "../../firebase"; // Firebase initialization
import { useMetaMask } from "@/app/context/MetaMaskContext"; // MetaMask context for the current user's address
import NFTCard from "@/app/components/NFTCard"; // Import the NFTCard component
import { ethers } from "ethers";
import ArtNFT from "@/artifacts/contracts/ArtNFT.sol/ArtNFT.json";
import { getUserProfileByAddress } from "@/app/utils/firebaseUtils"; // Firebase utility for user profiles
import { useRouter } from "next/navigation";
import { createFollowNotification } from "@/app/utils/notifications"; // Import the follow notification function
import { getUserStatistics } from "@/app/utils/firebaseStatistics";

const UserProfile = ({ params }) => {
  const { address } = params;
  const router = useRouter();
  const [userData, setUserData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    bio: "",
    profilePicture: "/images/default-avatar.png",
    followers: [],
  });
  const [userStats, setUserStats] = useState({
    nftsMinted: 0,
    nftsBought: 0,
    nftsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const { address: currentAddress, provider } = useMetaMask();

  // Function to handle opening the chat with the specific user
  const handleChat = () => {
    router.push(`/chat/${address}`);
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!address) return;

      try {
        const userRef = doc(db, "users", address);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFollowersCount(data.followers?.length || 0); // Set initial followers count
          setIsFollowing(data.followers?.includes(currentAddress)); // Check if the current user is following
        } else {
          console.error("User not found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [address, currentAddress]);

  // Fetch listed and auctioned NFTs and user profile data from Firebase
  useEffect(() => {
    const fetchListedOrAuctionNFTs = async () => {
      if (!provider) return;

      try {
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          ArtNFT.abi,
          provider
        );
        const totalSupply = await contract.tokenCount();
        const listedNFTs = [];

        for (let i = 1; i <= totalSupply; i++) {
          try {
            const owner = await contract.ownerOf(i);
            if (owner.toLowerCase() === address.toLowerCase()) {
              const tokenURI = await contract.tokenURI(i);
              const price = await contract.getPrice(i);
              const response = await fetch(tokenURI);
              if (!response.ok) {
                console.error(`Failed to fetch metadata for token ${i}`);
                continue;
              }
              const metadata = await response.json();

              // Fetch the owner's profile from Firebase
              const ownerProfile = await getUserProfileByAddress(owner);
              const ownerUsername = ownerProfile?.username || "Anonymous";
              const ownerProfilePicture =
                ownerProfile?.profilePicture || "/images/default-avatar.png";

              // Check for auction details
              let isAuction = false;
              let highestBid = ethers.BigNumber.from(0); // Initialize as BigNumber with value 0
              let endTime = null;
              try {
                const [active, highestBidder, highestBidValue, auctionEndTime] =
                  await contract.getAuctionDetails(i);
                isAuction = active;
                highestBid = highestBidValue; // Ensure this is a BigNumber object
                endTime = auctionEndTime;
              } catch (error) {
                console.log(`No active auction for NFT ID: ${i}`);
              }

              // Push the NFT data to the listedNFTs array
              listedNFTs.push({
                id: i,
                metadata,
                price: ethers.utils.formatUnits(price, "ether"), // Format price as a string
                highestBid: isAuction ? highestBid : ethers.BigNumber.from(0), // Keep as BigNumber
                auctionActive: isAuction,
                endTime: isAuction ? endTime : null,
                ownerUsername, // Firebase data
                ownerProfilePicture, // Firebase data
              });
            }
          } catch (error) {
            console.error(`Error fetching data for NFT ID ${i}:`, error);
          }
        }

        setNfts(listedNFTs);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      }
    };

    fetchListedOrAuctionNFTs();
  }, [address, provider]);

  // Handle Follow/Unfollow action
  const handleFollowToggle = async () => {
    if (!currentAddress || !address || currentAddress === address) return; // Prevent following oneself

    try {
      const currentUserRef = doc(db, "users", currentAddress);
      const viewedUserRef = doc(db, "users", address);

      if (isFollowing) {
        // Unfollow logic
        await updateDoc(viewedUserRef, {
          followers: arrayRemove(currentAddress),
        });
        await updateDoc(currentUserRef, {
          following: arrayRemove(address),
        });
        setFollowersCount(followersCount - 1); // Update followers count locally
      } else {
        // Follow logic
        await updateDoc(viewedUserRef, {
          followers: arrayUnion(currentAddress),
        });
        await updateDoc(currentUserRef, {
          following: arrayUnion(address),
        });
        setFollowersCount(followersCount + 1); // Update followers count locally

        // Call the centralized notification function
        await createFollowNotification(currentAddress, address);
      }

      setIsFollowing(!isFollowing); // Toggle follow/unfollow state
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!address) return;

      try {
        const userRef = doc(db, "users", address);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFollowersCount(data.followers?.length || 0);
          setIsFollowing(data.followers?.includes(currentAddress));
        } else {
          console.error("User not found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserStatistics = async () => {
      if (!address) {
        return;
      }
      const stats = await getUserStatistics(address);
      if (stats) {
        setUserStats(stats);
      }
    };

    fetchUserData();
    fetchUserStatistics();
  }, [address, currentAddress]);

  if (loading) return <p>Loading...</p>;

  if (!userData) return <p>User not found</p>;

  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg p-6">
        {/* Profile Section */}
        <div className="w-full md:w-1/3 text-center">
          <img
            src={userData.profilePicture || "https://via.placeholder.com/72"}
            alt={userData.username || "Anonymous"}
            className="w-24 h-24 rounded-full mx-auto"
          />
          <h1 className="text-3xl font-bold text-gray-800 mt-4">
            {userData.username || "Anonymous"}
          </h1>
          <p className="text-gray-600 mt-2">
            {userData.firstName || ""} {userData.lastName || ""}
          </p>

          <div className="mt-6">
            <p className="font-bold text-gray-800">Statistics:</p>
            <p className="text-gray-600">NFTs Minted: {userStats.nftsMinted}</p>
            <p className="text-gray-600">NFTs Bought: {userStats.nftsBought}</p>
            <p className="text-gray-600">NFTs Sold: {userStats.nftsSold}</p>
          </div>

          <div className="mt-4">
            <p className="font-bold text-gray-800">Followers:</p>
            <p className="text-gray-600">{followersCount}</p>
          </div>

          {/* Follow/Unfollow button */}
          {currentAddress && currentAddress !== address && (
            <button
              onClick={handleFollowToggle}
              className={`mt-4 py-2 px-4 rounded ${
                isFollowing
                  ? "bg-gray-500 text-white hover:bg-gray-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}

          {/* Chat Button - Disabled for Unlogged Users */}
          <button
            onClick={currentAddress ? handleChat : undefined}
            disabled={!currentAddress}
            className={`mt-4 py-2 px-4 rounded-lg ${
              currentAddress
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-500 text-white cursor-not-allowed"
            }`}
          >
            {currentAddress
              ? `Chat with ${userData.username || "User"}`
              : "Login to Chat"}
          </button>

          {/* If the user is viewing their own profile, show a message instead */}
          {currentAddress === address && (
            <p className="mt-4 text-gray-500">You cannot follow yourself.</p>
          )}
        </div>

        {/* About and NFT Section */}
        <div className="w-full md:w-2/3 mt-8 md:mt-0 md:ml-8">
          <h2 className="text-2xl font-bold text-gray-800">About Me</h2>
          <p className="mt-4 text-gray-600">
            {userData.bio || "This user hasn't added a bio yet."}
          </p>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Listed and Auctioned Artworks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-6 mt-4">
              {nfts.length > 0 ? (
                nfts.map((nft) => (
                  <NFTCard
                    key={nft.id}
                    nft={{
                      id: nft.id,
                      title: nft.metadata.title,
                      description: nft.metadata.description,
                      image: nft.metadata.image,
                      price: nft.price,
                      highestBid: nft.highestBid,
                      listed: nft.listed,
                      auctionActive: nft.auctionActive,
                      endTime: nft.endTime,
                      owner: address, // Pass owner wallet address
                      ownerUsername: nft.ownerUsername, // Firebase data
                      ownerProfilePicture: nft.ownerProfilePicture, // Firebase data
                    }}
                    currentAddress={currentAddress}
                    isAuction={nft.auctionActive}
                    onBuy={() => {}}
                  />
                ))
              ) : (
                <p className="text-gray-600">No listed or auctioned NFTs.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
