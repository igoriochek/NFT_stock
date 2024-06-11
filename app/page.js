'use client';
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import NFTGallery from './components/NftGallery';
import Market from './components/Marktet';
import Auction from './components/Auction';

// Replace with your contract address after redeployment
const contractAddress = '0x5A75d8F052a0b4A4057d2A3705Df548059bA9fFF';

const Home = () => {
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const initProvider = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        setProvider(provider);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    };

    initProvider();
  }, []);

  return (
    <div className="container">
      <h1>Welcome to the NFT Gallery</h1>
      {provider ? (
        <>
          <NFTGallery provider={provider} contractAddress={contractAddress} showSellButton={false} />
          <Market provider={provider} contractAddress={contractAddress} />
          <Auction provider={provider} contractAddress={contractAddress} />
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Home;