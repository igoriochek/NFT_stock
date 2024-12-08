// utils/notifications.js
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

/**
 * Add a notification to Firebase.
 * @param {string} userId - The recipient's user ID.
 * @param {Object} notification - The notification data (message, type, etc.).
 */
const addNotification = async (userId, notification) => {
  try {
    const notificationsRef = collection(db, "notifications", userId, "userNotifications");

    // Prevent duplicate notifications
    const q = query(
      notificationsRef,
      where("type", "==", notification.type),
      where("message", "==", notification.message)
    );

    const existingNotifications = await getDocs(q);
    if (existingNotifications.empty) {
      await addDoc(notificationsRef, notification);
    }
  } catch (error) {
    console.error("Error adding notification:", error);
  }
};


export const createFollowNotification = async (followerId, recipientId) => {
  const notification = {
    message: `User ${followerId.substring(0, 6)}...${followerId.substring(followerId.length - 4)} started following you.`,
    type: "follow",
    read: false,
    timestamp: new Date().toISOString(),
    link: `/creators/${followerId}`, // Link to the follower's profile
  };
  await addNotification(recipientId, notification);
};



export const createLikeNotification = async ({ likerId, ownerId, nftId, nftTitle, link }) => {
  if (!likerId || !ownerId || !nftId || !link) {
    console.error("Invalid data for like notification");
    return;
  }

  const notification = {
    message: `User ${likerId.substring(0, 6)}...${likerId.substring(likerId.length - 4)} liked your NFT "${nftTitle}".`,
    type: "like",
    read: false,
    timestamp: new Date().toISOString(),
    link, // Dynamically generated link based on market or auction
  };

  try {
    await addNotification(ownerId, notification);
  } catch (error) {
    console.error("Error creating like notification:", error);
  }
};

