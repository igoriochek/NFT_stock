'use client';
import { useMetaMask } from "../context/MetaMaskContext"; // Using MetaMask context for state
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { shortenBalance } from "../utils/shortenBalance";

const Header = () => {
  const { username, isConnected, balance, address, connectMetaMask } = useMetaMask();
  const [showDropdown, setShowDropdown] = useState(false); // Dropdown toggle state

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="bg-primary text-white p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="text-2xl font-bold">NFT Marketplace</div>
      <nav className="flex gap-4 items-center">
        <Link href="/" className="hover:text-accent">Home</Link>
        <Link href="/market" className="hover:text-accent">Market</Link>
        <Link href="/auction" className="hover:text-accent">Auctions</Link>

        {!isConnected ? (
          <button
            onClick={connectMetaMask} // Trigger MetaMask connection
            className="bg-blue-500 text-white p-2 rounded"
          >
            Connect MetaMask
          </button>
        ) : (
          <div className="relative">
            <button 
              onClick={toggleDropdown} 
              className="flex items-center p-2 bg-red-800 hover:bg-blue-600 rounded-lg"
            >
              {/* Profile picture or default avatar */}
              <img 
                src="/default-avatar.png" // Replace with actual profile picture if available
                alt="Profile"
                className="w-8 h-8 rounded-full mr-2"
              />
              <span>{username}</span>
              <span className="ml-2 text-gray-300">{shortenBalance(balance)} ETH</span>
            </button>
            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg py-4 text-gray-800">
                <div className="px-4 py-2 text-center border-b">
                  <p className="font-bold">{username}</p>
                  <p className="text-sm text-gray-500">{address.substring(0, 6)}...{address.substring(address.length - 4)}</p>
                  <div className="mt-2">
                    <span className="text-gray-600">Current Balance</span>
                    <p className="text-xl font-bold">{shortenBalance(balance)} ETH</p>
                  </div>
                </div>
                <ul className="text-center py-2">
                  <li className="py-1 hover:bg-gray-200"><Link href="/profile">My Profile</Link></li>
                  <li className="py-1 hover:bg-gray-200"><Link href="/upload">My Items</Link></li>
                  <li className="py-1 hover:bg-gray-200"><Link href="/funds">Manage Funds</Link></li>
                  <li className="py-1 hover:bg-gray-200"><button onClick={() => connectMetaMask()}>Disconnect</button></li>
                </ul>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
