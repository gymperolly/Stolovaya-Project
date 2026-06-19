import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function UserManager() {
  const { getAccessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get users from orders to get their names and emails
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, user_email, user_name');

      if (ordersError) throw ordersError;

      const usersMap = new Map();
      if (roles) {
        roles.forEach(r => {
          usersMap.set(r.user_id, { 
            id: r.user_id, 
            email: 'Без email', 
            name: 'Пользователь', 
            role: r.role 
          });
        });
      }

      if (orders) {
        orders.forEach(o => {
          if (usersMap.has(o.user_id)) {
            const user = usersMap.get(o.user_id);
            if (o.user_email) user.email = o.user_email;
            if (o.user_name) user.name = o.user_name;
          }
        });
      }

      setUsers(Array.from(usersMap.values()));
    } catch (err) {
      console.error('Ошибка получения пользователей:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Вы уверены, что хотите изменить роль на ${newRole}?`)) return;
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Ошибка при изменении роли: ' + err.message);
    }
    setUpdatingId(null);
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
                <th className="px-6 py-4 font-semibold">Имя</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Текущая роль</th>
                <th className="px-6 py-4 font-semibold text-right">Изменить роль</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{user.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-right">
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
