"use client";
import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"; // Firestore methods
import { db } from "../../firebase"; // Firebase initialization
import { useMetaMask } from "@/app/context/MetaMaskContext"; // MetaMask context for the current user's address

const UserProfile = ({ params }) => {
  const { address } = params; // Get the wallet address from the URL (params for Next.js 13+)
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const { address: currentAddress } = useMetaMask(); // Get the current user's address from MetaMask context

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

  // Handle Follow/Unfollow action
  const handleFollowToggle = async () => {
    if (!currentAddress || !address || currentAddress === address) return;

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
      }

      setIsFollowing(!isFollowing); // Toggle follow/unfollow state
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  if (loading) return <p>Loading...</p>;

  if (!userData) return <p>User not found</p>;

  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg p-6">
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
            <p className="font-bold text-gray-800">Earnings:</p>
            <p className="text-xl text-gray-600">
              {userData.earnings ? `${userData.earnings} ETH` : "0 ETH"}
            </p>
          </div>

          <div className="mt-4">
            <p className="font-bold text-gray-800">Followers:</p>
            <p className="text-gray-600">{followersCount}</p>
          </div>

          {/* Follow/Unfollow button */}
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
        </div>

        <div className="w-full md:w-2/3 mt-8 md:mt-0 md:ml-8">
          <h2 className="text-2xl font-bold text-gray-800">About Me</h2>
          <p className="mt-4 text-gray-600">
            {userData.bio || "This user hasn't added a bio yet."}
          </p>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">Artworks</h2>
            {/* Add logic here to display the user's artworks */}
            <p className="text-gray-600">
              This section can display the NFTs or artwork associated with the user.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
