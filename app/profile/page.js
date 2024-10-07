'use client';
import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, storage } from "../firebase"; // Firebase initialization
import { useMetaMask } from "../context/MetaMaskContext"; // MetaMask context for user info
import LikedNFTs from '../components/LikedNfts'; // Import the LikedNFTs component
import Link from 'next/link'; // Import Link for profile redirection
import { shortenBalance } from '../utils/shortenBalance'; // For balance formatting
import { ethers } from 'ethers'; // For balance fetching
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase storage

const ProfilePage = () => {
  const { address: currentAddress, provider: metaMaskProvider } = useMetaMask(); // Get current MetaMask address and provider
  const [profileData, setProfileData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    profilePicture: "public\images\default-avatar.png",
    likedArtworks: [],
    followers: [],
    following: [], // New fields to track followers and following
  });
  const [followedCreators, setFollowedCreators] = useState([]); // State to store followed creators
  const [balances, setBalances] = useState({}); // State to store user balances
  const [editing, setEditing] = useState(false); // State to toggle edit mode
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null); // File for uploading new profile picture
  
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  // Load user profile from Firebase
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentAddress) return;
      setLoading(true);

      try {
        const userRef = doc(db, "users", currentAddress);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData((prev) => ({
            ...prev,
            ...data,
          }));

          // Fetch followed users (creators) data
          if (data.following?.length) {
            await loadFollowedCreators(data.following);
          }
        } else {
          console.error("User profile does not exist");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
      setLoading(false);
    };

    const loadFollowedCreators = async (followingList) => {
      try {
        const usersQuery = query(collection(db, "users"), where("address", "in", followingList));
        const querySnapshot = await getDocs(usersQuery);
        const followedCreatorsData = querySnapshot.docs.map((doc) => doc.data());
        setFollowedCreators(followedCreatorsData);

        // Fetch balance for each followed creator
        await fetchBalances(followedCreatorsData);
      } catch (error) {
        console.error("Error fetching followed creators:", error);
      }
    };

    const fetchBalances = async (creators) => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const newBalances = {};

        for (const creator of creators) {
          if (creator.address) {
            try {
              const balance = await provider.getBalance(creator.address);
              newBalances[creator.address] = ethers.utils.formatEther(balance); // Store balance in ETH format
            } catch (error) {
              console.error(`Error fetching balance for ${creator.address}:`, error);
              newBalances[creator.address] = '0'; // Fallback to 0 if an error occurs
            }
          }
        }

        setBalances(newBalances); // Update state with all balances
      }
    };

    loadProfile();
  }, [currentAddress]);

  // Toggle between edit and view mode
  const toggleEdit = () => setEditing(!editing);

  // Handle file change for profile picture
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profilePicture: reader.result });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Save changes to Firebase, including uploading the profile picture
  const handleSave = async () => {
    if (!currentAddress) return;

    try {
      let profilePictureUrl = profileData.profilePicture;

      // If a new file is selected, upload it to Firebase Storage
      if (file) {
        const storageRef = ref(storage, `profilePictures/${currentAddress}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        profilePictureUrl = await getDownloadURL(snapshot.ref);
      }

      const userRef = doc(db, "users", currentAddress);

      // Update the user's profile in Firebase
      await updateDoc(userRef, {
        username: profileData.username,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        profilePicture: profilePictureUrl,
      });

      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">My Profile</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-6xl mx-auto">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2">{profileData.username}</h2> {/* Username */}
          <p className="text-lg text-gray-400 mb-4">{profileData.followers.length} Followers</p> {/* Followers Count */}
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
              <p>{profileData.username}</p>
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

          {editing && (
            <div>
              <label className="block text-gray-300">Profile Picture</label>
              <input type="file" onChange={handleFileChange} className="w-full text-gray-400" />
              {profileData.profilePicture && (
                <img src={profileData.profilePicture} alt="Profile Preview" className="mt-4 w-16 h-16 rounded-full" />
              )}
            </div>
          )}

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

      {/* Followed Creators Section */}
      <div className="mt-6 bg-gray-700 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Following: {profileData.following.length}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {followedCreators.map((creator, index) => (
            <div
              key={index}
              className="bg-white shadow-lg rounded-lg p-4 flex flex-col items-center text-gray-800"
            >
              <Link href={`/creators/${creator.address}`} passHref>
                <img
                  src={creator.profilePicture || "https://via.placeholder.com/72x72"}
                  alt={creator.username}
                  className="w-18 h-18 rounded-full mb-2 cursor-pointer"
                />
              </Link>
              <Link href={`/creators/${creator.address}`} passHref>
                <h3 className="text-lg font-semibold hover:underline cursor-pointer">
                  {creator.username}
                </h3>
              </Link>
              <p className="text-gray-500">{creator.followers?.length || 0} Followers</p>
              <p className="text-gray-600">
                {shortenBalance(balances[creator.address]) ? `${shortenBalance(balances[creator.address])} ETH` : "Balance not available"}
              </p>
            </div>
          ))}
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
