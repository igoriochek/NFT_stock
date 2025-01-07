"use client";
import { useState, useEffect } from "react";

const FilterPanel = ({ categories, priceSteps, onFilterChange }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, priceSteps.length - 1]); // Use index range
  const [sortOrder, setSortOrder] = useState("newest");
  const [accordionCategoriesOpen, setAccordionCategoriesOpen] = useState(false);
  const [accordionPriceOpen, setAccordionPriceOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Update filters on change
  useEffect(() => {
    onFilterChange({
      selectedCategories,
      priceRange,
      sortOrder,
    });
  }, [selectedCategories, priceRange, sortOrder]);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  };

  const handlePriceChange = (type, value) => {
    const updatedRange = [...priceRange];
    updatedRange[type === "min" ? 0 : 1] = parseInt(value, 10);

    // Ensure minimum index is not greater than maximum index
    if (updatedRange[0] > updatedRange[1]) {
      updatedRange[type === "min" ? 1 : 0] = parseInt(value, 10);
    }

    setPriceRange(updatedRange);
  };

  const commonAccordionStyle = `
    transition-all duration-500 ease-in-out overflow-hidden
  `;

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8 w-full shadow-md">
      <h2 className="text-xl font-bold text-gray-200 mb-4">Filters</h2>

      {/* Categories Accordion */}
      <div className="mb-4">
        <h3
          className="text-lg font-semibold text-gray-300 mb-0 cursor-pointer flex justify-between items-center bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-300 h-11"
          onClick={() => setAccordionCategoriesOpen(!accordionCategoriesOpen)}
        >
          Categories
          <span
            className={`text-gray-400 transform transition-transform duration-300 ${
              accordionCategoriesOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            ▼
          </span>
        </h3>
        <div
          className={`${commonAccordionStyle} ${
            accordionCategoriesOpen ? "max-h-[300px] py-4" : "max-h-0"
          }`}
        >
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => toggleCategory(category)}
              className={`block w-full text-left px-4 py-2 rounded-md mb-2 transition-colors duration-200 ${
                selectedCategories.includes(category)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Accordion */}
      <div className="mb-4">
        <h3
          className="text-lg font-semibold text-gray-300 mb-0 cursor-pointer flex justify-between items-center bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-300 h-11"
          onClick={() => setAccordionPriceOpen(!accordionPriceOpen)}
        >
          Price Range (ETH)
          <span
            className={`text-gray-400 transform transition-transform duration-300 ${
              accordionPriceOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            ▼
          </span>
        </h3>
        <div
          className={`${commonAccordionStyle} ${
            accordionPriceOpen ? "max-h-[200px] py-4" : "max-h-0"
          }`}
        >

          {/* Min Price Slider */}
          <div className="mb-4">
            <label className="text-gray-300 text-sm block mb-2">
              Min Price: {priceSteps[priceRange[0]]} ETH
            </label>
            <input
              type="range"
              min="0"
              max={priceSteps.length - 1}
              step="1"
              value={priceRange[0]}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Max Price Slider */}
          <div>
            <label className="text-gray-300 text-sm block mb-2">
              Max Price: {priceSteps[priceRange[1]]} ETH
            </label>
            <input
              type="range"
              min="0"
              max={priceSteps.length - 1}
              step="1"
              value={priceRange[1]}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Sort By */}
      <div className="mt-6 relative">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Sort By</h3>
        <div
          className="relative"
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
        >
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="text-lg bg-gray-700 font-semibold text-gray-300 rounded-lg px-4 py-2 w-full cursor-pointer hover:bg-gray-600 appearance-none h-11"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="low_to_high">Price: Low to High</option>
            <option value="high_to_low">Price: High to Low</option>
          </select>
          <span
            className={`absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 transform transition-transform duration-300 ${
              sortDropdownOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            ▼
          </span>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
