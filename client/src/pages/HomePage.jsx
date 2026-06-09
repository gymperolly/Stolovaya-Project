import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import MenuCard from '../components/MenuCard';
import CategoryTabs from '../components/CategoryTabs';
import Cart from '../components/Cart';

const MOCK_ITEMS = [
  { id: '1', name: 'Борщ со сметаной', category: 'soups', price: 700, image_url: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=500&q=80&fit=crop', is_available: true },
  { id: '2', name: 'Плов из говядины', category: 'hot', price: 1100, image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&q=80&fit=crop', is_available: true },
  { id: '3', name: 'Картофельное пюре', category: 'hot', price: 350, image_url: 'https://images.unsplash.com/photo-1619894611598-c116c47deba5?w=500&q=80&fit=crop', is_available: true },
  { id: '4', name: 'Сосиска в тесте', category: 'bakery', price: 350, image_url: 'https://images.unsplash.com/photo-1619740455993-9d701c0ae3fa?w=500&q=80&fit=crop', is_available: true },
  { id: '5', name: 'Компот из сухофруктов', category: 'drinks', price: 200, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80&fit=crop', is_available: true },
];

export default function HomePage() {
  const { user, role, getUserName, getUserAvatar, signOut, getAccessToken } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('hot');
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);

  // Проверка активного заказа при загрузке (Bug 1 Fix)
  useEffect(() => {
    const fetchActiveOrder = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (!error && data) {
        setActiveOrderId(data.id);
        localStorage.setItem('activeOrderId', data.id);
      } else {
        setActiveOrderId(null);
        localStorage.removeItem('activeOrderId');
      }
    };
    fetchActiveOrder();
  }, [user]);

  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('menu_items').select('*').eq('is_available', true)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Ошибка загрузки меню:', error);
        setMenuItems(MOCK_ITEMS);
      } else {
        setMenuItems(data && data.length > 0 ? data : MOCK_ITEMS);
      }
      setIsLoading(false);
    };
    fetchMenu();
  }, []);

  // Проверка статуса активного заказа
  useEffect(() => {
    if (!activeOrderId) return;
    const checkOrderStatus = async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/orders/${activeOrderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.order.status === 'completed') {
            localStorage.removeItem('activeOrderId');
            setActiveOrderId(null);
          }
        }
      } catch (err) {
        console.error('Ошибка проверки статуса заказа:', err);
      }
    };
    checkOrderStatus();
    const interval = setInterval(checkOrderStatus, 10000);
    return () => clearInterval(interval);
  }, [activeOrderId, getAccessToken]);

  const handleCategoryChange = useCallback((id) => {
    setActiveCategory(id);
  }, []);

  const filteredItems = menuItems.filter(i => i.category === activeCategory);
  const userName = getUserName();
  const userAvatar = getUserAvatar();

  return (
    <div className="min-h-screen bg-primary-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">🍽️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">Столовая</h1>
              <p className="text-xs text-gray-400">Заказ онлайн</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Навигация для Staff / Admin */}
            {role === 'staff' && (
              <Link to="/staff" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors">
                👨‍🍳 Панель сотрудника
              </Link>
            )}
            {role === 'admin' && (
              <Link to="/admin" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-100 transition-colors">
                ⚙️ Админ-панель
              </Link>
            )}

            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-2xl px-3 py-2 transition-colors">
                {userAvatar ? (
                  <img src={userAvatar} alt="avatar" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="font-medium text-gray-800 text-sm truncate">{userName}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{role}</p>
                    </div>
                    {role === 'staff' && (
                      <Link to="/staff" className="block sm:hidden w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-xl transition-colors mb-1">
                        👨‍🍳 Панель сотрудника
                      </Link>
                    )}
                    {role === 'admin' && (
                      <Link to="/admin" className="block sm:hidden w-full text-left px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded-xl transition-colors mb-1">
                        ⚙️ Админ-панель
                      </Link>
                    )}
                    <button onClick={signOut}
                      className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      🚪 Выйти
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
            Привет, {userName.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-500 mt-1 text-sm">Что сегодня закажем?</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} className="mb-6">
          <CategoryTabs activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded-lg w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => <MenuCard key={item.id} item={item} />)}
            </AnimatePresence>
          </motion.div>
        )}

        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😔</div>
            <p className="text-gray-400 font-medium">В этой категории пока нет блюд</p>
          </div>
        )}
      </main>

      {/* Floating Track Order Button */}
      <AnimatePresence>
        {activeOrderId && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: -20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: -20 }}
            className="fixed bottom-6 left-6 z-40"
          >
            <Link to={`/order/${activeOrderId}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white border-2 border-primary-500 text-primary-600 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold transition-colors hover:bg-primary-50"
              >
                <span className="animate-bounce">📍</span>
                Отследить заказ
              </motion.button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <Cart />
    </div>
  );
}
