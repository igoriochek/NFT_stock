// modals/SellModal.js
import React, { useState } from 'react';

const SellModal = ({ closeModal, confirmSell }) => {
  const [price, setPrice] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Set Price for Selling</h2>
          <button
            className="text-gray-700 hover:text-gray-600 text-xl font-bold p-2 focus:outline-none"
            onClick={closeModal}
            style={{ backgroundColor: 'transparent' }}
          >
            ✕
          </button>
        </div>

        {/* Price Input */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
            Price (ETH)
          </label>
          <input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price in ETH"
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
          />
        </div>

        {/* Submit Button */}
        <button
          className="bg-green-500 text-white py-3 px-4 rounded-lg w-full hover:bg-green-600 transition-all"
          onClick={() => confirmSell(price)}
        >
          Confirm Sale
        </button>
      </div>
    </div>
  );
};

export default SellModal;
