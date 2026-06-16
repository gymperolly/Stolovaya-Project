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
  const fetchingRef = useRef(false);

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

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    // Hard 3 second timeout — ALWAYS resolves
    const timer = setTimeout(() => {
      if (fetchingRef.current) {
        fetchingRef.current = false;
        setRole(roleCache.current[userId] || 'student');
        setRoleLoading(false);
      }
    }, 3000);

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      clearTimeout(timer);
      const userRole = data?.role || 'student';
      roleCache.current[userId] = userRole;
      setRole(userRole);
    } catch (err) {
      clearTimeout(timer);
      setRole('student');
    } finally {
      fetchingRef.current = false;
      setRoleLoading(false);
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
          // Берём из кэша — НЕ делаем новый запрос, НЕ сбрасываем роль
          const cachedRole = roleCache.current[session?.user?.id];
          if (cachedRole) {
            setRole(cachedRole);
          }
          // НЕ вызываем fetchRole здесь вообще
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
  const signOut = () => {
    // Выполняем асинхронный запрос в фоне, не дожидаясь его
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
