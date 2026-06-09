import { Router } from 'express';
import { supabase } from '../middleware/auth.js';

const router = Router();

// GET /api/menu — получить все доступные позиции меню
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ items: data });
  } catch (err) {
    console.error('Ошибка получения меню:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
