import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

const MenuCard = React.memo(({ item }) => {
  const { addItem, removeItem, getItemQuantity } = useCart();
  const quantity = getItemQuantity(item.id);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300"
    >
      {/* Изображение блюда */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
        {!item.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg bg-red-500 px-4 py-1 rounded-full">
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      {/* Информация о блюде */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-base mb-1 line-clamp-2">
          {item.name}
        </h3>
        <p className="text-primary-600 font-bold text-lg mt-auto mb-3">
          {item.price} ₸
        </p>

        {/* Кнопка добавления / счётчик количества */}
        <AnimatePresence mode="wait">
          {quantity === 0 ? (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => addItem(item)}
              disabled={!item.is_available}
              className={`
                w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
                ${
                  item.is_available
                    ? 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95 shadow-md shadow-primary-500/20'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Добавить
            </motion.button>
          ) : (
            <motion.div
              key="counter"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-between bg-primary-50 rounded-xl p-1"
            >
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => removeItem(item.id)}
                className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary-600 font-bold text-xl hover:bg-primary-100 transition-colors"
              >
                −
              </motion.button>
              <motion.span
                key={quantity}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="font-bold text-primary-700 text-lg min-w-[2rem] text-center"
              >
                {quantity}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => addItem(item)}
                className="w-10 h-10 rounded-lg bg-primary-500 shadow-sm flex items-center justify-center text-white font-bold text-xl hover:bg-primary-600 transition-colors"
              >
                +
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default MenuCard;
