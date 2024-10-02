'use client';
import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase"; // Firebase initialization
import { useMetaMask } from "../context/MetaMaskContext"; // MetaMask context for user info
import LikedNFTs from '../components/LikedNfts'; // Import the LikedNFTs component

const ProfilePage = () => {
  const { address: currentAddress, provider: metaMaskProvider } = useMetaMask(); // Get current MetaMask address and provider
  const [profileData, setProfileData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    profilePicture: "/default-avatar.png",
    likedArtworks: [], // Array to store liked NFT ids
  });
  const [editing, setEditing] = useState(false); // State to toggle edit mode
  const [loading, setLoading] = useState(true);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS; // Fetch the contract address

  // Load user profile from Firebase
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentAddress) return;
      setLoading(true);

      try {
        const userRef = doc(db, "users", currentAddress);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setProfileData((prev) => ({
            ...prev,
            ...userDoc.data()
          }));
        } else {
          console.error("User profile does not exist");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
      setLoading(false);
    };

    loadProfile();
  }, [currentAddress]);

  // Toggle between edit and view mode
  const toggleEdit = () => setEditing(!editing);

  // Save changes to Firebase
  const handleSave = async () => {
    if (!currentAddress) return;

    try {
      const userRef = doc(db, "users", currentAddress);

      // Update the user's profile in Firebase
      await updateDoc(userRef, {
        username: profileData.username,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        profilePicture: profileData.profilePicture
      });

      // Exit edit mode
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  // Render loading state
  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">My Profile</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-6xl mx-auto">
        <div className="flex flex-col items-center">
          <img
            src={profileData.profilePicture}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-500 mb-4"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300">Username</label>
            {editing ? (
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            ) : (
              <p className="text-xl">{profileData.username}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-300">First Name</label>
            {editing ? (
              <input
                type="text"
                name="firstName"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            ) : (
              <p>{profileData.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-300">Last Name</label>
            {editing ? (
              <input
                type="text"
                name="lastName"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            ) : (
              <p>{profileData.lastName}</p>
            )}
          </div>

          <div className="flex justify-between">
            {editing ? (
              <button
                onClick={handleSave} // Save changes when clicked
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
              >
                Save
              </button>
            ) : null}

            <button
              onClick={toggleEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>
      </div>

      {/* Liked NFTs Section */}
      <div className="mt-10">
        <LikedNFTs
          provider={metaMaskProvider} // Use the provider from MetaMask context
          contractAddress={contractAddress} // Ensure contractAddress is passed
          likedArtworks={profileData.likedArtworks}
          currentAddress={currentAddress}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
