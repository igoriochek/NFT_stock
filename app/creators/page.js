"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore"; // Firestore imports
import { db } from "../firebase"; // Firebase initialization
import Link from "next/link"; // Import Link for profile redirection
import { ethers } from "ethers"; // Import ethers for balance fetching
import { shortenBalance } from "../utils/shortenBalance";


const Creators = () => {
  const [creators, setCreators] = useState([]);
  const [balances, setBalances] = useState({}); // State to store user balances

  // Fetch all users from Firebase
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const usersCollection = collection(db, "users");
        const userDocs = await getDocs(usersCollection);
        const usersData = userDocs.docs.map((doc) => doc.data());
        setCreators(usersData);

        // Fetch balance for each creator
        await fetchBalances(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    // Fetch balances using ethers.js
    const fetchBalances = async (creators) => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const newBalances = {};

        for (const creator of creators) {
          if (creator.address) {
            const balance = await provider.getBalance(creator.address);
            newBalances[creator.address] = ethers.utils.formatEther(balance); // Store balance in ETH format
          }
        }

        setBalances(newBalances); // Update state with all balances
      }
    };

    fetchCreators();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-6">Creators</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {creators.map((creator, index) => (
          <div
            key={index}
            className="bg-white shadow-lg rounded-lg p-4 flex flex-col items-center text-gray-800"
          >
            {" "}
            {/* Set text color to avoid white text */}
            <Link href={`/creators/${creator.address}`} passHref>
              <img
                src={
                  creator.profilePicture || "https://via.placeholder.com/72x72"
                }
                alt={creator.username}
                className="w-18 h-18 rounded-full mb-2 cursor-pointer"
              />
            </Link>
            <Link href={`/creators/${creator.address}`} passHref>
              <h3 className="text-lg font-semibold hover:underline cursor-pointer">
                {creator.username}
              </h3>{" "}
              {/* Link to profile */}
            </Link>
            <p className="text-gray-500">
              {creator.followers?.length || 0} Followers
            </p>
            <p className="text-gray-600">
              {shortenBalance(balances[creator.address]) ? `${shortenBalance(balances[creator.address])} ETH` : "Balance not available"}
            </p>{" "}
            {/* Show dynamic balance */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Creators;
