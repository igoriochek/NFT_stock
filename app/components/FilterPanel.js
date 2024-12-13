"use client";
import { useState, useEffect, useMemo } from "react";

const FilterPanel = ({ categories, onFilterChange }) => {
  const initialPriceRange = useMemo(() => [0, 100], []);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [sortOrder, setSortOrder] = useState("newest");
  const [accordionCategoriesOpen, setAccordionCategoriesOpen] = useState(false);
  const [accordionPriceOpen, setAccordionPriceOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Handle category selection
  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  };

  // Update filters on change without including onFilterChange in dependencies
  useEffect(() => {
    onFilterChange({ selectedCategories, priceRange, sortOrder });
  }, [selectedCategories, priceRange, sortOrder]);

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
            accordionPriceOpen ? "max-h-[100px] py-4" : "max-h-0"
          }`}
        >
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, parseInt(e.target.value, 10)])}
            className="w-full cursor-pointer"
          />
          <p className="text-gray-300 text-sm mt-2">0 - {priceRange[1]} ETH</p>
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
