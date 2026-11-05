import React, { useEffect, useState } from 'react';
import { staffService } from '../services/staff.service';
import type { StaffUser, StaffRole } from '../services/staff.service';
import {
  Users,
  UserPlus,
  ShieldCheck,
  PhoneCall,
  Mail,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  UserCheck,
  AlertCircle,
  Truck,
  Link2,
  RefreshCw,
  Loader2,
  KeyRound,
} from 'lucide-react';

interface StaffManagementTabProps {
  /** الحساب الحالي — لمنع الموظف من حذف/تعطيل نفسه */
  currentStaff?: StaffUser | null;
}

const roleLabel = (role: StaffRole): string => {
  if (role === 'admin') return '👑 المدير العام';
  if (role === 'sales_rep') return '📱 موظف مبيعات وفواتير';
  return '🚚 مسؤول شحن وتوصيل';
};

const roleBadgeClass = (role: StaffRole): string => {
  if (role === 'admin') return 'bg-amber-100 text-amber-900 border-amber-300';
  if (role === 'sales_rep') return 'bg-blue-100 text-blue-900 border-blue-300';
  return 'bg-purple-100 text-purple-900 border-purple-300';
};

export const StaffManagementTab: React.FC<StaffManagementTabProps> = ({ currentStaff }) => {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('sales_rep');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await staffService.getAll();
      setStaffList(list);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل قائمة الموظفين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFullName('');
    setEmail('');
    setRole('sales_rep');
    setPhone('');
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (user: StaffUser) => {
    setEditing(user);
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setPhone(user.phone || '');
    setNotes(user.notes || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      alert('يرجى كتابة الاسم بالكامل والبريد الإلكتروني.');
      return;
    }

    setSaving(true);
    try {
      await staffService.save({
        id: editing?.id,
        email,
        fullName,
        role,
        phone,
        notes,
        isActive: editing ? editing.isActive : true,
      });
      setShowModal(false);
      await load();
      alert(
        editing
          ? 'تم تعديل بيانات الموظف بنجاح.'
          : 'تمت إضافة الموظف. اطلب منه فتح /admin وإنشاء حساب بنفس البريد الإلكتروني ليتفعّل دوره تلقائياً.'
      );
    } catch (err: any) {
      alert(err.message || 'تعذر حفظ بيانات الموظف');
    } finally {
      setSaving(false);
    }
  };

  const isSelf = (user: StaffUser) => Boolean(currentStaff && currentStaff.id === user.id);

  const handleToggleActive = async (user: StaffUser) => {
    if (isSelf(user)) {
      alert('لا يمكنك تعطيل حسابك أنت.');
      return;
    }
    setBusyId(user.id);
    try {
      await staffService.setActive(user.id, !user.isActive);
      await load();
    } catch (err: any) {
      alert(err.message || 'تعذر تحديث حالة الحساب');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user: StaffUser) => {
    if (isSelf(user)) {
      alert('لا يمكنك حذف حسابك أنت.');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف حساب الموظف "${user.fullName || user.email}" نهائياً؟`)) return;

    setBusyId(user.id);
    try {
      await staffService.remove(user.id);
      await load();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف الحساب');
    } finally {
      setBusyId(null);
    }
  };

  const handleLinkAccount = async (user: StaffUser) => {
    setBusyId(user.id);
    try {
      await staffService.linkAccount(user.id);
      await load();
      alert('تم ربط الحساب بنجاح — الموظف يقدر يسجّل الدخول الآن.');
    } catch (err: any) {
      alert(err.message || 'تعذر ربط الحساب');
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = staffList.filter((u) => u.isActive).length;
  const salesCount = staffList.filter((u) => u.role === 'sales_rep').length;
  const deliveryCount = staffList.filter((u) => u.role === 'delivery_rep').length;
  const unlinkedCount = staffList.filter((u) => !u.userId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            <span>إدارة فريق العمل وحسابات الموظفين</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            الحسابات محفوظة في قاعدة البيانات ومربوطة بـ Supabase Auth — كل موظف بيدخل ببريده الإلكتروني
            وكلمة مروره الخاصة، والصلاحية بتتحدد من الجدول ده.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={load}
            disabled={loading}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition disabled:opacity-50"
            title="تحديث القائمة"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openAdd}
            className="bg-blue-900 hover:bg-blue-950 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-md"
          >
            <UserPlus size={16} className="text-yellow-400" />
            <span>+ إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-4 rounded-xl flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
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
          <span className="text-[11px] font-bold text-blue-600 block">مبيعات وفواتير</span>
          <strong className="text-xl font-black text-blue-700 font-mono">{salesCount}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-purple-600 block">شحن وتوصيل</span>
          <strong className="text-xl font-black text-purple-700 font-mono">{deliveryCount}</strong>
        </div>
      </div>

      {/* Unlinked notice */}
      {unlinkedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
          <KeyRound size={15} className="mt-0.5 shrink-0" />
          <div>
            <strong className="block font-black mb-0.5">
              {unlinkedCount} موظف لم ينشئ حساب دخول بعد
            </strong>
            اطلب من الموظف فتح صفحة <span className="font-mono" dir="ltr">/admin</span> واختيار
            «إنشاء حساب» بنفس البريد الإلكتروني المسجّل هنا — هيتفعّل تلقائياً. ولو أنشأ الحساب قبل
            إضافته، اضغط زر «ربط الحساب».
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-black text-gray-800">قائمة الموظفين والصلاحيات</span>
          <span className="text-[11px] text-gray-500">
            {loading ? 'جاري التحميل...' : `${staffList.length} حساب`}
          </span>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold">
            <Loader2 size={16} className="animate-spin" />
            جاري تحميل فريق العمل...
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-xs font-bold">
            لا يوجد موظفون بعد. اضغط «إضافة موظف جديد» للبدء.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {staffList.map((user) => (
              <div
                key={user.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50/50 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black flex items-center justify-center shrink-0">
                    {(user.fullName || user.email || '?').trim().charAt(0)}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-black text-gray-900 truncate">
                        {user.fullName || '(بدون اسم)'}
                      </strong>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${roleBadgeClass(user.role)}`}
                      >
                        {roleLabel(user.role)}
                      </span>
                      {isSelf(user) && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-300">
                          أنت
                        </span>
                      )}
                      {user.isActive ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          نشط
                        </span>
                      ) : (
                        <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle size={11} />
                          معطل
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail size={12} className="text-gray-400" />
                        <span className="font-mono text-blue-900 font-bold" dir="ltr">
                          {user.email}
                        </span>
                      </div>

                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <PhoneCall size={12} className="text-gray-400" />
                          <span className="font-mono text-gray-700" dir="ltr">
                            {user.phone}
                          </span>
                        </div>
                      )}

                      {user.lastLogin ? (
                        <div className="flex items-center gap-1">
                          <UserCheck size={12} className="text-emerald-600" />
                          <span className="text-[11px] text-emerald-700 font-bold">
                            آخر دخول: {new Date(user.lastLogin).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle size={12} className="text-amber-500" />
                          <span className="text-[11px] text-amber-700 font-bold">لم يدخل بعد</span>
                        </div>
                      )}
                    </div>

                    {user.notes && <p className="text-[11px] text-gray-500 italic">{user.notes}</p>}
                  </div>
                </div>


                <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
                  {!user.userId && (
                    <button
                      onClick={() => handleLinkAccount(user)}
                      disabled={busyId === user.id}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                      title="ربط بحساب Auth مسجّل بنفس البريد"
                    >
                      <Link2 size={12} />
                      <span>ربط الحساب</span>
                    </button>
                  )}

                  <button
                    onClick={() => openEdit(user)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => handleToggleActive(user)}
                    disabled={busyId === user.id || isSelf(user)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border disabled:opacity-40 ${
                      user.isActive
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {user.isActive ? 'تعطيل' : 'تفعيل'}
                  </button>

                  <button
                    onClick={() => handleDelete(user)}
                    disabled={busyId === user.id || isSelf(user)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-40"
                  >
                    <Trash2 size={12} />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-blue-950 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-700" />
                <span>{editing ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الاسم بالكامل *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ك/ اسم الموظف"
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@example.com"
                  dir="ltr"
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-mono font-bold text-left"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  الموظف هيستخدم نفس البريد ده عند إنشاء حسابه في صفحة الدخول.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الدور والصلاحية *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-bold bg-white"
                  >
                    <option value="admin">المدير العام</option>
                    <option value="sales_rep">موظف مبيعات وفواتير</option>
                    <option value="delivery_rep">مسؤول شحن وتوصيل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">رقم الموبايل</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-mono font-bold text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: مسؤول متابعة فواتير واتساب"
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-bold"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-900 leading-relaxed flex gap-2">
                <Truck size={14} className="mt-0.5 shrink-0" />
                <span>
                  مفيش كلمات مرور هنا — الموظف هو اللي بيعمل كلمة مروره من صفحة الدخول، وإحنا بس بنحدد
                  صلاحيته.
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-900 hover:bg-blue-950 text-white font-black py-3 rounded-xl transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                <span>{saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الموظف'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

