import React, { useState } from 'react';

const AuctionModal = ({ closeModal, confirmAuction }) => {
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  // Utility to convert days/hours/minutes into total seconds.
  const calculateTotalSeconds = () => {
    const d = parseInt(days) || 0;
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;

    // 1 day = 86400 seconds
    // 1 hour = 3600 seconds
    // 1 minute = 60 seconds
    return d * 86400 + h * 3600 + m * 60;
  };

  const handleConfirm = () => {
    const totalSeconds = calculateTotalSeconds();
    confirmAuction(totalSeconds);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Set Auction Duration</h2>
          <button
            className="text-gray-700 hover:text-gray-600 text-xl font-bold p-2 focus:outline-none w-10"
            onClick={closeModal}
            style={{ backgroundColor: 'transparent' }}
          >
            ✕
          </button>
        </div>

        {/* Duration Input */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1">
                Days
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full p-2 border border-gray-300 rounded text-gray-700 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1">
                Hours
              </label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full p-2 border border-gray-300 rounded text-gray-700 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1">
                Minutes
              </label>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full p-2 border border-gray-300 rounded text-gray-700 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          className="bg-blue-500 text-white py-3 px-4 rounded-lg w-full hover:bg-blue-600 transition-all"
          onClick={handleConfirm}
        >
          Confirm Auction
        </button>
      </div>
    </div>
  );
};

export default AuctionModal;
