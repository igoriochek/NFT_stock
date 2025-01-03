import React, { useState } from 'react';

const AuctionModal = ({ closeModal, confirmAuction }) => {
  const [duration, setDuration] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Set Auction Duration</h2>
          <button
            className="text-gray-700 hover:text-gray-600 text-xl font-bold p-2 focus:outline-none"
            onClick={closeModal}
            style={{ backgroundColor: 'transparent' }}
          >
            ✕
          </button>
        </div>

        {/* Duration Input */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
            Duration (in seconds)
          </label>
          <input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Enter duration in seconds"
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
          />
        </div>

        {/* Submit Button */}
        <button
          className="bg-blue-500 text-white py-3 px-4 rounded-lg w-full hover:bg-blue-600 transition-all"
          onClick={() => confirmAuction(duration)}
        >
          Confirm Auction
        </button>
      </div>
    </div>
  );
};

export default AuctionModal;
