import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  Edit3, 
  LogOut, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  Users, 
  ChevronLeft,
  Save,
  Building2
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { 
    user, 
    orders, 
    logout, 
    updateUserProfile, 
    setIsAboutModalOpen, 
    setIsAuthModalOpen,
    isLoggedIn 
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    city: user.city
  });
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'profile' | 'addresses'>('orders');

  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 text-center max-w-md mx-auto space-y-4 my-8">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <User size={36} />
        </div>
        <h3 className="text-xl font-black text-gray-900">سجل الدخول لحسابك</h3>
        <p className="text-xs text-gray-500">
          سجل دخولك لمتابعة شحناتك، وطلباتك السابقة، وإدارة عناوينك في رنين.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition text-sm"
        >
          تسجيل الدخول / إنشاء حساب
        </button>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(formData);
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Dispatched':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            <Clock size={12} />
            <span>قيد الشحن والتوصيل</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
            <CheckCircle size={12} />
            <span>تم التسليم بنجاح</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
            <XCircle size={12} />
            <span>تم الإلغاء</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
            <Clock size={12} />
            <span>قيد المراجعة</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-right">
          <div className="w-16 h-16 rounded-full border-2 border-white/80 overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
            <img
              src={user.avatar || '/assets/avatar2.png'}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h2 className="text-xl font-black">{user.name}</h2>
            <p className="text-xs text-blue-200 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
              <Mail size={12} />
              <span>{user.email}</span>
            </p>
            <p className="text-xs text-blue-200 flex items-center justify-center sm:justify-start gap-1">
              <Phone size={12} />
              <span>{user.phone}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAboutModalOpen(true)}
            className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-white/20"
          >
            <Building2 size={14} />
            <span>عن طنطاوي جروب</span>
          </button>
          <button
            onClick={logout}
            className="bg-black/30 hover:bg-black/50 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <LogOut size={14} />
            <span>تسجيل خروج</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`py-3 px-4 font-bold text-xs md:text-sm border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'orders'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Package size={16} />
          <span>طلباتي السابقة ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`py-3 px-4 font-bold text-xs md:text-sm border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'profile'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <User size={16} />
          <span>بيانات الحساب</span>
        </button>

        <button
          onClick={() => setActiveSubTab('addresses')}
          className={`py-3 px-4 font-bold text-xs md:text-sm border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'addresses'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <MapPin size={16} />
          <span>عناوين التوصيل</span>
        </button>
      </div>

      {/* Orders Tab Content */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.orderid}
              className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-xs transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-50 rounded-xl p-2 shrink-0 flex items-center justify-center">
                  <img
                    src={order.productimage}
                    alt={order.nameAr}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-gray-500">{order.orderid}</span>
                    <span className="text-[11px] text-gray-400">• {order.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{order.nameAr}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{order.descriptionAr}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-end w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                {getStatusBadge(order.status)}
                <span className="text-sm md:text-base font-black text-red-600 mt-2 block font-mono">
                  {order.price.toLocaleString()} ج.م
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Details Tab Content */}
      {activeSubTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">المعلومات الشخصية</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-red-600 font-bold flex items-center gap-1 hover:underline"
            >
              <Edit3 size={14} />
              <span>{isEditing ? 'إلغاء التعديل' : 'تعديل البيانات'}</span>
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">الاسم بالكامل:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 font-medium"
                />
              </div>
              <button
                type="submit"
                className="bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-red-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <Save size={14} />
                <span>حفظ التعديلات</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3 text-xs divide-y divide-gray-100">
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">الاسم:</span>
                <span className="font-bold text-gray-800">{user.name}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">البريد الإلكتروني:</span>
                <span className="font-bold text-gray-800">{user.email}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">رقم الموبايل:</span>
                <span className="font-bold text-gray-800">{user.phone}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">المدينة والمحافظة:</span>
                <span className="font-bold text-gray-800">{user.city}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delivery Addresses Tab Content */}
      {activeSubTab === 'addresses' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">العناوين المحفوظة</h3>
            <span className="text-xs bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded">
              العنوان الافتراضي
            </span>
          </div>

          <div className="border border-red-200 bg-red-50/30 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <MapPin size={16} className="text-red-600" />
              <span>المنزل - {user.city}</span>
            </div>
            <p className="text-gray-600 mr-6">{user.address}</p>
            <p className="text-gray-500 mr-6">رقم المستلم: {user.phone}</p>
          </div>
        </div>
      )}
    </div>
  );
};
