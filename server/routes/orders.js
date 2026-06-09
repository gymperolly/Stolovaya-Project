import { Router } from 'express';
import { authMiddleware, supabase } from '../middleware/auth.js';

const router = Router();

// POST /api/orders — создать новый заказ
router.post('/', authMiddleware, async (req, res) => {
  const { items, total_price, user_name } = req.body;
  const user = req.user;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Корзина пуста' });
  }

  try {
    // Создаём заказ
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user_name || user.user_metadata?.full_name || '',
        total_price,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Создаём позиции заказа
    const orderItems = items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
      item_name: item.item_name,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    res.status(201).json({ order });
  } catch (err) {
    console.error('Ошибка создания заказа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/orders/:id — получить заказ по ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    // Проверяем, что заказ принадлежит пользователю (или это сотрудник)
    if (order.user_id !== req.user.id) {
      const adminEmail = process.env.ADMIN_EMAIL || '';
      const staffEmails = process.env.STAFF_EMAILS || '';
      const allowed = [adminEmail, ...staffEmails.split(',')]
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
      if (!allowed.includes(req.user.email?.toLowerCase())) {
        return res.status(403).json({ error: 'Доступ запрещён' });
      }
    }

    res.json({ order: { ...order, items: order.order_items } });
  } catch (err) {
    console.error('Ошибка получения заказа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
