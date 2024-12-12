"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import Link from "next/link";
import { ethers } from "ethers";
import { shortenBalance } from "../utils/shortenBalance";

const CreatorsSection = ({ followingList }) => {
  const [creators, setCreators] = useState([]);
  const [balances, setBalances] = useState({});

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        // Check if we need to filter by following list or show all users
        const usersCollection = collection(db, "users");
        let userQuery;

        if (followingList && followingList.length > 0) {
          userQuery = query(usersCollection, where("address", "in", followingList));
        } else {
          userQuery = usersCollection;
        }

        const userDocs = await getDocs(userQuery);
        const usersData = userDocs.docs.map((doc) => doc.data());
        setCreators(usersData);

        await fetchBalances(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchBalances = async (creators) => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const newBalances = {};

        for (const creator of creators) {
          if (creator.address) {
            const balance = await provider.getBalance(creator.address);
            newBalances[creator.address] = ethers.utils.formatEther(balance);
          }
        }

        setBalances(newBalances);
      }
    };

    fetchCreators();
  }, [followingList]);

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-center text-white mb-6">
        {followingList && followingList.length > 0 ? "Following Creators" : "All Creators"}
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {creators.map((creator, index) => (
          <div
            key={index}
            className="bg-white shadow-lg rounded-lg p-4 flex flex-col items-center text-gray-800"
          >
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
              </h3>
            </Link>
            <p className="text-gray-500">{creator.followers?.length || 0} Followers</p>
            <p className="text-gray-600">
              {shortenBalance(balances[creator.address]) || "Balance not available"} ETH
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatorsSection;
