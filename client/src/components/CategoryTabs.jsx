import React from 'react';
import { motion } from 'framer-motion';

const categories = [
  { id: 'bakery', label: 'Выпечка', emoji: '🥐' },
  { id: 'drinks', label: 'Напитки', emoji: '🥤' },
  { id: 'hot', label: 'Горячее', emoji: '🍲' },
  { id: 'soups', label: 'Супы', emoji: '🍜' },
];

const CategoryTabs = React.memo(({ activeCategory, onCategoryChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <motion.button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`
            relative flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm
            whitespace-nowrap transition-colors duration-200
            ${
              activeCategory === cat.id
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-white text-gray-600 hover:bg-primary-50 shadow-sm'
            }
          `}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          layout
        >
          <span className="text-lg">{cat.emoji}</span>
          <span>{cat.label}</span>
          {activeCategory === cat.id && (
            <motion.div
              className="absolute inset-0 bg-primary-500 rounded-2xl -z-10"
              layoutId="activeTab"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
});

export default CategoryTabs;
