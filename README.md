# 🍽️ Столовая — College Canteen Ordering App

Приложение для онлайн-заказа еды в студенческой столовой.

## Технологии

- **Frontend:** React + Vite + TailwindCSS + Framer Motion
- **Backend:** Node.js + Express
- **Database & Auth:** Supabase (PostgreSQL + Google OAuth)

## Структура проекта

```
├── client/          # React фронтенд
├── server/          # Express бэкенд
└── supabase/        # SQL схема базы данных
```

## Быстрый старт

### 1. Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Перейдите в **SQL Editor** и выполните `supabase/schema.sql`
3. Настройте **Google OAuth**:
   - В Supabase: Authentication → Providers → Google → Включить
   - В Google Cloud Console: создайте OAuth 2.0 Client ID
   - Redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### 2. Переменные окружения

Скопируйте `.env.example` → `.env` в папках `client/` и `server/`:

```bash
# client/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_EMAIL=your-admin@email.com
VITE_STAFF_EMAILS=staff1@email.com,staff2@email.com
```

```bash
# server/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ADMIN_EMAIL=your-admin@email.com
STAFF_EMAILS=staff1@email.com,staff2@email.com
PORT=3001
```

### 3. Запуск

```bash
# Фронтенд
cd client
npm install
npm run dev

# Бэкенд (в отдельном терминале)
cd server
npm install
npm run dev
```

Откройте `http://localhost:5173`

## Маршруты

| Маршрут | Роль | Описание |
|---------|------|----------|
| `/` | Пользователь | Меню и заказ еды |
| `/login` | Все | Вход через Google |
| `/order/:id` | Пользователь | Подтверждение заказа + QR |
| `/staff` | Персонал | Управление заказами |
| `/admin` | Админ | Статистика и обзор |

## Меню

### 🥐 Выпечка
| Блюдо | Цена |
|-------|------|
| Сосиска в тесте | 350 ₸ |
| Бургер | 800 ₸ |
| Хот-дог | 500 ₸ |
| Самса куриная | 400 ₸ |
| Самса говяжья | 450 ₸ |

### 🥤 Напитки
| Блюдо | Цена |
|-------|------|
| Яблочный сок | 300 ₸ |
| Апельсиновый сок | 300 ₸ |
| Живой Йогурт | 350 ₸ |
| Вода | 150 ₸ |
| Кофе 3 в 1 | 200 ₸ |

### 🍲 Горячее
| Блюдо | Цена |
|-------|------|
| Борщ со сметаной | 700 ₸ |
| Рис с курицей | 800 ₸ |
| Плов | 750 ₸ |
| Лагман | 850 ₸ |
| Гуляш с пюре | 900 ₸ |
