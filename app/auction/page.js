'use client';
import { useMetaMask } from '../context/MetaMaskContext'; // Import MetaMaskContext hook
import Auction from '../components/Auction'; // Import Auction component

const AuctionPage = () => {
  const { provider, address } = useMetaMask(); // Access provider from MetaMaskContext

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  return (
    <div className="w-full px-4 lg:px-16">
      <Auction provider={provider} contractAddress={contractAddress} currentAddress={address} />
    </div>
  );
};

export default AuctionPage;
