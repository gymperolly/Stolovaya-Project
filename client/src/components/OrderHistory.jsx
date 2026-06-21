import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

function OrderCard({ order, onRepeat }) {
  const statusMap = {
    pending: { text: 'Ожидает', color: '#F59E0B' },
    ready: { text: 'Готов', color: '#10B981' },
    completed: { text: 'Выдан', color: '#6B7280' }
  };
  const status = statusMap[order.status] || statusMap.pending;
  
  const formattedDate = new Date(order.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
        <span className="text-gray-500 text-sm font-medium">{formattedDate}</span>
        <span className="px-3 py-1 rounded-full text-sm font-bold bg-opacity-10" style={{ color: status.color, backgroundColor: `${status.color}15` }}>
          {status.text}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        {order.order_items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-800">{item.menu_items?.name}</span>
              <span className="text-gray-400">x{item.quantity}</span>
            </div>
            <span className="font-bold text-gray-700">{item.price * item.quantity} ₸</span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
        <strong className="text-lg text-gray-800">Итого: {order.total_price} ₸</strong>
        <button 
          onClick={() => onRepeat(order)}
          className="px-4 py-2 bg-primary-50 text-primary-600 font-bold rounded-xl hover:bg-primary-100 transition-colors"
        >
          Повторить заказ
        </button>
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, status, total_price, created_at,
            order_items (
              quantity, price, menu_item_id,
              menu_items ( id, name, image_url, is_available )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Order history error:', error);
          setOrders([]);
        } else {
          setOrders(data || []);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  const handleRepeatOrder = (order) => {
    let hasUnavailable = false;

    order.order_items.forEach(item => {
      if (item.menu_items?.is_available === false) {
        hasUnavailable = true;
      } else if (item.menu_items) {
        // Добавляем каждый товар в корзину нужное количество раз
        // или можно использовать один вызов если бы addItem принимал количество
        const menuItem = {
          id: item.menu_items.id,
          name: item.menu_items.name,
          price: item.price,
          image_url: item.menu_items.image_url
        };
        for (let i = 0; i < item.quantity; i++) {
          addItem(menuItem);
        }
      }
    });

    if (hasUnavailable) {
      alert("Некоторые блюда из этого заказа больше недоступны и не были добавлены в корзину.");
    }
    
    navigate('/');
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Загрузка истории...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🛒</div>
        <p className="text-gray-400 font-medium mb-4">У вас пока нет заказов</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-primary-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-600 transition-colors"
        >
          Перейти в меню
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} onRepeat={handleRepeatOrder} />
      ))}
    </div>
  );
}
