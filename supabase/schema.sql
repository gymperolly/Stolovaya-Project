-- =============================================
-- Столовая — College Canteen Database Schema
-- =============================================

-- Включаем каскадное удаление старых таблиц и типов, чтобы легко перезаписать схему
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TYPE IF EXISTS menu_category CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- 1. Создаём enum для категорий меню
CREATE TYPE menu_category AS ENUM ('soups', 'mains', 'sides', 'desserts', 'drinks');

-- 2. Создаём enum для статуса заказа
CREATE TYPE order_status AS ENUM ('pending', 'ready', 'completed');

-- =============================================
-- ТАБЛИЦА: menu_items (Позиции меню)
-- =============================================
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category menu_category NOT NULL,
  price INTEGER NOT NULL,  -- цена в тенге (KZT)
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ТАБЛИЦА: orders (Заказы)
-- =============================================
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  status order_status DEFAULT 'pending',
  total_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ТАБЛИЦА: order_items (Позиции заказа)
-- =============================================
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL,  -- цена за единицу на момент заказа
  item_name TEXT NOT NULL   -- название на момент заказа
);

-- =============================================
-- RLS (Row Level Security) Политики
-- =============================================

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Menu items are viewable by everyone"
  ON menu_items FOR SELECT USING (true);

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update orders"
  ON orders FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can view all orders"
  ON orders FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id)
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

-- =============================================
-- Политики для управления меню (Bug 5)
-- =============================================
CREATE POLICY "Admins can manage menu"
ON menu_items FOR ALL
USING ( public.is_admin() );

-- Note: Storage policies should be run directly in SQL editor because 
-- they affect storage.objects which may not be fully managed by this schema file alone:
-- CREATE POLICY "Admins can upload images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'menu-images' AND
--   EXISTS (
--     SELECT 1 FROM user_roles
--     WHERE user_id = auth.uid() AND role = 'admin'
--   )
-- );
-- 
-- CREATE POLICY "Public can view images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'menu-images');

-- =============================================
-- SEED DATA: 20 Реалистичных позиций меню
-- =============================================

-- 🍲 Супы (Soups)
INSERT INTO menu_items (name, category, price, image_url) VALUES
  ('Борщ со сметаной', 'soups', 700, 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=500&q=80&fit=crop'),
  ('Куриный бульон', 'soups', 500, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=80&fit=crop'),
  ('Солянка мясная', 'soups', 850, 'https://images.unsplash.com/photo-1548943487-a2e4b43b485f?w=500&q=80&fit=crop'),
  ('Чечевичный крем-суп', 'soups', 750, 'https://images.unsplash.com/photo-1613478881439-ce36142c1615?w=500&q=80&fit=crop');

-- 🍛 Горячее (Mains)
INSERT INTO menu_items (name, category, price, image_url) VALUES
  ('Плов из говядины', 'mains', 1100, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&q=80&fit=crop'),
  ('Котлета по-киевски', 'mains', 950, 'https://images.unsplash.com/photo-1628268909376-e8c44bb3153f?w=500&q=80&fit=crop'),
  ('Гуляш мясной', 'mains', 900, 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=500&q=80&fit=crop'),
  ('Манты с мясом (5 шт)', 'mains', 1200, 'https://images.unsplash.com/photo-1563514757348-70135d909be0?w=500&q=80&fit=crop'),
  ('Лагман жареный (Цомян)', 'mains', 1050, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80&fit=crop');

-- 🥗 Гарниры (Sides)
INSERT INTO menu_items (name, category, price, image_url) VALUES
  ('Картофельное пюре', 'sides', 350, 'https://images.unsplash.com/photo-1619894611598-c116c47deba5?w=500&q=80&fit=crop'),
  ('Рис отварной', 'sides', 300, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=80&fit=crop'),
  ('Гречка с маслом', 'sides', 350, 'https://images.unsplash.com/photo-1632558699042-30cb1914eb4c?w=500&q=80&fit=crop'),
  ('Салат витаминный', 'sides', 400, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80&fit=crop');

-- 🧁 Десерты и Выпечка (Desserts)
INSERT INTO menu_items (name, category, price, image_url) VALUES
  ('Сосиска в тесте', 'desserts', 350, 'https://images.unsplash.com/photo-1619740455993-9d701c0ae3fa?w=500&q=80&fit=crop'),
  ('Самса с говядиной', 'desserts', 450, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&q=80&fit=crop'),
  ('Блинчики с творогом', 'desserts', 600, 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&q=80&fit=crop'),
  ('Медовик (кусочек)', 'desserts', 750, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&q=80&fit=crop');

-- 🥤 Напитки (Drinks)
INSERT INTO menu_items (name, category, price, image_url) VALUES
  ('Компот из сухофруктов', 'drinks', 200, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80&fit=crop'),
  ('Кофе Американо', 'drinks', 450, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80&fit=crop'),
  ('Чай черный с лимоном', 'drinks', 150, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80&fit=crop'),
  ('Вода негазированная 0.5л', 'drinks', 150, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500&q=80&fit=crop');
-- Создаём таблицу ролей
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('student', 'staff', 'admin')) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Разрешаем читать свою роль
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Only admins can update roles"
  ON user_roles FOR ALL
  USING ( public.is_admin() );

-- =============================================
-- Триггеры и функции
-- =============================================

-- Функция: при первом входе через Google автоматически назначает роль student
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для вызова функции после создания пользователя
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();