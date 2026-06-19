import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import MenuManager from './MenuManager';
import UserManager from './UserManager';

export default function AdminPanel() {
  const { getAccessToken, signOut, getUserName } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, menu, users
  
  // States for overview
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0, ready: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  // Recalculate stats whenever orders change
  useEffect(() => {
    setStats({
      total: orders.length,
      revenue: orders.reduce((s, x) => s + (x.total_price || 0), 0),
      pending: orders.filter(x => x.status === 'pending').length,
      ready: orders.filter(x => x.status === 'ready').length,
      completed: orders.filter(x => x.status === 'completed').length,
    });
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Ошибка:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    fetchOrders();

    // Realtime subscription
    const subscription = supabase
      .channel('admin-orders-changes')
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

  const statCards = [
    { label: 'Всего заказов', value: stats.total, icon: '📋', color: 'from-blue-400 to-blue-600' },
    { label: 'Выручка', value: `${stats.revenue} ₸`, icon: '💰', color: 'from-green-400 to-green-600' },
    { label: 'Ожидают', value: stats.pending, icon: '⏳', color: 'from-yellow-400 to-yellow-600' },
    { label: 'Выданы', value: stats.completed, icon: '✅', color: 'from-gray-400 to-gray-600' },
  ];

  const formatTime = (d) => new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-primary-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Администратор</h1>
              <p className="text-xs text-gray-400">{getUserName()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              🏠 На главную
            </Link>
            <Link to="/staff" className="text-sm text-green-600 hover:text-green-700 font-medium">
              👨‍🍳 Заказы (Staff)
            </Link>
            <button onClick={signOut} className="text-sm text-red-500 hover:text-red-600 font-medium">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {['overview', 'menu', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              {tab === 'overview' && '📊 Обзор заказов'}
              {tab === 'menu' && '🍔 Управление меню'}
              {tab === 'users' && '👥 Пользователи'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* Карточки статистики */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {statCards.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl shadow-md p-4">
                    <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                      <span className="text-lg">{s.icon}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Таблица заказов */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Все заказы за сегодня</h3>
                <button onClick={fetchOrders}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  🔄 Обновить
                </button>
              </div>

              {loading ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-gray-400 font-medium">Пока нет заказов за сегодня</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-4 py-3 text-gray-500 font-semibold">№</th>
                          <th className="px-4 py-3 text-gray-500 font-semibold">Клиент</th>
                          <th className="px-4 py-3 text-gray-500 font-semibold">Товары</th>
                          <th className="px-4 py-3 text-gray-500 font-semibold">Сумма</th>
                          <th className="px-4 py-3 text-gray-500 font-semibold">Статус</th>
                          <th className="px-4 py-3 text-gray-500 font-semibold">Время</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const badge = order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : order.status === 'ready'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500';
                          const label = order.status === 'pending' ? 'Ожидает'
                            : order.status === 'ready' ? 'Готов' : 'Выдан';
                          return (
                            <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-gray-600">
                                #{order.id?.slice(0, 6).toUpperCase()}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {order.user_name || order.user_email || '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {order.order_items?.map(i => `${i.item_name} ×${i.quantity}`).join(', ')}
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-800">
                                {order.total_price} ₸
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge}`}>
                                  {label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-400">{formatTime(order.created_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <MenuManager />
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <UserManager />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
