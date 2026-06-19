import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function MenuManager() {
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', category: 'hot', price: '', image_url: '', is_available: true });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchMenu = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleEdit = (item) => {
    setFormData(item);
    setIsEditing(true);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить это блюдо?')) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMenu();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return formData.image_url;
    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, imageFile, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(uploadData.path);
        
      return publicUrl;
    } catch (err) {
      console.error('Ошибка загрузки изображения:', err);
      alert('Ошибка загрузки изображения: ' + err.message);
      return formData.image_url;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    
    let finalImageUrl = formData.image_url;
    if (imageFile) {
      finalImageUrl = await handleImageUpload();
    }

    const payload = { ...formData, price: Number(formData.price), image_url: finalImageUrl };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: payload.name,
            price: payload.price,
            category: payload.category,
            image_url: payload.image_url,
            is_available: payload.is_available
          })
          .eq('id', payload.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert({
            name: payload.name,
            price: payload.price,
            category: payload.category,
            image_url: payload.image_url,
            is_available: payload.is_available
          });

        if (error) throw error;
      }

      setIsEditing(false);
      setFormData({ id: null, name: '', category: 'hot', price: '', image_url: '', is_available: true });
      setImageFile(null);
      fetchMenu();
    } catch (err) {
      console.error('Ошибка сохранения:', err.message);
      alert('Ошибка при сохранении: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Форма добавления/редактирования */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {isEditing ? 'Редактировать блюдо' : 'Добавить новое блюдо'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Название</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Категория</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all">
                <option value="bakery">Выпечка</option>
                <option value="drinks">Напитки</option>
                <option value="hot">Горячее</option>
                <option value="soups">Супы</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Цена (₸)</label>
              <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Изображение (Загрузка файла)</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="is_available" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})}
                className="w-4 h-4 text-purple-600 rounded" />
              <label htmlFor="is_available" className="text-sm text-gray-700 font-medium">Доступно для заказа</label>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={uploading}
              className="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50">
              {uploading ? 'Загрузка...' : isEditing ? '💾 Сохранить' : '➕ Добавить'}
            </button>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setFormData({ id: null, name: '', category: 'hot', price: '', image_url: '', is_available: true }); }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-colors">
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Список блюд */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-gray-500 font-semibold w-16">Фото</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold">Название</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold">Категория</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold">Цена</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold">Статус</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <img src={item.image_url || 'https://via.placeholder.com/150?text=No+Image'} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-2 text-gray-500">{item.category}</td>
                    <td className="px-4 py-2 font-semibold text-gray-800">{item.price} ₸</td>
                    <td className="px-4 py-2">
                      {item.is_available ? 
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Доступно</span> : 
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Скрыто</span>
                      }
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button onClick={() => handleEdit(item)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">Изменить</button>
                      <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
