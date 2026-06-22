import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function UserManager() {
  const { getAccessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data: users, error } = await supabase
        .rpc('get_all_users_with_roles')

      if (error) {
        console.error('get_all_users_with_roles error:', error)
        return
      }

      setUsers(users.map(u => ({
        id: u.user_id,
        email: u.email,
        name: u.full_name || u.email,
        role: u.role
      })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Изменить роль на ${newRole}?`)) return
    setUpdatingId(userId)
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)
      
      if (error) throw error
      
      // Обновляем локальный стейт
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))
    } catch (err) {
      console.error('Role update error:', err)
      alert('Ошибка при изменении роли: ' + err.message)
    } finally {
      setUpdatingId(null)
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Admin</span>;
      case 'staff': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Staff</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Student</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Список пользователей</h3>
        <button onClick={fetchUsers} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
          🔄 Обновить
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center text-gray-400">Пользователи не найдены</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="px-6 py-4 font-semibold">Пользователь</th>
                <th className="px-6 py-4 font-semibold text-right">Роль</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800 text-base">{user.name || '—'}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{user.email || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {getRoleBadge(user.role)}
                      <select
                        disabled={updatingId === user.id}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
