'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MetamaskAuth from '../components/MetamaskAuth';
import NFTGallery from '../components/NftGallery';
import { ethers } from 'ethers';
import ArtNFT from '@/artifacts/contracts/ArtNFT.sol/ArtNFT.json';

const EXPECTED_CHAIN_ID = 1337;

const pinataJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2NmQ4NDVlZi1iNGY1LTQ4ZTItYTg1MC0zNGY1YzczYWVjZDkiLCJlbWFpbCI6InJ4dG1hcmtAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjU0MDYyODMwYzU1ZjNhNzE3NTY3Iiwic2NvcGVkS2V5U2VjcmV0IjoiN2M5YjhjNjgxZGE3ZWE5M2RkNTdmZTE2NzMzZDEwN2RmYjhhYTRiMTNhYzA2MjFmMWVlMDRlNjIyYmQ5MTBkMSIsImlhdCI6MTcxODAyNzY4M30.CgKaLE-JfEEHHFeKqbb7FaRZLdUFixJ6FtzyPq5YdPA';

const Upload = () => {
    const [address, setAddress] = useState('');
    const [provider, setProvider] = useState(null);
    const [formInput, setFormInput] = useState({ title: '', description: '' });
    const [fileUrl, setFileUrl] = useState(null);
    const [ipfsHash, setIpfsHash] = useState(null);
    const contractAddress = '0x5A75d8F052a0b4A4057d2A3705Df548059bA9fFF';
  
    useEffect(() => {
        const checkMetaMaskConnection = async () => {
          if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
              const address = accounts[0];
              setProvider(provider);
              setAddress(address);
            }
          }
        };
    
        checkMetaMaskConnection();
      }, []);
    
      const onChange = async (e) => {
        const file = e.target.files[0];
        try {
          const formData = new FormData();
          formData.append('file', file);
    
          const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${pinataJwt}`,
            },
          });
    
          const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
          setFileUrl(url);
        } catch (error) {
          console.log('Error uploading file: ', error);
        }
      };
    
      const uploadAndMint = async () => {
        const { title, description } = formInput;
        if (!title || !description || !fileUrl) return;
    
        const data = {
          pinataMetadata: {
            name: title,
          },
          pinataContent: {
            title,
            description,
            image: fileUrl,
            creator: address, // user's address
          },
        };
    
        try {
          const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${pinataJwt}`,
            },
          });
    
          const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
          setIpfsHash(url);
    
          if (!provider) {
            alert('Please connect to Metamask first.');
            return;
          }
    
          const network = await provider.getNetwork();
          if (network.chainId !== EXPECTED_CHAIN_ID) {
            alert(`Please connect to the correct network. Expected chain ID: ${EXPECTED_CHAIN_ID}, but got: ${network.chainId}`);
            return;
          }
    
          const signer = provider.getSigner();
          const contract = new ethers.Contract(contractAddress, ArtNFT.abi, signer);
    
          console.log('Minting NFT with URI:', url);
          let transaction = await contract.mint(url);
          await transaction.wait();
          alert('NFT Minted Successfully!');
        } catch (error) {
          console.error('Error uploading or minting:', error);
          alert(`Error: ${error.message}`);
        }
      };
    
      return (
        <div className="container">
          {!provider && <MetamaskAuth setAddress={setAddress} setProvider={setProvider} />}
          <div>
            <input
              placeholder="Title"
              onChange={(e) => setFormInput({ ...formInput, title: e.target.value })}
            />
            <input
              placeholder="Description"
              onChange={(e) => setFormInput({ ...formInput, description: e.target.value })}
            />
            <input type="file" onChange={onChange} />
            <button onClick={uploadAndMint}>Upload Art and Mint NFT</button>
          </div>
          {provider && (
            <NFTGallery
              provider={provider}
              contractAddress={contractAddress}
              ownerAddress={address}
              showSellButton={true}
            />
          )}
        </div>
      );
    };
    
    export default Upload;