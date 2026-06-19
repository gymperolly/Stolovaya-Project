import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { getAccessToken } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', id)
          .single();
        if (!error && order) {
          setOrder(order);
          // Устанавливаем активный заказ в localStorage
          if (order.status !== 'completed') {
            localStorage.setItem('activeOrderId', order.id);
          } else {
            localStorage.removeItem('activeOrderId');
          }
        }
      } catch (err) {
        console.error('Ошибка:', err);
      }
      setLoading(false);
    };
    fetchOrder();

    // Bug 3: Supabase Realtime subscription
    const subscription = supabase
      .channel('order-status-' + id)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: 'id=eq.' + id
      }, (payload) => {
        setOrder(prev => prev ? { ...prev, ...payload.new } : payload.new);
        if (payload.new.status === 'completed') {
          localStorage.removeItem('activeOrderId');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id, getAccessToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full"
      >
        {/* Иконка успеха */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-4xl">✅</span>
        </motion.div>

        <h1 className="text-2xl font-extrabold text-gray-800 text-center mb-2">
          Заказ оформлен!
        </h1>

        <p className="text-center text-gray-400 text-sm mb-6">
          Номер заказа: <span className="font-mono text-primary-600 font-bold">{id?.slice(0, 8).toUpperCase()}</span>
        </p>

        {/* Список товаров */}
        {order?.items && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 font-medium">{item.item_name}</span>
                  <span className="text-gray-400">×{item.quantity}</span>
                </div>
                <span className="text-gray-600 font-semibold">{item.price * item.quantity} ₸</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-800">Итого:</span>
              <span className="font-bold text-primary-600 text-lg">{order.total_price} ₸</span>
            </div>
          </div>
        )}

        {/* Kaspi QR */}
        {order?.status !== 'completed' && (
          <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-2xl p-6 text-center mb-6">
            <div className="bg-white rounded-2xl p-4 inline-block mb-4 shadow-md">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=kaspi-payment-placeholder"
                alt="Kaspi QR"
                className="w-40 h-40"
              />
            </div>
            <p className="text-gray-700 font-semibold text-sm mb-1">
              Оплатите <strong>{order?.total_price || '—'} ₸</strong> по QR коду
            </p>
            <p className="text-gray-500 text-xs">
              и покажите чек на кассе
            </p>
          </div>
        )}

        {/* Время ожидания / Статус */}
        <div className={`rounded-2xl p-4 text-center mb-6 flex items-center justify-center gap-3 ${
          order?.status === 'completed' ? 'bg-green-50' :
          order?.status === 'ready' ? 'bg-green-100' :
          'bg-primary-50'
        }`}>
          <span className="text-3xl">
            {order?.status === 'completed' ? '🎉' :
             order?.status === 'ready' ? '✅' :
             '⏳'}
          </span>
          <div>
            <p className={`font-bold ${
              order?.status === 'completed' || order?.status === 'ready' ? 'text-green-700' :
              'text-primary-700'
            }`}>
              {order?.status === 'pending' && 'Заказ оформлен, ожидайте'}
              {order?.status === 'ready' && 'Заказ готов! Подойдите на кассу'}
              {order?.status === 'completed' && 'Заказ выдан. Спасибо!'}
            </p>
            {(order?.status === 'pending' || !order?.status) && <p className="text-primary-600/70 text-xs">Мы сообщим, когда заказ будет готов</p>}
          </div>
        </div>

        {/* Demo Mode Notice */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 flex items-start gap-2">
          <span className="text-red-500 mt-0.5">⚠️</span>
          <p className="text-xs text-red-600">
            <strong>Демонстрационный режим:</strong> Это симуляция. Реальные деньги не списываются, и еда не готовится.
          </p>
        </div>

        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-primary-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-colors"
          >
            Вернуться в меню
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
