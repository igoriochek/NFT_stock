'use client';
import { useMetaMask } from '../context/MetaMaskContext'; // Import MetaMaskContext hook
import Market from '../components/Market'; // Import Market component

const MarketPage = () => {
  const { provider, address } = useMetaMask(); // Access provider from MetaMaskContext

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  return (
    <div className="container mx-auto px-8 lg:px-16">
      <Market provider={provider} contractAddress={contractAddress} currentAddress={address} />
    </div>
  );
};

export default MarketPage;
