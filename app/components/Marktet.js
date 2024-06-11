import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';

const Market = ({ provider, contractAddress }) => {
  const [listedNFTs, setListedNFTs] = useState([]);
  const [currentAddress, setCurrentAddress] = useState(null);

  useEffect(() => {
    if (provider) {
      loadListedNFTs();
    }
  }, [provider]);

  const loadListedNFTs = async () => {
    try {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setCurrentAddress(address);

      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, provider);
      const listedTokens = await contract.getListedTokens();
      console.log('Listed Tokens:', listedTokens);

      const items = [];
      for (let i = 0; i < listedTokens.length; i++) {
        const tokenId = listedTokens[i];
        const tokenURI = await contract.tokenURI(tokenId);
        const price = await contract.getPrice(tokenId);
        const owner = await contract.ownerOf(tokenId);
        const response = await fetch(tokenURI);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata for token ${tokenId}`);
        }
        const metadata = await response.json();
        items.push({ id: tokenId, price: ethers.utils.formatUnits(price, 'ether'), owner, ...metadata });
      }
      console.log('Market Items:', items);
      setListedNFTs(items);
    } catch (error) {
      console.error('Error loading listed NFTs:', error);
    }
  };

  const buyNFT = async (nft) => {
    if (nft.owner.toLowerCase() === currentAddress.toLowerCase()) {
      alert('You cannot buy your own NFT.');
      return;
    }

    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);

      const transaction = await contract.buy(nft.id, {
        value: ethers.utils.parseUnits(nft.price, 'ether')
      });
      await transaction.wait();

      alert('NFT bought successfully!');
      loadListedNFTs();  // Refresh the list of NFTs for sale
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Market</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {listedNFTs.length > 0 ? (
          listedNFTs.map(nft => (
            <div key={nft.id} className="nft-card">
              <img src={nft.image} alt={nft.title} style={{ width: '200px' }} />
              <h2>{nft.title}</h2>
              <p>{nft.description}</p>
              <p>Price: {nft.price} ETH</p>
              {nft.owner.toLowerCase() !== currentAddress.toLowerCase() ? (
                <button onClick={() => buyNFT(nft)}>Buy</button>
              ) : (
                <p>Your NFT</p>
              )}
            </div>
          ))
        ) : (
          <p>No NFTs for sale.</p>
        )}
      </div>
    </div>
  );
};

export default Market;
