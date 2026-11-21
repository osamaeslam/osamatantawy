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
  Search,
  BellRing,
} from 'lucide-react';
import { itemRequestService } from '../services/item-requests.service';
import type { ItemRequest, ItemRequestStatus } from '../services/item-requests.service';
import { searchAnalyticsService } from '../services/search-analytics.service';
import type { ZeroResultSearchEntry, ZeroSearchStatus } from '../services/search-analytics.service';
import { stockAlertsService } from '../services/stock-alerts.service';
import type { StockAlertEntry } from '../services/stock-alerts.service';
import { buildCustomerWhatsAppUrl } from '../services/customer-messages';
import { TANTAWY_HOTLINE } from '../services/whatsapp-order';

const STATUS_META: Record<ItemRequestStatus, { label: string; className: string }> = {
  new: { label: 'جديد', className: 'bg-amber-50 text-amber-900 border-amber-300' },
  seen: { label: 'تم الاطلاع', className: 'bg-blue-50 text-blue-900 border-blue-300' },
  sourced: { label: 'تم توفيره', className: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
  rejected: { label: 'غير متاح', className: 'bg-red-50 text-red-900 border-red-300' },
};

const replyMessage = (req: ItemRequest, status: ItemRequestStatus): string => {
  const head = `السلام عليكم 🌿\nأ/ة ${req.customerName}، مع حضرتك فريق دريم طنطاوي جروب.`;

  if (status === 'sourced') {
    return `${head}\n\nبخصوص الصنف اللي حضرتك كنت بتدور عليه:\n*${req.itemName}*\n\n✅ متوفر عندنا دلوقتي.\nعايزين نعرف الكمية المطلوبة عشان نجهزلك عرض السعر ونبعتلك صور الصنف والتكلفة.`;
  }
  if (status === 'rejected') {
    return `${head}\n\nبخصوص الصنف: *${req.itemName}*\n\nللأسف مش متوفر عندنا حالياً ومقدرناش نوفره من الموردين.\nلو عندك صنف بديل أو مواصفات تانية تحب ندور عليها، ابعتلنا وهنشوفها فوراً 🌿`;
  }
  return `${head}\n\nوصلنا طلبك بخصوص الصنف: *${req.itemName}*\nوجاري البحث عنه مع الموردين، وهنبلغك أول ما يبقى متاح.`;
};

type SectionTab = 'requests' | 'zero_searches' | 'stock_alerts';

/** تبويب احتياجات السوق: طلبات الأصناف + كلمات البحث الفارغة + قوائم انتظار عودة التوفر */
export const ItemRequestsTab: React.FC = () => {
  const [section, setSection] = useState<SectionTab>('requests');

  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [zeroSearches, setZeroSearches] = useState<ZeroResultSearchEntry[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlertEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ItemRequestStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqs, searches, alerts] = await Promise.all([
        itemRequestService.getAll().catch((e) => {
          setError(e?.message || 'تعذر تحميل بعض الطلبات');
          return [] as ItemRequest[];
        }),
        searchAnalyticsService.getAll(),
        stockAlertsService.getAll(),
      ]);
      setRequests(reqs);
      setZeroSearches(searches);
      setStockAlerts(alerts);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل البيانات');
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

  const handleZeroSearchStatus = async (id: string, status: ZeroSearchStatus) => {
    await searchAnalyticsService.updateStatus(id, status);
    setZeroSearches((prev) => prev.map((z) => (z.id === id ? { ...z, status } : z)));
  };

  const handleDeleteZeroSearch = async (id: string) => {
    await searchAnalyticsService.remove(id);
    setZeroSearches((prev) => prev.filter((z) => z.id !== id));
  };

  const handleNotifyStockAlert = async (entry: StockAlertEntry) => {
    const codeText = entry.productCode ? ` (كود: ${entry.productCode})` : '';
    const msg = `السلام عليكم 🌿\nأ/ة ${entry.customerName}، مع حضرتك فريق دريم طنطاوي جروب.\n\nيسعدنا إبلاغك بأن الصنف الذي طلبت تنبيه توفره:\n*${entry.productName}*${codeText}\n\n✅ *أصبح متوفراً الآن* بالمخزن وجاهز للطلب والشحن.\nلتأكيد الحجز ومعرفة السعر، رد علينا هنا أو اتصل على الخط الساخن ${TANTAWY_HOTLINE}.`;
    window.open(buildCustomerWhatsAppUrl(entry.customerPhone, msg), '_blank', 'noopener');
    await stockAlertsService.markNotified(entry.id);
    setStockAlerts((prev) =>
      prev.map((a) =>
        a.id === entry.id ? { ...a, status: 'notified', notifiedAt: new Date().toISOString() } : a
      )
    );
  };

  const handleRemoveStockAlert = async (id: string) => {
    await stockAlertsService.remove(id);
    setStockAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const waitingAlertsCount = stockAlerts.filter((a) => a.status === 'waiting').length;
  const openZeroSearchesCount = zeroSearches.filter((z) => z.status === 'open').length;

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
            <span>طلبات السوق، البحث المفقود، وتنبيهات التوفر</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            مركز متكامل لفريق المشتريات والمبيعات: الأصناف المطلوبة، أكثر كلمات البحث بلا نتائج، والعملاء المنتظرين لعودة التوفر.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* Sub-navigation between the 3 demand streams */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setSection('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
            section === 'requests'
              ? 'bg-white text-blue-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox size={14} />
          <span>طلبات أصناف خاصة ({requests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSection('zero_searches')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
            section === 'zero_searches'
              ? 'bg-white text-blue-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search size={14} />
          <span>كلمات بحث بلا نتائج ({openZeroSearchesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setSection('stock_alerts')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
            section === 'stock_alerts'
              ? 'bg-white text-blue-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BellRing size={14} />
          <span>تنبيهات «أبلغني عند التوفر» ({waitingAlertsCount})</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-4 rounded-xl flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Custom Item Requests */}
      {section === 'requests' && (
        <div className="space-y-4">
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
                لما عميل يطلب صنف مش موجود من زر خدمة العملاء أو من نتائج البحث الفارغة، هيظهر هنا فوراً.
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
                            className={`text-[10px] font-black px-2 py-0.5 rounded border ${
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
                          {req.customerName} · {new Date(req.createdAt).toLocaleString('ar-EG')}
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
      )}

      {/* SECTION 2: Zero-Result Searches Analytics */}
      {section === 'zero_searches' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-900">
                أكثر العبارات التي بحث عنها العملاء ولم يجدوها
              </h4>
              <p className="text-[11px] text-slate-500">
                مرتبة بعدد مرات البحث لتوجيه المشتريات أو إضافة كلمات بديلة للمنتجات الموجودة
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 tabular-nums">
              {zeroSearches.length} عبارة مسجلة
            </span>
          </div>

          {zeroSearches.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Search size={36} className="text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-600">
                لا توجد عمليات بحث بلا نتائج مسجلة حتى الآن.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {zeroSearches.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/70"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-900">«{item.query}»</span>
                      <span className="text-xs font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded tabular-nums">
                        {item.count} مرة
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.status === 'sourced'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : item.status === 'ignored'
                            ? 'bg-gray-100 text-gray-600 border-gray-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        {item.status === 'sourced'
                          ? 'تم التوفير'
                          : item.status === 'ignored'
                          ? 'مؤرشف'
                          : 'قيد المراجعة'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                      آخر بحث: {new Date(item.lastSearchedAt).toLocaleString('ar-EG')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleZeroSearchStatus(item.id, 'sourced')}
                      disabled={item.status === 'sourced'}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[11px] font-bold disabled:opacity-40"
                    >
                      تم التوفير
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZeroSearchStatus(item.id, 'ignored')}
                      disabled={item.status === 'ignored'}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold disabled:opacity-40"
                    >
                      أرشفة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteZeroSearch(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Back-in-Stock Waitlist Alerts */}
      {section === 'stock_alerts' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-900">
                العملاء المسجلون في ميزة «أبلغني عند التوفر»
              </h4>
              <p className="text-[11px] text-slate-500">
                بمجرد توفر الصنف اضغط «إبلاغ واتساب» لإرسال رسالة جاهزة للعميل وتأكيد الطلب فوراً
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 tabular-nums">
              {stockAlerts.length} عميل مسجل
            </span>
          </div>

          {stockAlerts.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <BellRing size={36} className="text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-600">
                لا يوجد عملاء في قائمة انتظار التوفر حالياً.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stockAlerts.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/70"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{entry.productName}</span>
                      {entry.productCode && (
                        <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded">
                          {entry.productCode}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          entry.status === 'notified'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        {entry.status === 'notified' ? 'تم إبلاغه ✅' : 'بانتظار التوفر'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800">{entry.customerName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-bold text-blue-900" dir="ltr">
                        {entry.customerPhone}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(entry.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${entry.customerPhone}`}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Phone size={12} />
                      <span>اتصال</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleNotifyStockAlert(entry)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1"
                    >
                      <MessageCircle size={13} />
                      <span>{entry.status === 'notified' ? 'إعادة الإبلاغ' : 'إبلاغ بتوفر الصنف واتساب'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStockAlert(entry.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
