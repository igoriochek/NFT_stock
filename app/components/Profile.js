import React from 'react';

const Profile = ({ currentAddress, balance }) => {
  return (
    <div className="profile">
      <p className="address">Address: {currentAddress}</p>
      <p className="balance">Balance: {balance} ETH</p>
    </div>
  );
};

export default Profile;