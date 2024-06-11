import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';

const Auction = ({ provider, contractAddress }) => {
  const [auctions, setAuctions] = useState([]);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    if (provider) {
      loadAuctions();
    }
  }, [provider]);

  const loadAuctions = async () => {
    try {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setCurrentAddress(address);

      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
      const totalSupply = await contract.tokenCount();
      const items = [];
      for (let i = 1; i <= totalSupply; i++) {
        const [active, highestBidder, highestBid, endTime] = await contract.getAuctionDetails(i);
        if (active) {
          const tokenURI = await contract.tokenURI(i);
          const owner = await contract.ownerOf(i);
          const response = await fetch(tokenURI);
          if (!response.ok) {
            throw new Error(`Failed to fetch metadata for token ${i}`);
          }
          const metadata = await response.json();
          items.push({ id: i, owner, highestBidder, highestBid, endTime, ...metadata });
        }
      }
      setAuctions(items);
    } catch (error) {
      console.error('Error loading auctions:', error);
    }
  };

  const placeBid = async (nft) => {
    if (nft.highestBidder.toLowerCase() === currentAddress.toLowerCase()) {
      alert('You are already the highest bidder.');
      return;
    }

    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);

      const transaction = await contract.placeBid(nft.id, {
        value: ethers.utils.parseUnits(bidAmount, 'ether')
      });
      await transaction.wait();

      alert('Bid placed successfully!');
      loadAuctions();  // Refresh the list of auctions
      setBidAmount('');
    } catch (error) {
      console.error('Error placing bid:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const finalizeAuction = async (nft) => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);

      const transaction = await contract.finalizeAuction(nft.id);
      await transaction.wait();

      alert('Auction finalized successfully!');
      loadAuctions();  // Refresh the list of auctions
    } catch (error) {
      console.error('Error finalizing auction:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const calculateRemainingTime = (endTime) => {
    const now = Math.floor(Date.now() / 1000);
    const remainingTime = endTime - now;
    if (remainingTime <= 0) {
      return 'Auction Ended';
    }
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div>
      <h1>Auctions</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {auctions.length > 0 ? (
          auctions.map(nft => (
            <div key={nft.id} className="nft-card">
              <img src={nft.image} alt={nft.title} style={{ width: '200px' }} />
              <h2>{nft.title}</h2>
              <p>{nft.description}</p>
              <p>Highest Bid: {ethers.utils.formatUnits(nft.highestBid, 'ether')} ETH</p>
              <CountdownTimer endTime={nft.endTime} />
              {nft.owner.toLowerCase() !== currentAddress.toLowerCase() ? (
                <div>
                  <input
                    type="text"
                    placeholder="Bid Amount (ETH)"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                  <button onClick={() => placeBid(nft)}>Place Bid</button>
                </div>
              ) : (
                <p>Your NFT</p>
              )}
              {nft.highestBidder.toLowerCase() === currentAddress.toLowerCase() && (
                <button onClick={() => finalizeAuction(nft)}>Finalize Auction</button>
              )}
            </div>
          ))
        ) : (
          <p>No active auctions.</p>
        )}
      </div>
    </div>
  );
};

const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateRemainingTime(endTime));

  useEffect(() => {
    const interval = setInterval(() => {
      const remainingTime = calculateRemainingTime(endTime);
      setTimeLeft(remainingTime);
      if (remainingTime === 'Auction Ended') {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return <p>Auction Ends In: {timeLeft}</p>;
};

const calculateRemainingTime = (endTime) => {
  const now = Math.floor(Date.now() / 1000);
  const remainingTime = endTime - now;
  if (remainingTime <= 0) {
    return 'Auction Ended';
  }
  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

export default Auction;