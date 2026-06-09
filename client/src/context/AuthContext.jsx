import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const roleCache = useRef({});
  const fetchPromiseRef = useRef(null);

  const fetchRole = async (userId) => {
    if (!userId) {
      setRole('student');
      setRoleLoading(false);
      return;
    }

    if (roleCache.current[userId]) {
      setRole(roleCache.current[userId]);
      setRoleLoading(false);
      return;
    }

    if (fetchPromiseRef.current) {
      await fetchPromiseRef.current;
      return;
    }

    const promise = (async () => {
      try {
        // Добавляем таймаут-предохранитель на 5 секунд на случай зависания БД (RLS рекурсии)
        const result = await Promise.race([
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);

        if (result.error) throw result.error;

        const userRole = result.data?.role || 'student';
        roleCache.current[userId] = userRole;
        setRole(userRole);
      } catch (err) {
        console.error('fetchRole error:', err);
        if (!role) setRole('student');
      } finally {
        setRoleLoading(false);
      }
    })();

    fetchPromiseRef.current = promise;
    try {
      await promise;
    } finally {
      fetchPromiseRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(session?.user ?? null);
        await fetchRole(session?.user?.id ?? null);
        if (mounted) setLoading(false);
      } catch {
        if (mounted) {
          setRole('student');
          setRoleLoading(false);
          setLoading(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('Auth event:', event);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole('student');
          roleCache.current = {};
          setRoleLoading(false);
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
          if (session?.user?.id && roleCache.current[session.user.id]) {
            setRole(roleCache.current[session.user.id]);
          }
          return;
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
          if (session?.user?.id && !roleCache.current[session.user.id]) {
            setRoleLoading(true);
          }
          await fetchRole(session?.user?.id ?? null);
          setLoading(false);
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
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Ошибка входа:', error.message);
  };

  // Выход из аккаунта
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Ошибка выхода:', error.message);
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
