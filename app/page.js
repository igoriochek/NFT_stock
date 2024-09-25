'use client';
import { useMetaMask } from './context/MetaMaskContext'; // Import MetaMaskContext hook
import Link from 'next/link';
import Profile from './components/Profile';
import NFTGallery from './components/NftGallery'; // Keep NFTGallery for the home page
import { shortenAddress } from './utils/shortenAddress';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const Home = () => {
  // Use MetaMaskContext hook to get MetaMask status and actions
  const { isConnected, address, balance, connectMetaMask, provider } = useMetaMask();

  // Check if MetaMask is connected, and render content accordingly
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Welcome to the NFT Gallery</h1>
        <div className="text-center text-gray-700">
          <p className="text-1xl font-bold text-red-600 text-center mb-6">Please connect to MetaMask to see the content.</p>
          <button
            onClick={connectMetaMask}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Connect MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-white text-center mb-6">Welcome to the NFT Gallery</h1>

      {/* Profile Section */}
      <div className="mb-8">
        <Profile currentAddress={shortenAddress(address)} balance={balance} />
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
    </div>
  );
};

export default Home;
