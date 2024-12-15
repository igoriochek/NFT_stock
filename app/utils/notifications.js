// utils/notifications.js
import { db } from "../firebase";
import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

/**
 * Add a notification to Firebase.
 * @param {string} userId - The recipient's user ID.
 * @param {Object} notification - The notification data (message, type, etc.).
 */
const addNotification = async (userId, notification) => {
  try {
    const notificationsRef = collection(
      db,
      "notifications",
      userId,
      "userNotifications"
    );

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

// Define icons for each notification type
const notificationIcons = {
  follow: "👤", // Follow icon
  like: "❤️", // Like icon
  new_bid: "🔨", // New bid icon
  outbid: "📉", // Outbid icon
  auction_win: "🏆", // Auction win icon
  auction_sale: "💰", // Auction sale icon
  nft_purchase: "🛒", // NFT purchase icon
  chat_message: "✉️", // Chat message icon
};

export const createFollowNotification = async (followerId, recipientId) => {
  const notification = {
    message: `User ${followerId.substring(0, 6)}...${followerId.substring(
      followerId.length - 4
    )} started following you.`,
    type: "follow",
    icon: notificationIcons.follow,
    read: false,
    timestamp: new Date().toISOString(),
    link: `/creators/${followerId}`,
  };
  await addNotification(recipientId, notification);
};

export const createLikeNotification = async ({
  likerId,
  ownerId,
  nftId,
  nftTitle,
  link,
}) => {
  if (!likerId || !ownerId || !nftId || !link) {
    console.error("Invalid data for like notification");
    return;
  }

  const notification = {
    message: `User ${likerId.substring(0, 6)}...${likerId.substring(
      likerId.length - 4
    )} liked your NFT "${nftTitle}".`,
    type: "like",
    icon: notificationIcons.like,
    read: false,
    timestamp: new Date().toISOString(),
    link,
  };

  try {
    await addNotification(ownerId, notification);
  } catch (error) {
    console.error("Error creating like notification:", error);
  }
};

export const createNewBidNotification = async ({
  sellerId,
  bidderId,
  nftId,
  bidAmount,
}) => {
  const notification = {
    message: `New bid of ${bidAmount} ETH placed by ${bidderId.substring(
      0,
      6
    )}...${bidderId.substring(bidderId.length - 4)}.`,
    type: "new_bid",
    icon: notificationIcons.new_bid,
    read: false,
    timestamp: new Date().toISOString(),
    link: `/auction/${nftId}`,
  };
  await addNotification(sellerId, notification);
};

export const createOutbidNotification = async ({
  previousBidderId,
  nftId,
  refundAmount,
}) => {
  const notification = {
    message: `You have been outbid! Your ${refundAmount} ETH has been refunded.`,
    type: "outbid",
    icon: notificationIcons.outbid,
    read: false,
    timestamp: new Date().toISOString(),
    link: `/auction/${nftId}`,
  };
  await addNotification(previousBidderId, notification);
};

export const createAuctionWinNotification = async ({
  winnerId,
  nftId,
  finalBid,
}) => {
  const notification = {
    message: `Congratulations! You won the auction with a bid of ${finalBid} ETH.`,
    type: "auction_win",
    icon: notificationIcons.auction_win,
    read: false,
    timestamp: new Date().toISOString(),
    link: `/auction/${nftId}`,
  };
  await addNotification(winnerId, notification);
};

export const createAuctionSaleNotification = async ({
  sellerId,
  nftId,
  finalBid,
}) => {
  const notification = {
    message: `Your auction has ended! The NFT was sold for ${finalBid} ETH.`,
    type: "auction_sale",
    icon: notificationIcons.auction_sale,
    read: false,
    timestamp: new Date().toISOString(),
    link: `/auction/${nftId}`,
  };
  await addNotification(sellerId, notification);
};

export const createNFTPurchaseNotification = async ({
  sellerId,
  buyerId,
  nftId,
  nftTitle,
  purchasePrice,
}) => {
  const notification = {
    message: `Your NFT "${nftTitle}" was purchased for ${purchasePrice} ETH by ${buyerId.substring(
      0,
      6
    )}...${buyerId.substring(buyerId.length - 4)}.`,
    type: "nft_purchase",
    icon: notificationIcons.nft_purchase,
    read: false,
    timestamp: new Date().toISOString(),
    link: `/market/${nftId}`,
  };

  try {
    await addNotification(sellerId, notification);
  } catch (error) {
    console.error("Error creating NFT purchase notification:", error);
  }
};

export const createChatMessageNotification = async ({
  senderId,
  recipientId,
  chatId,
}) => {
  const notification = {
    message: `New messages from ${senderId.substring(
      0,
      6
    )}...${senderId.substring(senderId.length - 4)}`,
    type: "chat_message",
    icon: notificationIcons.chat_message,
    read: false,
    timestamp: new Date().toISOString(),
    link: `/chat/${senderId}`,
  };

  try {
    await addNotification(recipientId, notification);
  } catch (error) {
    console.error("Error creating chat message notification:", error);
  }
};