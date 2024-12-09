// utils/notifications.js
import { db } from "../firebase";
import {
  doc,               // Document reference
  collection,        // Collection reference
  getDoc,            // Fetch a document
  setDoc,            // Set a document
  updateDoc,         // Update a document
  addDoc,            // Add a new document
  query,             // Query Firestore collections
  where,             // Query filter
  getDocs,           // Get query results
  increment,         // Increment numeric fields
} from "firebase/firestore";

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

// Notify seller about a new bid
export const createNewBidNotification = async ({ sellerId, bidderId, nftId, bidAmount }) => {
  const notification = {
    message: `New bid of ${bidAmount} ETH placed by ${bidderId.substring(0, 6)}...${bidderId.substring(bidderId.length - 4)}.`,
    type: "new_bid",
    read: false,
    timestamp: new Date().toISOString(),
    link: `/auction/${nftId}`, // Link to auction detail page
  };
  await addNotification(sellerId, notification);
};

// Notify previous bidder about being outbid
export const createOutbidNotification = async ({ previousBidderId, nftId, refundAmount }) => {
  const notification = {
    message: `You have been outbid! Your ${refundAmount} ETH has been refunded.`,
    type: "outbid",
    read: false,
    timestamp: new Date().toISOString(),
    link: `/auction/${nftId}`, // Link to auction detail page
  };
  await addNotification(previousBidderId, notification);
};

// Notify winner of the auction
export const createAuctionWinNotification = async ({ winnerId, nftId, finalBid }) => {
  const notification = {
    message: `Congratulations! You won the auction with a bid of ${finalBid} ETH.`,
    type: "auction_win",
    read: false,
    timestamp: new Date().toISOString(),
    link: `/auction/${nftId}`, // Link to auction detail page
  };
  await addNotification(winnerId, notification);
};

// Notify seller about a successful sale
export const createAuctionSaleNotification = async ({ sellerId, nftId, finalBid }) => {
  const notification = {
    message: `Your auction has ended! The NFT was sold for ${finalBid} ETH.`,
    type: "auction_sale",
    read: false,
    timestamp: new Date().toISOString(),
    link: `/auction/${nftId}`, // Link to auction detail page
  };
  await addNotification(sellerId, notification);
};

//Notify the seller when their NFT is purchased.
export const createNFTPurchaseNotification = async ({
  sellerId,
  buyerId,
  nftId,
  nftTitle,
  purchasePrice,
}) => {
  if (!sellerId || !buyerId || !nftId || !purchasePrice) {
    console.error("Invalid data for NFT purchase notification");
    return;
  }

  const notification = {
    message: `Your NFT "${nftTitle}" was purchased for ${purchasePrice} ETH by ${buyerId.substring(
      0,
      6
    )}...${buyerId.substring(buyerId.length - 4)}.`,
    type: "nft_purchase",
    read: false,
    timestamp: new Date().toISOString(),
    link: `/market/${nftId}`, // Link to the NFT details page
  };

  try {
    await addNotification(sellerId, notification);
  } catch (error) {
    console.error("Error creating NFT purchase notification:", error);
  }
};

//Notify the recipient when they receive a new chat message.
//If a notification already exists, increment the unread count.
export const createChatMessageNotification = async ({
  senderId,
  recipientId,
  chatId,
}) => {
  if (!senderId || !recipientId || !chatId) {
    console.error("Invalid data for chat message notification");
    return;
  }

  try {
    const notificationRef = doc(
      db,
      "notifications",
      recipientId,
      "userNotifications",
      chatId
    );

    const notificationDoc = await getDoc(notificationRef);

    if (notificationDoc.exists()) {
      const currentUnreadCount = notificationDoc.data().unreadCount || 0;
      const newUnreadCount = Math.min(currentUnreadCount + 1, 9); // Limit unread count to 9+

      // Update existing notification
      await updateDoc(notificationRef, {
        unreadCount: newUnreadCount,
        message: `New messages from ${senderId.substring(
          0,
          6
        )}...${senderId.substring(senderId.length - 4)} (${newUnreadCount})`,
        lastMessageTimestamp: new Date().toISOString(),
      });
    } else {
      // Create a new notification
      await setDoc(notificationRef, {
        message: `New messages from ${senderId.substring(
          0,
          6
        )}...${senderId.substring(senderId.length - 4)} (1)`,
        type: "chat_message",
        unreadCount: 1,
        read: false,
        chatId,
        senderId,
        timestamp: new Date().toISOString(),
        link: `/chat/${senderId}`, // Link to the chat page
      });
    }
  } catch (error) {
    console.error("Error creating chat message notification:", error);
  }
};