
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


// Fetch user profile from Firebase using wallet address
export const getUserProfileByAddress = async (walletAddress) => {
  try {
    const userRef = doc(db, "users", walletAddress);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null; // Return null if no user profile exists
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

async function uploadProfileImage(file, walletAddress) {
  if (!file || !walletAddress) return;

  try {
    // Create a storage reference for the user's profile picture, using the wallet address as the identifier
    const storageRef = ref(storage, `profilePictures/${walletAddress}`);

    // Upload the file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);

    // Get the file's download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save the download URL to Firestore under the user's document
    const userRef = doc(db, "users", walletAddress);
    await updateDoc(userRef, {
      profilePicture: downloadURL, // Update the profilePicture field in Firestore
    });

    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
  }
}

