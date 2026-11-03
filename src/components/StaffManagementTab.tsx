import React, { useState } from 'react';
import { StaffUser, staffService } from '../services/staff.service';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  PhoneCall, 
  Key, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
  UserCheck,
  AlertCircle,
  Truck,
  MessageCircle,
  Sparkles
} from 'lucide-react';

interface StaffManagementTabProps {
  onSwitchUser?: (user: StaffUser) => void;
}

export const StaffManagementTab: React.FC<StaffManagementTabProps> = ({ onSwitchUser }) => {
  const [staffList, setStaffList] = useState<StaffUser[]>(() => staffService.getAll());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'sales_rep' | 'delivery_rep' | 'admin'>('sales_rep');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const refreshList = () => {
    setStaffList(staffService.getAll());
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setPassword('');
    setRole('sales_rep');
    setPhone('');
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: StaffUser) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setPassword(user.password);
    setRole(user.role);
    setPhone(user.phone || '');
    setNotes(user.notes || '');
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !username.trim() || !password.trim()) {
      alert('يرجى ملء الاسم الكامل، اسم المستخدم، وكلمة المرور');
      return;
    }

    // Check duplicate username if new
    if (!editingUser) {
      const exists = staffList.some(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (exists) {
        alert('اسم المستخدم هذا مسجل بالفعل لموظف آخر. يرجى اختيار اسم مستخدم مختلف.');
        return;
      }
    }

    staffService.save({
      id: editingUser?.id,
      fullName: fullName.trim(),
      username: username.trim(),
      password: password.trim(),
      role: role,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      isActive: editingUser ? editingUser.isActive : true,
    });

    refreshList();
    setShowAddModal(false);
    alert(editingUser ? 'تم تعديل بيانات الموظف بنجاح!' : 'تمت إضافة الموظف الجديد وتفعيل حسابه بنجاح!');
  };

  const handleToggleActive = (user: StaffUser) => {
    if (user.username === 'saja' || user.username === 'admin') {
      alert('لا يمكن تعطيل حساب المدير العام الرئيسي');
      return;
    }
    staffService.toggleActive(user.id);
    refreshList();
  };

  const handleDelete = (user: StaffUser) => {
    if (user.username === 'saja' || user.username === 'admin') {
      alert('لا يمكن حذف حساب المدير العام الرئيسي');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف حساب الموظف "${user.fullName}" نهائياً؟`)) {
      staffService.delete(user.id);
      refreshList();
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeCount = staffList.filter((u) => u.isActive).length;
  const salesCount = staffList.filter((u) => u.role === 'sales_rep').length;
  const deliveryCount = staffList.filter((u) => u.role === 'delivery_rep').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Add Button */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            <span>إدارة فريق العمل وحسابات الموظفين (Staff & Employees)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            يمكنك إنشاء وتفعيل حسابات لموظفي المبيعات ومسؤولي الشحن، لمتابعة الطلبات والفواتير والتواصل مع العملاء عبر واتساب والتأكيد على الأسعار.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-blue-900 hover:bg-blue-950 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-md shrink-0"
        >
          <UserPlus size={16} className="text-yellow-400" />
          <span>+ إضافة موظف جديد</span>
        </button>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-gray-500 block">إجمالي فريق العمل</span>
          <strong className="text-xl font-black text-blue-950 font-mono">{staffList.length}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 block">الحسابات النشطة</span>
          <strong className="text-xl font-black text-emerald-700 font-mono">{activeCount}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-blue-600 block">موظفي المبيعات والفواتير</span>
          <strong className="text-xl font-black text-blue-700 font-mono">{salesCount}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-purple-600 block">مسؤولي الشحن والتسليم</span>
          <strong className="text-xl font-black text-purple-700 font-mono">{deliveryCount}</strong>
        </div>
      </div>

      {/* Staff Users Cards Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-black text-gray-800">قائمة الموظفين والصلاحيات المعتمدة</span>
          <span className="text-[11px] text-gray-500">يمكن تفعيل أو تعطيل أي موظف فوراً بنقرة زر</span>
        </div>

        <div className="divide-y divide-gray-100">
          {staffList.map((user) => {
            const isPasswordVisible = visiblePasswords[user.id];

            return (
              <div 
                key={user.id} 
                className={`p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
                  !user.isActive ? 'bg-red-50/30 opacity-75' : 'hover:bg-blue-50/30'
                }`}
              >
                {/* User Info */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                    user.role === 'admin'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : user.role === 'sales_rep'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-purple-100 text-purple-900 border border-purple-300'
                  }`}>
                    {user.role === 'admin' ? (
                      <ShieldCheck size={22} />
                    ) : user.role === 'sales_rep' ? (
                      <MessageCircle size={22} />
                    ) : (
                      <Truck size={22} />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-gray-900">{user.fullName}</h4>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        user.role === 'admin'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : user.role === 'sales_rep'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}>
                        {user.role === 'admin' 
                          ? 'مدير عام (Admin)' 
                          : user.role === 'sales_rep' 
                          ? 'موظف مبيعات وفواتير' 
                          : 'مسؤول شحن وتوصيل'}
                      </span>

                      {user.isActive ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          <span>نشط</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle size={11} />
                          <span>معطل</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Key size={12} className="text-gray-400" />
                        <span className="text-gray-400 text-[11px]">اسم الدخول:</span>
                        <strong className="font-mono text-blue-900 font-bold">{user.username}</strong>
                      </div>

                      <div className="flex items-center gap-1">
                        <Lock size={12} className="text-gray-400" />
                        <span className="text-gray-400 text-[11px]">كلمة المرور:</span>
                        <strong className="font-mono text-gray-800 font-bold">
                          {isPasswordVisible ? user.password : '••••••'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="text-gray-400 hover:text-gray-700 p-0.5"
                          title={isPasswordVisible ? 'إخفاء' : 'عرض كلمة المرور'}
                        >
                          {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>

                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <PhoneCall size={12} className="text-gray-400" />
                          <span className="font-mono text-gray-700" dir="ltr">{user.phone}</span>
                        </div>
                      )}
                    </div>

                    {user.notes && (
                      <p className="text-[11px] text-gray-500 italic">{user.notes}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
                  {onSwitchUser && (
                    <button
                      onClick={() => onSwitchUser(user)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      title="تجربة الدخول بهذا الحساب فوراً"
                    >
                      <Sparkles size={12} className="text-amber-500" />
                      <span>تجربة واجهة هذا الحساب</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleActive(user)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      user.isActive
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {user.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                    title="تعديل البيانات أو كلمة المرور"
                  >
                    <Edit3 size={15} />
                  </button>

                  {user.username !== 'saja' && user.username !== 'admin' && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                      title="حذف الحساب"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <UserPlus className="text-blue-600" size={20} />
                <span>{editingUser ? 'تعديل حساب موظف' : 'إضافة موظف جديد لفريق طنطاوي جروب'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-gray-700 font-bold mb-1">اسم الموظف بالكامل:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: ك/ أحمد سمير"
                  className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">اسم المستخدم للدخول (Username):</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: ahmed_sales"
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">كلمة المرور (Password):</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="مثال: 123456"
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">الدور والصلاحية:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-bold bg-white"
                  >
                    <option value="sales_rep">موظف مبيعات وفواتير (الرد بالأسعار والواتساب)</option>
                    <option value="delivery_rep">مسؤول شحن وتوصيل (متابعة العناوين والمندوبين)</option>
                    <option value="admin">مدير نظام كامل (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">رقم تليفون الموظف:</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">ملاحظات أو القسم التابع له:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: مسؤول مبيعات الأجهزة المنزلية وشاشات سامسونج"
                  className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                📌 بمجرد الحفظ، يمكن للموظف فتح رابط <strong>/admin</strong> وإدخال اسم المستخدم وكلمة المرور لمتابعة فواتير وطلبات العملاء مباشرة والتواصل معهم هاتفياً وعبر واتساب!
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-black transition shadow-md"
                >
                  {editingUser ? 'حفظ التعديلات' : 'تفعيل وإضافة الموظف 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
