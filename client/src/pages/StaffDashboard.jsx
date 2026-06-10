import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const statusLabels = {
  pending: { text: 'Ожидает', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  ready: { text: 'Готов', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  completed: { text: 'Выдан', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
};

export default function StaffDashboard() {
  const { getAccessToken, signOut, getUserName } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const token = await getAccessToken();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${API_URL}/api/staff/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Ошибка:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    fetchOrders();

    // Realtime подписка на заказы
    const subscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        }
        if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o =>
            o.id === payload.new.id ? payload.new : o
          ));
        }
        if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);

    // Immediately update UI (optimistic)
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, status: newStatus }
        : order
    ));

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        // Revert on error
        console.error('Update failed:', error);
        setOrders(prev => prev.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus === 'ready' ? 'pending' : 'ready' }
            : order
        ));
      }
    } catch (err) {
      console.error('Update error:', err);
    }
    setUpdatingId(null);
  };

  const markAsReady = (orderId) => handleStatusUpdate(orderId, 'ready');
  const markAsCompleted = (orderId) => handleStatusUpdate(orderId, 'completed');

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">👨‍🍳</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Панель сотрудника</h1>
              <p className="text-xs text-gray-400">{getUserName()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              🏠 Меню
            </a>
            <button onClick={signOut}
              className="text-sm text-red-500 hover:text-red-600 font-medium">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Заказы на сегодня</h2>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Realtime активен
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-400 font-medium">Пока нет заказов</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {orders.map((order) => {
                const status = statusLabels[order.status] || statusLabels.pending;
                return (
                  <motion.div key={order.id} layout
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-md p-5 border-l-4"
                    style={{ borderLeftColor: order.status === 'pending' ? '#eab308' : order.status === 'ready' ? '#22c55e' : '#9ca3af' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-gray-600">
                          #{order.id?.slice(0, 6).toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${status.color}`}>
                          <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                          {status.text}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(order.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      👤 {order.user_name || order.user_email || 'Клиент'}
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1">
                      {order.order_items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.item_name} ×{item.quantity}</span>
                          <span className="text-gray-500">{item.price * item.quantity} ₸</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">{order.total_price} ₸</span>
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button onClick={() => markAsReady(order.id)}
                            disabled={updatingId === order.id}
                            className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50">
                            {updatingId === order.id ? '...' : '✅ Готово'}
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button onClick={() => markAsCompleted(order.id)}
                            disabled={updatingId === order.id}
                            className="bg-gray-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50">
                            {updatingId === order.id ? '...' : '📦 Выдан'}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
