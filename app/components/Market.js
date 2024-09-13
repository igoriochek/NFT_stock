'use client';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import NFTCard from './NFTCard';  // Import the NFTCard component
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
    <div className="container mx-auto px-8 lg:px-16">
      <h1 className="text-5xl font-bold text-gray-100 text-center my-8 shadow-md">Market</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10">
        {listedNFTs.length > 0 ? (
          listedNFTs.map(nft => (
            <div key={nft.id} className="flex justify-center">
              <NFTCard
                nft={nft}
                currentAddress={currentAddress}
                onBuy={buyNFT}  // Pass the buy function as prop
                isAuction={false}  // Indicate this is for Market, not Auction
              />
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-400">No NFTs for sale.</p>
        )}
      </div>
    </div>
  );
};

export default Market;
