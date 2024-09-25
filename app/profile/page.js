'use client';
import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase"; // Firebase initialization
import { useMetaMask } from "../context/MetaMaskContext"; // MetaMask context for user info
import NFTCard from "../components/NFTCard"; // For rendering liked NFTs

const ProfilePage = () => {
  const { address: currentAddress } = useMetaMask(); // Get current MetaMask address
  const [profileData, setProfileData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    profilePicture: "/default-avatar.png",
    likedArtworks: [], // Array to store liked NFT ids
  });
  const [editing, setEditing] = useState(false); // State to toggle edit mode
  const [loading, setLoading] = useState(true);

  // Load user profile from Firebase
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentAddress) return;
      setLoading(true);
      
      try {
        const userRef = doc(db, "users", currentAddress);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setProfileData(userDoc.data());
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

  // Handle form input change for profile editing
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    try {
      const userRef = doc(db, "users", currentAddress);
      await updateDoc(userRef, {
        username: profileData.username,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        profilePicture: profileData.profilePicture || "/default-avatar.png",
      });
      alert("Profile updated successfully!");
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Handle profile picture upload (Optional for now)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    // Add logic for uploading to IPFS or Firebase Storage
    // Then set the uploaded URL to `profileData.profilePicture`
  };

  // Toggle between edit and view mode
  const toggleEdit = () => setEditing(!editing);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">My Profile</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <img
            src={profileData.profilePicture}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-500 mb-4"
          />
          {editing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-4 text-gray-400"
            />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300">Username</label>
            {editing ? (
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            ) : (
              <p>{profileData.lastName}</p>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={toggleEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
            {editing && (
              <button
                onClick={handleSaveProfile}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Liked NFTs */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-center mb-6">Liked NFTs</h2>
        {profileData.likedArtworks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {profileData.likedArtworks.map((nftId) => (
              <NFTCard key={nftId} nftId={nftId} currentAddress={currentAddress} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">No liked NFTs.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
