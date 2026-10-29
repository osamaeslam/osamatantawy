import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || 'customer@tantawy.com', mode === 'signup' ? name : undefined);
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
            {mode === 'login' ? 'تسجيل الدخول - طنطاوي جروب' : 'إنشاء حساب عميل جديد'}
          </h3>
          <p className="text-xs text-gray-500">
            {mode === 'login' ? 'سجل دخولك لمتابعة طلبات المعاينة السابقة وحفظ بياناتك' : 'سجل لتسهيل طلب المعاينات القادمة ومتابعة الشحنات'}
          </p>
        </div>

        {/* Guest reassurance banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center text-[11px] text-blue-900 font-medium">
          💡 يمكنك التسوق وطلب المعاينة مجاناً والدفع عند الاستلام كزائر مباشرة دون الحاجة لأي تسجيل!
        </div>

        {/* Tab switch */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'login' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'signup' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
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
                  className="w-full pr-9 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-700 font-medium"
                  placeholder="مثال: محمد أحمد"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-1">البريد الإلكتروني أو رقم الهاتف:</label>
            <div className="relative flex items-center">
              <div className="pr-3 pl-2 text-gray-400 absolute right-0">
                <Mail size={16} />
              </div>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-700 font-medium"
                placeholder="name@example.com أو رقم الموبايل"
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
                className="w-full pr-9 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-700 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-950 active:scale-95 text-white font-bold py-3 rounded-xl transition text-xs shadow-md mt-2 flex items-center justify-center gap-1.5"
          >
            <span>{mode === 'login' ? 'دخول' : 'إتمام إنشاء الحساب'}</span>
            <ArrowRight size={14} className="rotate-180" />
          </button>
        </form>

        <div className="text-center pt-1">
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-xs text-gray-500 hover:text-blue-900 font-medium underline"
          >
            متابعة التسوق كزائر الآن
          </button>
        </div>
      </div>
    </div>
  );
};
