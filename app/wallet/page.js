'use client'
import WalletDashboard from '../components/WalletDashboard';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const WalletPage = () => {
  const [provider, setProvider] = useState(null);
  const contractAddress = '0xd5ba708053Da4404E39C2c41a9b0022368Da06D6';

  useEffect(() => {
    const initProvider = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      setProvider(provider);
    };

    initProvider();
  }, []);

  return (
    <div>
      {provider ? (
        <WalletDashboard provider={provider} contractAddress={contractAddress} />
      ) : (
        <p>Loading wallet data...</p>
      )}
    </div>
  );
};

export default WalletPage;
