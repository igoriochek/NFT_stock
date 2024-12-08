"use client";
import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase"; // Firebase initialization
import { useMetaMask } from "../context/MetaMaskContext"; // MetaMask context for user info
import LikedNFTs from "../components/LikedNfts"; // Import the LikedNFTs component
import CreatorsSection from "../components/CreatorsSection"; // Reuse the CreatorsSection component
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase storage
import { useRouter } from "next/navigation";

const ProfilePage = () => {
  const { address: currentAddress, provider: metaMaskProvider } = useMetaMask(); // Get current MetaMask address and provider
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    bio: "", // Add bio field
    profilePicture: "/images/default-avatar.png",
    likedArtworks: [],
    followers: [],
    following: [], // New fields to track followers and following
  });
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
        // Fetch user profile data, including likedArtworks and bio from Firebase
        const userRef = doc(db, "users", currentAddress);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData(data);
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

  // Save changes to Firebase, including uploading the profile picture and updating the bio
  const handleSave = async () => {
    if (!currentAddress) return;

    try {
      let profilePictureUrl = profileData.profilePicture;

      // If a new file is selected, upload it to Firebase Storage
      if (file) {
        const storageRef = ref(
          storage,
          `profilePictures/${currentAddress}_${file.name}`
        );
        const snapshot = await uploadBytes(storageRef, file);
        profilePictureUrl = await getDownloadURL(snapshot.ref);
      }

      const userRef = doc(db, "users", currentAddress);

      // Update the user's profile in Firebase, including bio and profile picture
      await updateDoc(userRef, {
        username: profileData.username,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        bio: profileData.bio, // Save the bio to Firestore
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
      <h1 className="text-3xl font-bold text-center text-white mb-6">
        My Profile
      </h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-6xl mx-auto">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2">{profileData.username}</h2>{" "}
          {/* Username */}
          <p className="text-lg text-gray-400 mb-4">
            {profileData.followers.length} Followers
          </p>{" "}
          {/* Followers Count */}
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
                onChange={(e) =>
                  setProfileData({ ...profileData, username: e.target.value })
                }
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
                onChange={(e) =>
                  setProfileData({ ...profileData, firstName: e.target.value })
                }
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
                onChange={(e) =>
                  setProfileData({ ...profileData, lastName: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            ) : (
              <p>{profileData.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-300">Bio</label> {/* Bio Field */}
            {editing ? (
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                placeholder="Tell something about yourself"
              />
            ) : (
              <p>{profileData.bio || "No bio provided."}</p>
            )}
          </div>

          {editing && (
            <div>
              <label className="block text-gray-300">Profile Picture</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-gray-400"
              />
              {profileData.profilePicture && (
                <img
                  src={profileData.profilePicture}
                  alt="Profile Preview"
                  className="mt-4 w-16 h-16 rounded-full"
                />
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
        <h2 className="text-xl font-bold mb-4">
          Following: {profileData.following.length}
        </h2>
        {profileData.following.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-400">You are not following anyone yet.</p>
            <button
              onClick={() => router.push("/creators")} // Navigate to the creators page
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
            >
              Explore Creators
            </button>
          </div>
        ) : (
          <CreatorsSection followingList={profileData.following} /> // Display followed creators
        )}
      </div>

      {/* Liked NFTs Section */}
      <div className="mt-10">
        <LikedNFTs
          provider={metaMaskProvider}
          contractAddress={contractAddress}
          likedArtworks={profileData.likedArtworks}
          currentAddress={currentAddress}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
