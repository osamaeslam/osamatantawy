import React, { useEffect, useState } from 'react';
import {
  Inbox,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  Trash2,
  Eye,
  ImageIcon,
  Package,
} from 'lucide-react';
import { itemRequestService } from '../services/item-requests.service';
import type { ItemRequest, ItemRequestStatus } from '../services/item-requests.service';
import { buildCustomerWhatsAppUrl } from '../services/customer-messages';

const STATUS_META: Record<ItemRequestStatus, { label: string; className: string }> = {
  new: { label: '🆕 جديد', className: 'bg-amber-50 text-amber-900 border-amber-300' },
  seen: { label: '👀 تم الاطلاع', className: 'bg-blue-50 text-blue-900 border-blue-300' },
  sourced: { label: '✅ تم توفيره', className: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
  rejected: { label: '❌ غير متاح', className: 'bg-red-50 text-red-900 border-red-300' },
};

const replyMessage = (req: ItemRequest, status: ItemRequestStatus): string => {
  const head = `السلام عليكم 🌿\nأ/ة ${req.customerName}، مع حضرتك فريق دريم طنطاوي جروب.`;

  if (status === 'sourced') {
    return `${head}\n\nبخصوص الصنف اللي حضرتك كنت بتدور عليه:\n*${req.itemName}*\n\n✅ متوفر عندنا دلوقتي.\nعايز نعرف الكمية المطلوبة عشان نجهزلك عرض السعر ونبعتلك صور الصنف والتكلفة.`;
  }
  if (status === 'rejected') {
    return `${head}\n\nبخصوص الصنف: *${req.itemName}*\n\nللأسف مش متوفر عندنا حالياً ومقدرناش نوفره من الموردين.\nلو عندك صنف بديل أو مواصفات تانية تحب ندور عليها، ابعتلنا وهنشوفها فوراً 🌿`;
  }
  return `${head}\n\nوصلنا طلبك بخصوص الصنف: *${req.itemName}*\nوجاري البحث عنه مع الموردين، وهنبلغك أول ما يبقى متاح.`;
};

/** تبويب إدارة طلبات الأصناف غير الموجودة */
export const ItemRequestsTab: React.FC = () => {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ItemRequestStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await itemRequestService.getAll());
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (req: ItemRequest, status: ItemRequestStatus) => {
    setBusyId(req.id);
    try {
      await itemRequestService.update(req.id, { status });
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status } : r)));
    } catch (err: any) {
      alert(err.message || 'تعذر تحديث حالة الطلب');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (req: ItemRequest) => {
    if (!confirm(`حذف طلب "${req.itemName}" نهائياً؟`)) return;
    setBusyId(req.id);
    try {
      await itemRequestService.remove(req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (err: any) {
      alert(err.message || 'تعذر حذف الطلب');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    new: requests.filter((r) => r.status === 'new').length,
    seen: requests.filter((r) => r.status === 'seen').length,
    sourced: requests.filter((r) => r.status === 'sourced').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Inbox className="text-purple-700" size={24} />
            <span>طلبات أصناف غير موجودة في الكتالوج</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            ده أهم مصدر لمعرفة الأصناف اللي السوق بيطلبها ومش موجودة عندنا — راجعه دورياً مع المشتريات.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>تحديث</span>
        </button>
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
          { id: 'new', label: `جديد (${counts.new})` },
          { id: 'seen', label: `تم الاطلاع (${counts.seen})` },
          { id: 'sourced', label: `تم توفيره (${counts.sourced})` },
          { id: 'rejected', label: `غير متاح (${counts.rejected})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === tab.id
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold">
          <Loader2 size={16} className="animate-spin" />
          جاري تحميل الطلبات...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
          <Package size={40} className="text-gray-300 mx-auto" />
          <h4 className="text-sm font-bold text-gray-700">لا توجد طلبات هنا</h4>
          <p className="text-xs text-gray-400">
            لما عميل يطلب صنف مش موجود من زر خدمة العملاء في الموقع، هيظهر هنا فوراً.
          </p>
        </div>
      ) : (
        <div className="space-y-3">

          {filtered.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {req.imageUrl ? (
                    <a href={req.imageUrl} target="_blank" rel="noreferrer" title="عرض الصورة">
                      <img
                        src={req.imageUrl}
                        alt={req.itemName}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                    </a>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300 shrink-0">
                      <ImageIcon size={18} />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-gray-900">{req.itemName}</h4>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          STATUS_META[req.status].className
                        }`}
                      >
                        {STATUS_META[req.status].label}
                      </span>
                    </div>
                    {req.details && (
                      <p className="text-[11px] text-gray-600 leading-relaxed">{req.details}</p>
                    )}
                    <p className="text-[11px] text-gray-400 font-bold">
                      {new Date(req.createdAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <a
                    href={`tel:${req.customerPhone}`}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold flex items-center gap-1"
                    title="اتصال بالعميل"
                  >
                    <Phone size={12} />
                    <span dir="ltr" className="font-mono">{req.customerPhone}</span>
                  </a>
                  <a
                    href={buildCustomerWhatsAppUrl(req.customerPhone, replyMessage(req, req.status))}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                    title="رد على العميل على واتساب"
                  >
                    <MessageCircle size={12} />
                    <span>رد واتساب</span>
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2.5">
                <span className="text-[10px] font-bold text-gray-400 ml-1">تحديث الحالة:</span>
                <button
                  onClick={() => updateStatus(req, 'seen')}
                  disabled={busyId === req.id || req.status === 'seen'}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-[11px] font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  <Eye size={11} />
                  تم الاطلاع
                </button>
                <button
                  onClick={() => updateStatus(req, 'sourced')}
                  disabled={busyId === req.id || req.status === 'sourced'}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[11px] font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  <CheckCircle2 size={11} />
                  تم توفيره
                </button>
                <button
                  onClick={() => updateStatus(req, 'rejected')}
                  disabled={busyId === req.id || req.status === 'rejected'}
                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg text-[11px] font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  <XCircle size={11} />
                  غير متاح
                </button>

                <button
                  onClick={() => handleDelete(req)}
                  disabled={busyId === req.id}
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
    </div>
  );
};

