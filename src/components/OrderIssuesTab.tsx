import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
  Phone,
  MessageCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  PackageX,
  MessageSquareWarning,
} from 'lucide-react';
import type { FirebaseOrder } from '../types/firebase';
import { orderIssuesService } from '../services/order-issues.service';
import type { IssueStatus, IssueType, OrderIssue } from '../services/order-issues.service';
import { buildCustomerWhatsAppUrl } from '../services/customer-messages';

interface Props {
  orders: FirebaseOrder[];
  currentUserName?: string;
}

const TYPE_META: Record<IssueType, { label: string; icon: React.ReactNode; className: string }> = {
  return: { label: 'مرتجع', icon: <RotateCcw size={12} />, className: 'bg-blue-50 text-blue-900 border-blue-200' },
  complaint: {
    label: 'شكوى',
    icon: <MessageSquareWarning size={12} />,
    className: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  damage: { label: 'تالف', icon: <PackageX size={12} />, className: 'bg-red-50 text-red-900 border-red-200' },
};

const STATUS_META: Record<IssueStatus, { label: string; className: string }> = {
  open: { label: '🟡 مفتوح', className: 'bg-amber-50 text-amber-900 border-amber-300' },
  in_progress: { label: '🔵 جاري المعالجة', className: 'bg-blue-50 text-blue-900 border-blue-300' },
  resolved: { label: '✅ تم الحل', className: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
  rejected: { label: '❌ مرفوض', className: 'bg-gray-100 text-gray-700 border-gray-300' },
};

const followupMessage = (issue: OrderIssue): string =>
  `السلام عليكم أ/ة ${issue.customerName || 'عميلنا العزيز'} 🌿\nمع حضرتك فريق دريم طنطاوي جروب بخصوص طلبك رقم *#${issue.orderId}*.\n\n` +
  (issue.status === 'resolved'
    ? `تم حل الموضوع ✅${issue.resolution ? `\n${issue.resolution}` : ''}\nشكراً لصبرك، وأي حاجة تانية احنا تحت أمرك.`
    : `بنراجع الموضوع وبنشوف الحل الأنسب، وهنبلغك في أقرب وقت. شكراً لتفهمك 🙏`);

/** تبويب المرتجعات والشكاوى */
export const OrderIssuesTab: React.FC<Props> = ({ orders, currentUserName }) => {
  const [issues, setIssues] = useState<OrderIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | IssueStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [type, setType] = useState<IssueType>('complaint');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('0');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setIssues(await orderIssuesService.getAll());
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل المرتجعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setOrderId('');
    setPhone('');
    setCustomerName('');
    setType('complaint');
    setReason('');
    setAmount('0');
    setShowModal(true);
  };

  /** لما الموظف يختار طلب من القائمة، بنملا بيانات العميل تلقائياً */
  const handlePickOrder = (selectedOrderId: string) => {
    setOrderId(selectedOrderId);
    const order = orders.find((o) => o.orderId === selectedOrderId);
    if (order) {
      setPhone(order.customerPhone || '');
      setCustomerName(order.customerName || '');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) {
      alert('من فضلك حدد رقم الطلب ورقم العميل.');
      return;
    }
    setSaving(true);
    try {
      await orderIssuesService.create({
        orderId,
        customerPhone: phone,
        customerName,
        type,
        reason,
        amount: Number(amount) || 0,
        createdBy: currentUserName,
      });
      setShowModal(false);
      await load();
    } catch (err: any) {
      alert(err.message || 'تعذر تسجيل المرتجع');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (issue: OrderIssue, status: IssueStatus) => {
    let resolution: string | undefined;
    if (status === 'resolved' || status === 'rejected') {
      const input = prompt(
        status === 'resolved' ? 'اكتب الحل اللي تم (مثال: تم استبدال الصنف):' : 'سبب الرفض:',
        issue.resolution || ''
      );
      if (input === null) return;
      resolution = input;
    }

    setBusyId(issue.id);
    try {
      await orderIssuesService.update(issue.id, { status, resolution });
      setIssues((prev) =>
        prev.map((item) => (item.id === issue.id ? { ...item, status, resolution } : item))
      );
    } catch (err: any) {
      alert(err.message || 'تعذر تحديث الحالة');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (issue: OrderIssue) => {
    if (!confirm(`حذف ${TYPE_META[issue.type].label} الطلب #${issue.orderId} نهائياً؟`)) return;
    setBusyId(issue.id);
    try {
      await orderIssuesService.remove(issue.id);
      setIssues((prev) => prev.filter((item) => item.id !== issue.id));
    } catch (err: any) {
      alert(err.message || 'تعذر الحذف');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = filter === 'all' ? issues : issues.filter((issue) => issue.status === filter);
  const counts = {
    all: issues.length,
    open: issues.filter((i) => i.status === 'open').length,
    in_progress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
    rejected: issues.filter((i) => i.status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <RotateCcw className="text-amber-600" size={24} />
            <span>المرتجعات والشكاوى</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            سجّل أي مرتجع أو شكوى أو صنف تالف — ده اللي بيمنع تكرار الفقد ويحسّن اختيار الموردين.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={load}
            disabled={loading}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition disabled:opacity-50"
            title="تحديث"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreate}
            className="bg-amber-600 hover:bg-amber-700 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-md"
          >
            <Plus size={16} />
            <span>تسجيل مرتجع / شكوى</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-4 rounded-xl flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: 'all', label: `الكل (${counts.all})` },
          { id: 'open', label: `مفتوح (${counts.open})` },
          { id: 'in_progress', label: `جاري المعالجة (${counts.in_progress})` },
          { id: 'resolved', label: `تم الحل (${counts.resolved})` },
          { id: 'rejected', label: `مرفوض (${counts.rejected})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === tab.id
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold">
          <Loader2 size={16} className="animate-spin" />
          جاري تحميل المرتجعات...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
          <CheckCircle2 size={40} className="text-emerald-300 mx-auto" />
          <h4 className="text-sm font-bold text-gray-700">لا توجد مرتجعات أو شكاوى</h4>
          <p className="text-xs text-gray-400">ده مؤشر كويس 👌 — ولو حصل حاجة سجّلها من الزر فوق.</p>
        </div>
      ) : (
        <div className="space-y-2.5">

          {filtered.map((issue) => (
            <div
              key={issue.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`text-[11px] font-black px-2 py-1 rounded-lg border flex items-center gap-1 shrink-0 ${
                      TYPE_META[issue.type].className
                    }`}
                  >
                    {TYPE_META[issue.type].icon}
                    {TYPE_META[issue.type].label}
                  </span>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-black bg-blue-950 text-white px-2 py-0.5 rounded">
                        #{issue.orderId}
                      </span>
                      <strong className="text-sm font-black text-gray-900">
                        {issue.customerName || 'عميل'}
                      </strong>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          STATUS_META[issue.status].className
                        }`}
                      >
                        {STATUS_META[issue.status].label}
                      </span>
                      {issue.amount > 0 && (
                        <span className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          {issue.amount.toLocaleString('ar-EG')} ج.م
                        </span>
                      )}
                    </div>

                    {issue.reason && <p className="text-[11px] text-gray-700">{issue.reason}</p>}
                    {issue.resolution && (
                      <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                        ✅ {issue.resolution}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(issue.createdAt).toLocaleString('ar-EG')}
                      {issue.createdBy ? ` • ${issue.createdBy}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <a
                    href={`tel:${issue.customerPhone}`}
                    className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    <Phone size={11} />
                    <span dir="ltr" className="font-mono">{issue.customerPhone}</span>
                  </a>
                  <a
                    href={buildCustomerWhatsAppUrl(issue.customerPhone, followupMessage(issue))}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    <MessageCircle size={11} />
                    واتساب
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2">
                <button
                  onClick={() => updateStatus(issue, 'in_progress')}
                  disabled={busyId === issue.id || issue.status === 'in_progress'}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-[11px] font-bold disabled:opacity-40"
                >
                  جاري المعالجة
                </button>
                <button
                  onClick={() => updateStatus(issue, 'resolved')}
                  disabled={busyId === issue.id || issue.status === 'resolved'}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[11px] font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  <CheckCircle2 size={11} />
                  تم الحل
                </button>
                <button
                  onClick={() => updateStatus(issue, 'rejected')}
                  disabled={busyId === issue.id || issue.status === 'rejected'}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-[11px] font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  <XCircle size={11} />
                  مرفوض
                </button>
                <button
                  onClick={() => handleDelete(issue)}
                  disabled={busyId === issue.id}
                  className="mr-auto px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  <Trash2 size={11} />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-blue-950 flex items-center gap-2">
                <RotateCcw size={16} className="text-amber-600" />
                <span>تسجيل مرتجع / شكوى</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الطلب *</label>
                <select
                  value={orderId}
                  onChange={(e) => handlePickOrder(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                >
                  <option value="">— اختر الطلب —</option>
                  {orders.slice(0, 100).map((order) => (
                    <option key={order.id || order.orderId} value={order.orderId}>
                      #{order.orderId} — {order.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اسم العميل</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">موبايل العميل *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-mono font-bold text-left focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">النوع *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as IssueType)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="complaint">شكوى</option>
                    <option value="return">مرتجع</option>
                    <option value="damage">صنف تالف</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">القيمة (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">التفاصيل / السبب</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="مثال: العميل بيقول إن الصنف وصل مكسور من الكرتونة"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                <span>{saving ? 'جاري التسجيل...' : 'تسجيل'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

