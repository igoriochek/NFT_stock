import React from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

const MetamaskAuth = ({ setAddress, setProvider }) => {
const connectWallet = async () => {
    try {
        const web3Modal = new Web3Modal();
        const instance = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(instance);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        setProvider(provider);
        setAddress(address);
        } catch (error) {
            console.log('Error connecting to wallet:', error);
        }
    };

    return (
        <div>
        <button onClick={connectWallet}>Connect Metamask</button>
        </div>
    );
};

export default MetamaskAuth;