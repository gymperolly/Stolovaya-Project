import { Router } from 'express';
import { authMiddleware, roleMiddleware, supabase } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/orders — все заказы за сегодня (только админ)
router.get('/orders', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
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

// =============================================
// УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
// =============================================

// GET /api/admin/users — получить всех пользователей с их ролями
router.get('/users', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Получаем auth пользователей через admin api
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // Получаем роли пользователей
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    if (rolesError) throw rolesError;

    // Объединяем данные
    const usersWithRoles = users.map(u => {
      const roleRecord = roles.find(r => r.user_id === u.id);
      return {
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || u.user_metadata?.name || '',
        role: roleRecord ? roleRecord.role : 'student',
        created_at: u.created_at
      };
    });

    res.json({ users: usersWithRoles });
  } catch (err) {
    console.error('Ошибка получения пользователей:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/admin/users/:id/role — изменить роль пользователя
router.put('/users/:id/role', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { role } = req.body;
  if (!['student', 'staff', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Неверная роль' });
  }

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ userRole: data });
  } catch (err) {
    console.error('Ошибка изменения роли:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// =============================================
// УПРАВЛЕНИЕ МЕНЮ
// =============================================

// POST /api/admin/menu — добавить блюдо
router.post('/menu', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { name, category, price, image_url, is_available } = req.body;

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([{ name, category, price, image_url, is_available: is_available ?? true }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ item: data });
  } catch (err) {
    console.error('Ошибка добавления блюда:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/admin/menu/:id — изменить блюдо
router.put('/menu/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ item: data });
  } catch (err) {
    console.error('Ошибка обновления блюда:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/admin/menu/:id — удалить блюдо
router.delete('/menu/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления блюда:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
