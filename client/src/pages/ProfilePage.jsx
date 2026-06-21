import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrderHistory from '../components/OrderHistory';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, role, getUserName, getUserAvatar, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-800">Личный кабинет</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Вкладки */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'profile' 
                ? 'bg-primary-500 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Профиль
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'history' 
                ? 'bg-primary-500 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            История заказов
          </button>
        </div>

        {/* Контент вкладок */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col items-center mb-8">
                {getUserAvatar() ? (
                  <img src={getUserAvatar()} alt="avatar" className="w-24 h-24 rounded-full mb-4 shadow-md" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-4xl mb-4 shadow-sm">
                    {getUserName().charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-800">{getUserName()}</h2>
                <p className="text-gray-400 capitalize">{role}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Email</span>
                  <p className="font-medium text-gray-800">{user?.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Роль</span>
                  <p className="font-medium text-gray-800 capitalize">{role}</p>
                </div>
              </div>

              <button 
                onClick={handleSignOut}
                className="w-full py-4 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-100 transition-colors flex justify-center items-center gap-2"
              >
                <span>🚪</span> Выйти из аккаунта
              </button>
            </div>
          )}

          {activeTab === 'history' && (
            <OrderHistory />
          )}
        </motion.div>
      </main>
    </div>
  );
}
