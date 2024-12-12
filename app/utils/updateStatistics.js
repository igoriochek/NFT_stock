import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

export const updateNFTMintedStats = async (userAddress) => {
  const statsRef = doc(db, "statistics", userAddress);

  try {
    const statsDoc = await getDoc(statsRef);
    if (!statsDoc.exists()) {
      await setDoc(statsRef, {
        nftsMinted: 1,
        nftsBought: 0,
        nftsSold: 0,
      });
    } else {
      await updateDoc(statsRef, {
        nftsMinted: increment(1),
      });
    }
  } catch (error) {
    console.error("Error updating minted stats:", error);
  }
};

export const updateNFTBoughtStats = async (buyerAddress) => {
  const statsRef = doc(db, "statistics", buyerAddress);

  try {
    const statsDoc = await getDoc(statsRef);
    if (!statsDoc.exists()) {
      await setDoc(statsRef, {
        nftsMinted: 0,
        nftsBought: 1,
        nftsSold: 0,
      });
    } else {
      await updateDoc(statsRef, {
        nftsBought: increment(1),
      });
    }
  } catch (error) {
    console.error("Error updating bought stats:", error);
  }
};

export const updateNFTSoldStats = async (sellerAddress) => {
  const statsRef = doc(db, "statistics", sellerAddress);

  try {
    const statsDoc = await getDoc(statsRef);
    if (!statsDoc.exists()) {
      await setDoc(statsRef, {
        nftsMinted: 0,
        nftsBought: 0,
        nftsSold: 1,
      });
    } else {
      await updateDoc(statsRef, {
        nftsSold: increment(1),
      });
    }
  } catch (error) {
    console.error("Error updating sold stats:", error);
  }
};
