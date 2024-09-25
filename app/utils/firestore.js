// utils/firestore.js
/*import { db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { addDoc, collection } from "firebase/firestore";

// Follow a user
export const followUser = async (currentUserId, targetUserId) => {
  const userDoc = doc(db, "users", currentUserId);
  await updateDoc(userDoc, {
    following: arrayUnion(targetUserId),
  });
};

// Unfollow a user
export const unfollowUser = async (currentUserId, targetUserId) => {
  const userDoc = doc(db, "users", currentUserId);
  await updateDoc(userDoc, {
    following: arrayRemove(targetUserId),
  });
};

// Get a user's following list
export const getFollowingList = async (userId) => {
  const docSnap = await getDoc(doc(db, "users", userId));
  return docSnap.exists() ? docSnap.data().following || [] : [];
};

// Send a message
export const sendMessage = async (senderId, receiverId, messageContent) => {
  const messageCollection = collection(db, "messages", senderId, receiverId);
  await addDoc(messageCollection, {
    content: messageContent,
    timestamp: new Date(),
    senderId,
    receiverId,
  });
};

export const likeArtwork = async (userId, artworkId) => {
  const userDoc = doc(db, "users", userId, "likedArtworks", artworkId);
  await setDoc(userDoc, { likedAt: new Date() });
};

export const addPriceHistory = async (artworkId, newPrice) => {
  const artworkDoc = doc(db, "artworks", artworkId);
  await updateDoc(artworkDoc, {
    priceHistory: arrayUnion({
      price: newPrice,
      timestamp: new Date(),
    }),
  });
};
*/