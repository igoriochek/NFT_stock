import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase"; // Ensure that your firebase is set up correctly
import { useSearchParams, useRouter } from "next/navigation";

const ProfileCompletionForm = ({ address }) => {
  const [profileData, setProfileData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    bio: "", // Add bio field here
    profilePicture: "",
    likedArtworks: [],
    following: [],  // Array to track followed users
    followers: [],  // Array to track the followers of the user
    earnings: 0,    // Initialize earnings with 0
  });

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(""); // For image preview
  const searchParams = useSearchParams();
  const router = useRouter();
  const referrer = searchParams.get("referrer");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result); // Preview the selected image
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let profilePictureUrl = "/images/default-avatar.png"; // Fallback to default picture

    try {
      if (file) {
        // Upload the selected profile picture to Firebase Storage
        const storageRef = ref(storage, `profilePictures/${address}`); // Store image with wallet address as identifier
        const snapshot = await uploadBytes(storageRef, file);
        profilePictureUrl = await getDownloadURL(snapshot.ref); // Get the image URL from Firebase Storage
      }

      // Save user profile data in Firestore
      const userRef = doc(db, "users", address); // Use wallet address as the document ID
      await setDoc(userRef, {
        address,
        username: profileData.username || "Anonymous",
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        bio: profileData.bio || "", // Save the bio field in Firestore
        profilePicture: profilePictureUrl, // Save the uploaded image URL to Firestore
        likedArtworks: profileData.likedArtworks,
        following: profileData.following,
        followers: profileData.followers,
        earnings: 0, // Initialize earnings with 0
        createdAt: new Date(),
      });

      alert("Profile created successfully!");
      if (referrer) {
        router.push(referrer);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  };

  const skipProfileCreation = async () => {
    try {
      const userRef = doc(db, "users", address);
      await setDoc(userRef, {
        address,
        username: "Anonymous",
        firstName: "",
        lastName: "",
        bio: "", // Add default bio
        profilePicture: "/images/default-avatar.png", // Default avatar for skipped profile creation
        likedArtworks: [],
        following: [],
        followers: [],
        earnings: 0,
        createdAt: new Date(),
      });

      alert("Profile created with default values!");
      if (referrer) {
        router.push(referrer);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error skipping profile creation:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Complete Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            type="text"
            name="username"
            value={profileData.username}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">First Name</label>
          <input
            type="text"
            name="firstName"
            value={profileData.firstName}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={profileData.lastName}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Bio</label>
          <textarea
            name="bio"
            value={profileData.bio}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
            placeholder="Tell something about yourself"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Profile Picture</label>
          <input type="file" onChange={handleFileChange} className="w-full text-gray-400" />
          {filePreview && (
            <img src={filePreview} alt="Profile Preview" className="mt-4 w-16 h-16 rounded-full" />
          )}
        </div>
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 p-2 rounded">
          Save Profile
        </button>
        <button type="button" onClick={skipProfileCreation} className="w-full bg-gray-500 hover:bg-gray-600 p-2 rounded mt-4">
          Skip
        </button>
      </form>
    </div>
  );
};

export default ProfileCompletionForm;
