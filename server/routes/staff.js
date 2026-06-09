import { Router } from 'express';
import { authMiddleware, roleMiddleware, supabase } from '../middleware/auth.js';

const router = Router();

// GET /api/staff/orders — заказы за сегодня (персонал + админ)
router.get('/orders', authMiddleware, roleMiddleware(['staff', 'admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ orders: data });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH /api/staff/orders/:id — обновить статус заказа
router.patch('/orders/:id', authMiddleware, roleMiddleware(['staff', 'admin']), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'ready', 'completed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Неверный статус' });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ order: data });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
