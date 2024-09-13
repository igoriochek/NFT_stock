'use client';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import Profile from './components/Profile';
import Market from './components/Market';
import Auction from './components/Auction';
import NFTGallery from './components/NftGallery';
import { shortenAddress } from './utils/shortenAddress';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const Home = () => {
  const [provider, setProvider] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const initProvider = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const balance = await signer.getBalance();

        setProvider(provider);
        setCurrentAddress(address);
        setBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    };

    initProvider();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-white text-center mb-6">Welcome to the NFT Gallery</h1>
      
      {/* Check for provider */}
      {provider ? (
        <>
          {/* Profile Section */}
          <div className="mb-8">
            <Profile currentAddress={shortenAddress(currentAddress)} balance={balance} />
          </div>

          {/* Upload Button */}
          <div className="text-center mb-8">
            <Link href="/upload">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">
                Go to Upload Page
              </button>
            </Link>
          </div>

          {/* NFT Gallery */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your NFTs</h2>
            <NFTGallery provider={provider} contractAddress={contractAddress} showSellButton={false} />
          </div>

          {/* Market Section */}
          <div className="mb-12">
            <Market provider={provider} contractAddress={contractAddress} />
          </div>

          {/* Auction Section */}
          <div className="mb-12">
            <Auction provider={provider} contractAddress={contractAddress} />
          </div>
        </>
      ) : (
        <p className="text-center text-gray-700">Loading...</p>
      )}
    </div>
  );
};

export default Home;
