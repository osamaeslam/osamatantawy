import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('customer@raneen.com');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('عميل رنين');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, mode === 'signup' ? name : undefined);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 left-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-14 mx-auto w-auto flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Tantawy Group Logo" 
              className="h-full object-contain"
            />
          </div>
          <h3 className="text-lg font-black text-gray-900 pt-1">
            {mode === 'login' ? 'مرحباً بك في طنطاوي جروب' : 'حساب جديد في طنطاوي جروب'}
          </h3>
          <p className="text-xs text-gray-500">
            {mode === 'login' ? 'سجل دخولك لمتابعة مشترياتك وعروضك الخاصة' : 'سجل الآن واستمتع بخصومات حصرية على طلباتك'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'login' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'signup' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            حساب جديد
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-gray-700 font-bold mb-1">الاسم بالكامل:</label>
              <div className="relative flex items-center">
                <div className="pr-3 pl-2 text-gray-400 absolute right-0">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 font-medium"
                  placeholder="محمد أحمد"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-1">البريد الإلكتروني:</label>
            <div className="relative flex items-center">
              <div className="pr-3 pl-2 text-gray-400 absolute right-0">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 font-medium"
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">كلمة المرور:</label>
            <div className="relative flex items-center">
              <div className="pr-3 pl-2 text-gray-400 absolute right-0">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3 rounded-xl transition text-xs shadow-md mt-2 flex items-center justify-center gap-1.5"
          >
            <span>{mode === 'login' ? 'دخول فوري' : 'إتمام التسجيل'}</span>
            <ArrowRight size={14} className="rotate-180" />
          </button>
        </form>

        <div className="text-center">
          <span className="text-[11px] text-gray-400">
            بيانات تجريبية مسجلة مسبقاً، يمكنك الضغط مباشرة على الزر للدخول
          </span>
        </div>
      </div>
    </div>
  );
};
