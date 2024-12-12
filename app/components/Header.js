"use client";
import { useMetaMask } from "../context/MetaMaskContext"; // MetaMask state
import { useNotifications } from "../context/NotificationContext"; // Notifications state
import { useState, useEffect } from "react";
import Link from "next/link";
import { shortenBalance } from "../utils/shortenBalance";
import { db } from "../firebase"; // Firebase setup
import { doc, getDoc } from "firebase/firestore"; // Firebase Firestore imports
import NotificationDropdown from "./NotificationDropdown"; // Notification dropdown
import { FaBell, FaBars, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const {
    username,
    isConnected,
    balance,
    address,
    connectMetaMask,
    disconnectMetaMask,
  } = useMetaMask();
  const { unreadCount } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [profilePicture, setProfilePicture] = useState(
    "/images/default-avatar.png"
  );
  const { setUserId } = useNotifications();

  useEffect(() => {
    if (address) {
      setUserId(address);
    }
  }, [address, setUserId]);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (address) {
        try {
          const userRef = doc(db, "users", address);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfilePicture(
              data.profilePicture || "/images/default-avatar.png"
            );
          }
        } catch (error) {
          console.error("Error fetching profile picture:", error);
        }
      }
    };

    fetchProfilePicture();
  }, [address]);

  return (
    <header className="bg-gray-900 text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center">
      <div className="text-2xl font-bold">NFT Marketplace</div>

      <AnimatePresence>
        {showMenu && (
          <motion.nav
            initial={{ y: -200 }}
            animate={{ y: 0 }}
            exit={{ y: -200 }}
            className="fixed top-0 left-0 right-0 bg-gray-900 text-white flex flex-col items-center justify-center space-y-8 py-8 px-6 text-xl z-40 rounded-b-lg shadow-lg"
          >
            <button
              className="absolute top-4 right-4 text-2xl text-white bg-gray-900 p-2 rounded-full hover:bg-gray-700 w-10 h-10 flex items-center justify-center"
              onClick={() => setShowMenu(false)}
            >
              <FaTimes />
            </button>
            <Link
              href="/"
              onClick={() => setShowMenu(false)}
              className="hover:text-gray-400"
            >
              Home
            </Link>
            <Link
              href="/creators"
              onClick={() => setShowMenu(false)}
              className="hover:text-gray-400"
            >
              Creators
            </Link>
            <Link
              href="/market"
              onClick={() => setShowMenu(false)}
              className="hover:text-gray-400"
            >
              Market
            </Link>
            <Link
              href="/auction"
              onClick={() => setShowMenu(false)}
              className="hover:text-gray-400"
            >
              Auctions
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>

      <nav className="hidden md:flex space-x-6">
        <Link href="/" className="hover:text-gray-400">
          Home
        </Link>
        <Link href="/creators" className="hover:text-gray-400">
          Creators
        </Link>
        <Link href="/market" className="hover:text-gray-400">
          Market
        </Link>
        <Link href="/auction" className="hover:text-gray-400">
          Auctions
        </Link>
      </nav>

      <div className="flex items-center space-x-4">
        {isConnected && (
          <div
            className="relative"
            onMouseEnter={() => setShowNotificationDropdown(true)}
            onMouseLeave={() => setShowNotificationDropdown(false)}
          >
            <button
              onClick={() =>
                setShowNotificationDropdown(!showNotificationDropdown)
              }
              className="relative p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition ease-in-out duration-200"
            >
              <FaBell className="text-white text-lg" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotificationDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-72 bg-gray-800 text-white shadow-lg rounded-lg py-4"
                >
                  <NotificationDropdown />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!isConnected ? (
          <button
            onClick={connectMetaMask}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-all duration-300"
          >
            Connect MetaMask
          </button>
        ) : (
          <div
            className="relative group"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button
              className="flex items-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition ease-in-out duration-300"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <img
                src={profilePicture}
                alt="Profile"
                className="w-8 h-8 rounded-full mr-2"
              />
              <span>{username}</span>
              <span className="ml-2 text-gray-400">
                {shortenBalance(balance)} ETH
              </span>
            </button>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-gray-800 text-white shadow-lg rounded-lg py-4"
                >
                  <div className="px-4 py-2 text-center border-b border-gray-700">
                    <p className="font-bold">{username}</p>
                    <p className="text-sm text-gray-400">
                      {address.substring(0, 6)}...
                      {address.substring(address.length - 4)}
                    </p>
                    <div className="mt-2">
                      <span className="text-gray-500">Current Balance</span>
                      <p className="text-xl font-bold">
                        {shortenBalance(balance)} ETH
                      </p>
                    </div>
                  </div>
                  <ul className="text-center py-2">
                    <li className="py-1 hover:bg-gray-700">
                      <Link href="/profile">My Profile</Link>
                    </li>
                    <li className="py-1 hover:bg-gray-700">
                      <Link href="/upload">My Items</Link>
                    </li>
                    <li className="py-1 hover:bg-gray-700">
                      <Link href="/funds">Manage Funds</Link>
                    </li>
                    <li className="py-1 hover:bg-gray-700">
                      <button onClick={disconnectMetaMask}>Disconnect</button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="md:hidden">
          <button
            className="text-gray-400 text-2xl bg-gray-800 hover:bg-gray-700 transition ease-in-out duration-300"
            onClick={() => setShowMenu(!showMenu)}
          >
            {showMenu ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
