'use client';
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';

const WalletDashboard = ({ provider, contractAddress }) => {
  const [balance, setBalance] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null); // New state for error handling

  useEffect(() => {
    if (provider) {
      loadWalletData();
      loadNFTs();
      loadTransactions();
    }
  }, [provider]);

  const loadWalletData = async () => {
    try {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const balance = await signer.getBalance();
      setCurrentAddress(address);
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      setError('Error loading wallet data');
      console.error('Error loading wallet data:', error);
    }
  };

  const loadNFTs = async () => {
    try {
      if (!currentAddress) {
        throw new Error('No wallet address found');
      }

      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
      const totalSupply = await contract.tokenCount();
      const items = [];

      for (let i = 1; i <= totalSupply; i++) {
        const owner = await contract.ownerOf(i);
        // Only add NFTs owned by the current address
        if (owner.toLowerCase() === currentAddress.toLowerCase()) {
          const tokenURI = await contract.tokenURI(i);
          const response = await fetch(tokenURI);
          const metadata = await response.json();
          items.push({ id: i, ...metadata });
        }
      }

      setNfts(items);
    } catch (error) {
      setError('Error loading NFTs');
      console.error('Error loading NFTs:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      // Placeholder transactions (replace with actual logic)
      const txs = [
        { txHash: '0x123...', date: '2024-01-01', amount: '0.5 ETH', status: 'Success' },
        { txHash: '0x456...', date: '2024-01-05', amount: '1.2 ETH', status: 'Failed' }
      ];
      setTransactions(txs);
    } catch (error) {
      setError('Error loading transactions');
      console.error('Error loading transactions:', error);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Wallet Dashboard</h1>

      {/* Error Display */}
      {error && <p className="text-red-600">{error}</p>}

      {/* Wallet Balance Section */}
      <section className="mb-12 p-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Wallet Balance</h2>
        <p className="text-3xl text-green-600 font-semibold">{balance ? `${balance} ETH` : 'Loading balance...'}</p>
      </section>

      {/* Your NFTs Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Your NFTs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {nfts.length > 0 ? (
            nfts.map((nft) => (
              <div key={nft.id} className="bg-gray-800 text-white p-6 rounded-lg shadow-md">
                <img src={nft.image} alt={nft.title} className="w-full h-auto rounded-lg mb-4" />
                <h3 className="text-lg font-bold mb-2">{nft.title}</h3>
                <p>{nft.description}</p>
              </div>
            ))
          ) : (
            <p>No NFTs owned yet.</p>
          )}
        </div>
      </section>

      {/* Recent Transactions Section */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Recent Transactions</h2>
        {transactions.length > 0 ? (
          <table className="table-auto w-full text-left bg-white rounded-lg shadow-md">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="px-4 py-2">Tx Hash</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr key={index} className="border-t text-gray-800">
                  <td className="px-4 py-2">{tx.txHash}</td>
                  <td className="px-4 py-2">{tx.date}</td>
                  <td className="px-4 py-2">{tx.amount}</td>
                  <td className="px-4 py-2">{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No recent transactions.</p>
        )}
      </section>
    </div>
  );
};

export default WalletDashboard;
