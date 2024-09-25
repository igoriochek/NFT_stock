import React from 'react';
import { shortenBalance } from '../utils/shortenBalance';

const Profile = ({ currentAddress, balance }) => {
  return (
    <div className="profile">
      <p className="address">Address: {currentAddress}</p>
      <p className="balance">Balance: {shortenBalance(balance)} ETH</p>
    </div>
  );
};

export default Profile;