import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Crown,
  Phone,
  MessageCircle,
  Edit3,
  Loader2,
  AlertCircle,
  Star,
  ShoppingBag,
} from 'lucide-react';
import type { FirebaseOrder } from '../types/firebase';
import { customersService, normalizeCustomerPhone } from '../services/customers.service';
import type { Customer } from '../services/customers.service';
import { buildCustomerWhatsAppUrl } from '../services/customer-messages';

interface Props {
  orders: FirebaseOrder[];
}

interface CustomerRow {
  phone: string;
  name: string;
  ordersCount: number;
  totalValue: number;
  lastOrderAt: string;
  lastStatus: string;
  notes?: string;
  isVip: boolean;
}

const statusLabel = (status?: string): string => {
  switch (status) {
    case 'priced':
      return 'تم التسعير';
    case 'confirmed':
      return 'مؤكد';
    case 'dispatched':
      return 'خرج للتوصيل';
    case 'delivered':
      return 'تم التسليم';
    case 'cancelled':
      return 'ملغي';
    default:
      return 'بانتظار التسعير';
  }
};

/** تبويب العملاء (CRM بسيط) — بيجمع بيانات كل رقم من الطلبات + ملاحظات محفوظة */
export const CustomersTab: React.FC<Props> = ({ orders }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [onlyVip, setOnlyVip] = useState(false);

  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [formName, setFormName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formVip, setFormVip] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCustomers(await customersService.getAll());
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل بيانات العملاء');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /** استخراج العملاء من الطلبات (المصدر الأساسي) ودمج الملاحظات المحفوظة */
  const rows: CustomerRow[] = useMemo(() => {
    const map = new Map<string, CustomerRow>();

    orders.forEach((order) => {
      const phone = normalizeCustomerPhone(order.customerPhone);
      if (!phone) return;

      const created = order.createdAt ? String(order.createdAt) : '';
      const existing = map.get(phone);

      if (!existing) {
        map.set(phone, {
          phone,
          name: order.customerName || '',
          ordersCount: 1,
          totalValue: Number(order.totalPrice) || 0,
          lastOrderAt: created,
          lastStatus: order.status,
          notes: undefined,
          isVip: false,
        });
        return;
      }

      existing.ordersCount += 1;
      existing.totalValue += Number(order.totalPrice) || 0;
      if (new Date(created).getTime() > new Date(existing.lastOrderAt).getTime()) {
        existing.lastOrderAt = created;
        existing.lastStatus = order.status;
        if (order.customerName) existing.name = order.customerName;
      }
    });

    // دمج الملاحظات/VIP من جدول العملاء
    customers.forEach((customer) => {
      const phone = normalizeCustomerPhone(customer.phone);
      const row = map.get(phone);
      if (row) {
        row.notes = customer.notes;
        row.isVip = customer.isVip;
        if (!row.name && customer.name) row.name = customer.name;
      } else {
        map.set(phone, {
          phone,
          name: customer.name || '',
          ordersCount: 0,
          totalValue: 0,
          lastOrderAt: customer.createdAt || '',
          lastStatus: '',
          notes: customer.notes,
          isVip: customer.isVip,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
    );
  }, [orders, customers]);

  const filtered = rows.filter((row) => {
    const q = query.trim();
    const matches =
      !q || row.phone.includes(q) || (row.name || '').toLowerCase().includes(q.toLowerCase());
    const matchesVip = !onlyVip || row.isVip;
    return matches && matchesVip;
  });

  const vipCount = rows.filter((r) => r.isVip).length;
  const repeatCount = rows.filter((r) => r.ordersCount > 1).length;

  const openEdit = (row: CustomerRow) => {
    setEditing(row);
    setFormName(row.name || '');
    setFormNotes(row.notes || '');
    setFormVip(row.isVip);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await customersService.save({
        phone: editing.phone,
        name: formName,
        notes: formNotes,
        isVip: formVip,
      });
      setEditing(null);
      await load();
    } catch (err: any) {
      alert(err.message || 'تعذر حفظ بيانات العميل');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Users className="text-blue-700" size={24} />
            <span>العملاء (CRM)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            كل رقم موبايل طلب مننا بيظهر هنا مع عدد طلباته وقيمتها — واكتب ملاحظاتك عليه لتتابعه أحسن.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>تحديث</span>
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold p-3.5 rounded-xl flex items-start gap-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{error} — بيانات الطلبات ظاهرة، بس حفظ الملاحظات محتاج الملف ده.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 block">إجمالي العملاء</span>
          <strong className="text-xl font-black text-blue-950 font-mono">{rows.length}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 block">عملاء VIP</span>
          <strong className="text-xl font-black text-amber-700 font-mono">{vipCount}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 block">عملاء بطلبات متكررة</span>
          <strong className="text-xl font-black text-emerald-700 font-mono">{repeatCount}</strong>
        </div>
      </div>

      {/* Search + VIP filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالاسم أو رقم الموبايل..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-none font-medium"
          />
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
        </div>
        <button
          onClick={() => setOnlyVip((prev) => !prev)}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            onlyVip ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Crown size={13} />
          <span>VIP فقط</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold">
          <Loader2 size={16} className="animate-spin" />
          جاري تحميل العملاء...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
          <Users size={40} className="text-gray-300 mx-auto" />
          <h4 className="text-sm font-bold text-gray-700">لا يوجد عملاء مطابقين</h4>
          <p className="text-xs text-gray-400">العملاء بيظهروا تلقائياً أول ما يبعتوا أول طلب.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((row) => (
            <div
              key={row.phone}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl font-black flex items-center justify-center shrink-0 ${
                    row.isVip ? 'bg-amber-400 text-amber-950' : 'bg-blue-900 text-white'
                  }`}
                >
                  {row.isVip ? <Crown size={18} /> : (row.name || '؟').trim().charAt(0)}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm font-black text-gray-900">{row.name || 'عميل'}</strong>
                    <span className="font-mono text-[11px] text-blue-900 font-black" dir="ltr">
                      {row.phone}
                    </span>
                    {row.ordersCount > 1 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star size={9} />
                        عميل متكرر
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600 font-bold">
                    <span className="flex items-center gap-1">
                      <ShoppingBag size={11} className="text-gray-400" />
                      {row.ordersCount} طلب
                    </span>
                    {row.totalValue > 0 && (
                      <span className="font-mono text-blue-900">
                        {row.totalValue.toLocaleString('ar-EG')} ج.م
                      </span>
                    )}
                    {row.lastStatus && (
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                        {statusLabel(row.lastStatus)}
                      </span>
                    )}
                    {row.lastOrderAt && (
                      <span className="text-gray-400">
                        آخر طلب: {new Date(row.lastOrderAt).toLocaleDateString('ar-EG')}
                      </span>
                    )}
                  </div>

                  {row.notes && (
                    <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                      📝 {row.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end md:self-auto">
                <a
                  href={`tel:${row.phone}`}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold flex items-center gap-1"
                >
                  <Phone size={12} />
                  اتصال
                </a>
                <a
                  href={buildCustomerWhatsAppUrl(
                    row.phone,
                    `السلام عليكم أ/ة ${row.name || 'عميلنا العزيز'}، مع حضرتك فريق دريم طنطاوي جروب 🌿`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                >
                  <MessageCircle size={12} />
                  واتساب
                </a>
                <button
                  onClick={() => openEdit(row)}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
                >
                  <Edit3 size={12} />
                  ملاحظات
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-blue-950 flex items-center gap-2">
                <Edit3 size={16} />
                <span>بيانات العميل</span>
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-[11px] font-bold text-gray-700 space-y-1">
              <p>
                الموبايل: <span className="font-mono text-blue-900" dir="ltr">{editing.phone}</span>
              </p>
              <p>عدد الطلبات: {editing.ordersCount}</p>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الاسم</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات المتابعة</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="مثال: بيحب الأصناف الزجاجية — بيسأل كتير عن الأسعار — مواعيد تواصله بعد العصر"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                />
              </div>

              <label className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formVip}
                  onChange={(e) => setFormVip(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                  <Crown size={13} />
                  عميل VIP (أولوية في المتابعة والأسعار)
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-900 hover:bg-blue-950 text-white font-black py-3 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                <span>{saving ? 'جاري الحفظ...' : 'حفظ البيانات'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

