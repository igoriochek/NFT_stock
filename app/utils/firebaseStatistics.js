import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

// Increment Minted Count
export const incrementMintedCount = async (address) => {
  try {
    const statsRef = doc(db, "statistics", address);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      await updateDoc(statsRef, {
        nftsMinted: statsDoc.data().nftsMinted + 1,
      });
    } else {
      await setDoc(statsRef, {
        nftsMinted: 1,
        nftsBought: 0,
        nftsSold: 0,
      });
    }
    console.log("Minted count updated successfully.");
  } catch (error) {
    console.error("Error incrementing minted count:", error);
  }
};

// Increment Bought Count
export const incrementBoughtCount = async (address) => {
  try {
    const statsRef = doc(db, "statistics", address);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      await updateDoc(statsRef, {
        nftsBought: statsDoc.data().nftsBought + 1,
      });
    } else {
      await setDoc(statsRef, {
        nftsMinted: 0,
        nftsBought: 1,
        nftsSold: 0,
      });
    }
    console.log("Bought count updated successfully.");
  } catch (error) {
    console.error("Error incrementing bought count:", error);
  }
};

// Increment Sold Count
export const incrementSoldCount = async (address) => {
  try {
    const statsRef = doc(db, "statistics", address);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      await updateDoc(statsRef, {
        nftsSold: statsDoc.data().nftsSold + 1,
      });
    } else {
      await setDoc(statsRef, {
        nftsMinted: 0,
        nftsBought: 0,
        nftsSold: 1,
      });
    }
    console.log("Sold count updated successfully.");
  } catch (error) {
    console.error("Error incrementing sold count:", error);
  }
};

// Fetch User Statistics
export const getUserStatistics = async (address) => {
  try {
    const statsRef = doc(db, "statistics", address);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      return statsDoc.data();
    } else {
      console.warn("User statistics not found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return null;
  }
};

// Update Price History in Firestore
export const updatePriceHistory = async (
  tokenId,
  price,
  currentPrice = null
) => {
  try {
    const priceRef = doc(db, "priceHistory", tokenId.toString());
    const priceDoc = await getDoc(priceRef);

    const newPriceChange = {
      price,
      changeType: "starting", // Default to starting
      timestamp: new Date().toISOString(),
    };

    if (priceDoc.exists()) {
      const priceChanges = priceDoc.data().priceChanges || [];
      const lastPrice = priceChanges.length
        ? parseFloat(priceChanges[priceChanges.length - 1].price)
        : null;

      // Determine changeType based on comparison with the last price
      if (lastPrice !== null) {
        if (parseFloat(price) > lastPrice) {
          newPriceChange.changeType = "increase";
        } else if (parseFloat(price) < lastPrice) {
          newPriceChange.changeType = "decrease";
        } else {
          newPriceChange.changeType = "no_change";
        }
      }

      await updateDoc(priceRef, {
        priceChanges: arrayUnion(newPriceChange),
      });
    } else {
      // Create a new history record if it doesn't exist
      newPriceChange.changeType = "starting"; // First recorded price
      await setDoc(priceRef, {
        tokenId,
        priceChanges: [newPriceChange],
      });
    }

    console.log("Price history updated.");
  } catch (error) {
    console.error("Error updating price history:", error);
  }
};

// Fetch Price History from Firestore
export const getPriceHistory = async (tokenId) => {
  try {
    const priceRef = doc(db, "priceHistory", tokenId.toString());
    const priceDoc = await getDoc(priceRef);

    if (priceDoc.exists()) {
      return priceDoc.data().priceChanges || [];
    } else {
      console.log("No price history found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching price history:", error);
    return [];
  }
};
