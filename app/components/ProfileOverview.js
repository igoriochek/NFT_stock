const ProfileOverview = ({ address, balance }) => {
  return (
    <div className="bg-white shadow-lg p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-2">Profile Overview</h2>
      <p className="text-gray-700">Address: <span className="text-primary font-semibold">{address}</span></p>
      <p className="text-gray-700">Balance: <span className="text-green-600 font-semibold">{balance} ETH</span></p>
    </div>
  );
};

export default ProfileOverview;
