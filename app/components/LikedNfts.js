'use client';
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import NFTCard from './NFTCard'; // Use the existing NFTCard component
import { doc, getDoc } from "firebase/firestore"; 
import { db } from '../firebase'; // Firebase initialization
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json'; // Import your contract's ABI

const LikedNFTs = ({ provider, contractAddress, likedArtworks, currentAddress }) => {
  const [likedNFTData, setLikedNFTData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (provider && likedArtworks.length > 0) {
      loadLikedNFTs();
    } else {
      console.log('Provider or likedArtworks not set correctly');
    }
  }, [provider, likedArtworks]);

  const loadLikedNFTs = async () => {
    setLoading(true);
    try {
      console.log('Loading liked NFTs:', likedArtworks); // Check likedArtworks array

      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
      const likedNFTs = [];

      for (const nftId of likedArtworks) {
        try {
          console.log('Fetching data for NFT ID:', nftId); // Check each NFT ID

          // Fetch metadata from Firebase
          const nftDoc = await getDoc(doc(db, 'nfts', nftId));
          if (!nftDoc.exists()) {
            console.error('NFT not found in Firebase:', nftId);
            continue;
          }

          let nftData = { id: nftId, ...nftDoc.data() };
          console.log('Firebase Data for NFT:', nftData);

          // Fetch on-chain data
          const tokenURI = await contract.tokenURI(nftId);
          const price = await contract.getPrice(nftId);
          const owner = await contract.ownerOf(nftId);

          console.log('Blockchain Data:', { tokenURI, price, owner });

          // Fetch the metadata from tokenURI
          const response = await fetch(tokenURI);
          if (!response.ok) {
            console.error('Failed to fetch metadata from tokenURI:', tokenURI);
            continue;
          }

          const metadata = await response.json();
          console.log('Metadata from tokenURI:', metadata);

          // Merge metadata from blockchain and Firebase
          likedNFTs.push({
            id: nftId,
            price: ethers.utils.formatUnits(price, 'ether'),
            owner,
            ...metadata,  // title, image, description
            ...nftData    // likes data from Firebase
          });
        } catch (error) {
          console.error('Error loading liked NFT:', error);
        }
      }

      setLikedNFTData(likedNFTs);
    } catch (error) {
      console.error('Error fetching liked NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-8 lg:px-16">
      <h1 className="text-3xl font-bold text-gray-100 text-center my-8">Liked NFTs</h1>
      {loading ? (
        <p className="text-center text-gray-400">Loading liked NFTs...</p>
      ) : likedNFTData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
          {likedNFTData.map((nft) => (
            <div key={nft.id} className="flex justify-center">
              <NFTCard
                nft={nft}
                currentAddress={currentAddress}
                isAuction={false}  // Assuming liked NFTs are not auctions
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">No liked NFTs found.</p>
      )}
    </div>
  );
};

export default LikedNFTs;
