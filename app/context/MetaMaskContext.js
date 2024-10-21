import { createContext, useState, useContext, useEffect } from "react";
import { ethers } from "ethers";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useRouter } from "next/navigation"; // Import router for redirection

const MetaMaskContext = createContext();

export const useMetaMask = () => useContext(MetaMaskContext);

export const MetaMaskProvider = ({ children }) => {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [balance, setBalance] = useState(null); // Store balance
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState(null);
  const [profilePicture, setProfilePicture] = useState("/images/default-avatar.png");
  const [likedArtworks, setLikedArtworks] = useState([]);
  const [following, setFollowing] = useState([]);
  const router = useRouter(); // Initialize router for redirection

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Request MetaMask accounts
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        const userBalance = await signer.getBalance(); // Fetch balance

        setProvider(provider);
        setAddress(userAddress);
        setBalance(ethers.utils.formatEther(userBalance)); // Store balance
        setIsConnected(true);

        // Fetch user profile from Firestore
        const userRef = doc(db, "users", userAddress);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userProfile = userSnap.data();
          setUsername(userProfile.username);
          setProfilePicture(userProfile.profilePicture || "/images/default-avatar.png");
          setLikedArtworks(userProfile.likedArtworks || []);
          setFollowing(userProfile.following || []);
        } else {
          // Redirect to profile completion page if no profile exists
          router.push(`/complete-profile?address=${userAddress}`);
        }
      } catch (error) {
        console.error("MetaMask connection failed:", error);
      }
    } else {
      console.error("MetaMask is not installed.");
    }
  };

  const disconnectMetaMask = () => {
    // Clear the app's state
    setProvider(null);
    setAddress(null);
    setBalance(null);
    setUsername(null);
    setProfilePicture("/images/default-avatar.png");
    setIsConnected(false);
    
    // Optionally reload the page to clear any cached state
    window.location.reload();
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = provider.getSigner();
          const userAddress = await signer.getAddress();
          const userBalance = await signer.getBalance(); // Fetch balance on load

          setProvider(provider);
          setAddress(userAddress);
          setBalance(ethers.utils.formatEther(userBalance)); // Store balance
          setIsConnected(true);

          // Fetch user profile on load
          const userRef = doc(db, "users", userAddress);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userProfile = userSnap.data();
            setUsername(userProfile.username);
            setProfilePicture(userProfile.profilePicture || "/images/default-avatar.png");
            setLikedArtworks(userProfile.likedArtworks || []);
            setFollowing(userProfile.following || []);
          } else {
            // Redirect to profile completion page if no profile exists
            router.push(`/complete-profile?address=${userAddress}`);
          }
        }
      }
    };

    checkConnection();
  }, []);

  return (
    <MetaMaskContext.Provider value={{ address, username, isConnected, balance, profilePicture, likedArtworks, following, connectMetaMask, disconnectMetaMask, provider }}>
      {children}
    </MetaMaskContext.Provider>
  );
};
