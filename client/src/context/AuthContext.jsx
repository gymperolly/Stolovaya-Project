import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId) => {
    if (!userId) {
      setRole('student');
      setRoleLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_my_role');

      if (error) throw error;
      setRole(data || 'student');
    } catch (err) {
      console.error('fetchRole error:', err);
      setRole('student');
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Получаем текущую сессию при загрузке
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      fetchRole(session?.user?.id ?? null).then(() => {
        if (mounted) setLoading(false);
      });
    });

    // Слушаем только нужные события
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log('Auth event:', event);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole('student');
          setRoleLoading(false);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null);
          setRoleLoading(true);
          fetchRole(session?.user?.id ?? null);
          return;
        }

        // TOKEN_REFRESHED и INITIAL_SESSION — 
        // НЕ трогаем роль, только обновляем user объект
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setUser(session?.user ?? null);
          return;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Вход через Google OAuth
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { prompt: 'select_account' },
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Ошибка входа:', error.message);
  };

  // Выход из аккаунта
  const signOut = () => {
    supabase.auth.signOut().catch(error => {
      console.error('Ошибка выхода:', error.message);
    });
    
    // Принудительно очищаем состояние МОМЕНТАЛЬНО
    setUser(null);
    setRole('student');
    localStorage.clear();
    window.location.href = '/login';
  };

  // Получаем имя пользователя из метаданных Google
  const getUserName = () => {
    if (!user) return '';
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Пользователь'
    );
  };

  // Получаем аватар пользователя
  const getUserAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  };

  // Получаем токен для API запросов
  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const value = {
    user,
    role,
    loading,
    roleLoading,
    signInWithGoogle,
    signOut,
    getUserName,
    getUserAvatar,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
