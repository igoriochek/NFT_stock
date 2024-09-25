import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import storage methods
import { db, storage } from "../firebase"; // Import the initialized storage
import { useSearchParams, useRouter } from "next/navigation"; // Import navigation utilities

const ProfileCompletionForm = ({ address }) => {
  const [profileData, setProfileData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    profilePicture: "",
    likedArtworks: [],
    following: [],
  });

  const [file, setFile] = useState(null); // File state for the image
  const searchParams = useSearchParams(); // Get query parameters
  const router = useRouter(); // To programmatically redirect
  const referrer = searchParams.get("referrer"); // Get the referrer page from query params

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile); // Set the file state
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profilePicture: reader.result });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let profilePictureUrl = "/default-avatar.png"; // Default profile picture

    try {
      if (file) {
        // Upload the profile picture to Firebase Storage
        const storageRef = ref(storage, `profilePictures/${address}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        profilePictureUrl = await getDownloadURL(snapshot.ref); // Get the download URL after upload
      }

      const userRef = doc(db, "users", address);
      await setDoc(userRef, {
        address,
        username: profileData.username || "Anonymous", // Dummy username if skipped
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        profilePicture: profilePictureUrl, // Use the uploaded image URL or default
        likedArtworks: profileData.likedArtworks,
        following: profileData.following,
        createdAt: new Date(),
      });

      alert("Profile created successfully!");

      // Redirect the user back to the referrer or home if no referrer
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
        username: "Annonymous", // Dummy username
        firstName: "",
        lastName: "",
        profilePicture: "/default-avatar.png",
        likedArtworks: [],
        following: [],
        createdAt: new Date(),
      });

      alert("Profile created with default values!");

      // Redirect to the home page or referrer
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
          <label className="block text-sm font-medium">Profile Picture</label>
          <input type="file" onChange={handleFileChange} className="w-full text-gray-400" />
          {profileData.profilePicture && (
            <img src={profileData.profilePicture} alt="Profile Preview" className="mt-4 w-16 h-16 rounded-full" />
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
