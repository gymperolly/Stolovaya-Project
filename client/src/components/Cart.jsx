import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    items,
    totalCount,
    totalPrice,
    removeItem,
    addItem,
    removeItemFully,
    clearCart,
  } = useCart();
  const { user, getAccessToken, getUserName } = useAuth();
  const navigate = useNavigate();

  // Оформить заказ
  const handleCheckout = async () => {
    if (items.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total_price: totalPrice,
          user_name: getUserName()
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price,
        item_name: item.menuItem.name
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 3. Clear cart and redirect
      clearCart()
      setIsOpen(false)
      navigate('/order/' + order.id)

    } catch (err) {
      console.error('Order error:', err)
      alert('Ошибка при оформлении заказа: ' + err.message)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Плавающая кнопка корзины */}
      <AnimatePresence>
        {totalCount > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-primary-500 text-white w-16 h-16 rounded-2xl shadow-2xl shadow-primary-500/40 flex items-center justify-center animate-pulse-glow"
          >
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              <motion.span
                key={totalCount}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md"
              >
                {totalCount}
              </motion.span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Модальное окно корзины */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Затемнённый фон */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />

            {/* Панель корзины */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Заголовок */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">
                  🛒 Корзина
                  <span className="text-primary-500 ml-2 text-base font-medium">
                    {totalCount} шт.
                  </span>
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Список товаров */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {items.map(({ menuItem, quantity }) => (
                    <motion.div
                      key={menuItem.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="flex items-center gap-4 bg-gray-50 rounded-xl p-3"
                    >
                      <img
                        src={menuItem.image_url}
                        alt={menuItem.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm truncate">
                          {menuItem.name}
                        </h4>
                        <p className="text-primary-600 font-bold text-sm">
                          {menuItem.price * quantity} ₸
                        </p>
                      </div>

                      {/* Счётчик */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeItem(menuItem.id)}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                        >
                          −
                        </button>
                        <span className="font-bold text-gray-700 w-6 text-center text-sm">
                          {quantity}
                        </span>
                        <button
                          onClick={() => addItem(menuItem)}
                          className="w-8 h-8 rounded-lg bg-primary-500 shadow-sm flex items-center justify-center text-white hover:bg-primary-600 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Удалить полностью */}
                      <button
                        onClick={() => removeItemFully(menuItem.id)}
                        aria-label="Удалить"
                        className="text-gray-400 hover:text-red-500 transition-colors text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {items.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">🛒</div>
                    <p className="text-gray-400 font-medium">Корзина пуста</p>
                    <p className="text-gray-300 text-sm mt-1">
                      Добавьте что-нибудь вкусное!
                    </p>
                  </div>
                )}
              </div>

              {/* Итого и кнопка заказа */}
              {items.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500 font-medium">Итого:</span>
                    <motion.span
                      key={totalPrice}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-gray-800"
                    >
                      {totalPrice} ₸
                    </motion.span>
                  </div>
                  
                  <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg mb-3 flex gap-2 items-start">
                    <span>⚠️</span>
                    <p>Демо-режим: оплата симулируется.</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className="w-full bg-primary-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Оформляем...
                      </span>
                    ) : (
                      `Оформить заказ • ${totalPrice} ₸`
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
