import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';

const NFTGallery = ({ provider, contractAddress, ownerAddress, showSellButton }) => {
  const [nfts, setNfts] = useState([]);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [price, setPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('');

  useEffect(() => {
    if (provider) {
      loadNFTs();
    }
  }, [provider]);

  const loadNFTs = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
      const totalSupply = await contract.tokenCount();
      const items = [];
      for (let i = 1; i <= totalSupply; i++) {
        const tokenURI = await contract.tokenURI(i);
        const owner = await contract.ownerOf(i);
        if (!ownerAddress || owner.toLowerCase() === ownerAddress.toLowerCase()) {
          const response = await fetch(tokenURI);
          if (!response.ok) {
            throw new Error(`Failed to fetch metadata for token ${i}`);
          }
          const metadata = await response.json();
          items.push({ id: i, owner, ...metadata });
        }
      }
      setNfts(items);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    }
  };

  const handleSell = (nft) => {
    setSelectedNFT(nft);
  };

  const handleAuction = (nft) => {
    setSelectedNFT(nft);
  };

  const listForSale = async () => {
    if (!selectedNFT || !price) return;

    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);

      const transaction = await contract.listForSale(selectedNFT.id, ethers.utils.parseUnits(price, 'ether'));
      await transaction.wait();

      alert('NFT listed for sale successfully!');
      setSelectedNFT(null);
      setPrice('');
    } catch (error) {
      console.error('Error listing NFT for sale:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const startAuction = async () => {
    if (!selectedNFT || !auctionDuration) return;

    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);

      const transaction = await contract.startAuction(selectedNFT.id, auctionDuration);
      await transaction.wait();

      alert('Auction started successfully!');
      setSelectedNFT(null);
      setAuctionDuration('');
    } catch (error) {
      console.error('Error starting auction:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>{ownerAddress ? "My NFTs" : "All NFTs"}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {nfts.length > 0 ? (
          nfts.map(nft => (
            <div key={nft.id} className="nft-card">
              <img src={nft.image} alt={nft.title} style={{ width: '200px' }} />
              <h2>{nft.title}</h2>
              <p>{nft.description}</p>
              <p>Owner: {nft.owner}</p>
              {showSellButton && ownerAddress && (
                <div>
                  <button onClick={() => handleSell(nft)}>Sell</button>
                  <button onClick={() => handleAuction(nft)}>Auction</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No NFTs found.</p>
        )}
      </div>
      {selectedNFT && (
        <div>
          <h2>Sell {selectedNFT.title}</h2>
          <input
            placeholder="Price (ETH)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button onClick={listForSale}>List for Sale</button>
        </div>
      )}
      {selectedNFT && (
        <div>
          <h2>Auction {selectedNFT.title}</h2>
          <input
            placeholder="Duration (seconds)"
            value={auctionDuration}
            onChange={(e) => setAuctionDuration(e.target.value)}
          />
          <button onClick={startAuction}>Start Auction</button>
        </div>
      )}
    </div>
  );
};

export default NFTGallery;
