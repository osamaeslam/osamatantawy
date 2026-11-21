import React, { useState, useEffect } from 'react';
import {
  X,
  PhoneCall,
  MessageCircle,
  Search,
  Plus,
  Trash2,
  Save,
  FileText,
  User,
  MapPin,
  Package,
  Truck,
  Tag,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { orderService } from '../supabase/orders.service';
import { productService } from '../supabase/products.service';
import type { FirebaseOrder } from '../types/firebase';
import type { Product } from '../types';
import type { OrderItemInvoice } from '../services/invoice-to-whatsapp';
import { useApp } from '../context/AppContext';

interface QuickPhoneOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffNames: string[];
  currentStaffName?: string;
  onOrderCreated: (newOrder: FirebaseOrder, openPdf?: boolean) => void;
}

export const QuickPhoneOrderModal: React.FC<QuickPhoneOrderModalProps> = ({
  isOpen,
  onClose,
  staffNames,
  currentStaffName,
  onOrderCreated,
}) => {
  const { products: localProducts } = useApp();

  const [orderSource, setOrderSource] = useState<'phone_15218' | 'whatsapp_direct'>('phone_15218');
  const [customerName, setCustomerName] = useState('');
  const [phonePrimary, setPhonePrimary] = useState('');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [city, setCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState('من يومين إلى 7 أيام عمل');
  const [assignedTo, setAssignedTo] = useState(currentStaffName || '');
  const [status, setStatus] = useState<FirebaseOrder['status']>('confirmed');
  const [notes, setNotes] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  const [items, setItems] = useState<OrderItemInvoice[]>([]);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchingCatalog, setSearchingCatalog] = useState(false);

  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(0);
  const [customItemQty, setCustomItemQty] = useState<number>(1);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (currentStaffName && !assignedTo) {
      setAssignedTo(currentStaffName);
    }
  }, [isOpen, currentStaffName, assignedTo]);

  // Debounced server-side product search across 5k-10k items (with instant local fallback)
  useEffect(() => {
    const q = catalogQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchingCatalog(true);
      try {
        const res = await productService.getMappedPaged({ page: 1, pageSize: 8, query: q });
        if (!cancelled) {
          if (res.products.length > 0) {
            setSearchResults(res.products);
          } else {
            const lower = q.toLowerCase();
            setSearchResults(
              localProducts
                .filter(
                  (p) =>
                    p.nameAr.toLowerCase().includes(lower) ||
                    (p.brand || '').toLowerCase().includes(lower) ||
                    (p.itemNumber || '').toLowerCase().includes(lower) ||
                    (p.unifiedCode || '').toLowerCase().includes(lower)
                )
                .slice(0, 8)
            );
          }
        }
      } catch {
        if (!cancelled) {
          const lower = q.toLowerCase();
          setSearchResults(
            localProducts
              .filter((p) => p.nameAr.toLowerCase().includes(lower))
              .slice(0, 8)
          );
        }
      } finally {
        if (!cancelled) setSearchingCatalog(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [catalogQuery, localProducts]);

  if (!isOpen) return null;

  const itemsSubtotal = items.reduce(
    (sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
    0
  );
  const grandTotal = Math.max(0, itemsSubtotal + (Number(deliveryFee) || 0) - (Number(discount) || 0));

  const addCatalogProduct = (p: Product) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.unifiedCode && i.unifiedCode === (p.unifiedCode || p.itemNumber));
      if (existingIdx > -1 && (p.unifiedCode || p.itemNumber)) {
        const next = [...prev];
        const qty = (next[existingIdx].quantity || 1) + 1;
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: qty,
          totalItemPrice: qty * (next[existingIdx].unitPrice || 0),
        };
        return next;
      }
      const price = Number(p.actualprice) || 0;
      return [
        ...prev,
        {
          nameAr: p.nameAr,
          brand: p.brand,
          quantity: 1,
          unitPrice: price,
          totalItemPrice: price,
          unifiedCode: p.unifiedCode || p.itemNumber,
          itemNumber: p.itemNumber,
          image: p.previewimage,
        },
      ];
    });
    setCatalogQuery('');
    setSearchResults([]);
  };

  const addCustomRow = () => {
    if (!customItemName.trim()) return;
    const qty = Math.max(1, Number(customItemQty) || 1);
    const unitPrice = Math.max(0, Number(customItemPrice) || 0);
    setItems((prev) => [
      ...prev,
      {
        nameAr: customItemName.trim(),
        brand: 'دريم طنطاوي جروب',
        quantity: qty,
        unitPrice,
        totalItemPrice: qty * unitPrice,
      },
    ]);
    setCustomItemName('');
    setCustomItemPrice(0);
    setCustomItemQty(1);
  };

  const handleSubmit = async (openPdfAfter: boolean) => {
    setError(null);
    if (!customerName.trim()) {
      setError('يرجى إدخال اسم العميل');
      return;
    }
    if (!phonePrimary.trim() || phonePrimary.replace(/[^0-9]/g, '').length < 8) {
      setError('يرجى إدخال رقم موبايل صحيح للعميل');
      return;
    }
    if (!deliveryAddress.trim()) {
      setError('يرجى إدخال عنوان التوصيل');
      return;
    }
    if (items.length === 0) {
      setError('أضف صنفاً واحداً على الأقل من الكتالوج أو يدوياً');
      return;
    }

    setSaving(true);
    try {
      const orderId = `PH-${Math.floor(100000 + Math.random() * 900000)}`;
      const created = await orderService.createPhoneOrder({
        orderId,
        customerName: customerName.trim(),
        phonePrimary: phonePrimary.trim(),
        phoneSecondary: phoneSecondary.trim() || undefined,
        orderSource,
        deliveryAddress: deliveryAddress.trim(),
        city: city.trim() || undefined,
        landmark: landmark.trim() || undefined,
        deliveryTimeWindow,
        notes: notes.trim() || undefined,
        items,
        deliveryFee,
        discount,
        totalPrice: grandTotal,
        status,
        assignedTo: assignedTo || null,
        createdBy: currentStaffName || assignedTo || 'الإدارة',
      });

      onOrderCreated(created, openPdfAfter);
      // Reset fields
      setCustomerName('');
      setPhonePrimary('');
      setPhoneSecondary('');
      setCity('');
      setDeliveryAddress('');
      setLandmark('');
      setNotes('');
      setItems([]);
      setDeliveryFee(0);
      setDiscount(0);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'تعذر تسجيل الطلب في قاعدة البيانات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[93vh] overflow-hidden shadow-2xl border border-gray-200 flex flex-col text-right"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-blue-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400 text-blue-950 rounded-xl">
              <PhoneCall size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">
                تسجيل طلب تليفوني مباشر (15218 / واتساب)
              </h3>
              <p className="text-[11px] text-blue-200">
                حفظ الطلب فوراً في قاعدة البيانات واستخراج كارت الفاتورة PDF للعميل بدون دخول الموقع
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-gray-200 transition"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-2.5 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {/* Source & Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">مصدر الطلب</label>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOrderSource('phone_15218')}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    orderSource === 'phone_15218'
                      ? 'bg-white text-blue-950 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <PhoneCall size={13} />
                  <span>الخط الساخن 15218</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSource('whatsapp_direct')}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    orderSource === 'whatsapp_direct'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageCircle size={13} />
                  <span>واتساب مباشر</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">حالة الطلب المبدئية</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FirebaseOrder['status'])}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="pending">بانتظار التسعير</option>
                <option value="priced">تم التسعير وإبلاغ العميل</option>
                <option value="confirmed">مؤكد للشحن والتوصيل</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">الموظف المسؤول</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">غير معيّن</option>
                {staffNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                {currentStaffName && !staffNames.includes(currentStaffName) && (
                  <option value={currentStaffName}>{currentStaffName}</option>
                )}
              </select>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-blue-950">
              <User size={15} />
              <span>بيانات العميل والعنوان</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">اسم العميل *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="الاسم ثلاثي..."
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">رقم الموبايل الأساسي *</label>
                <input
                  type="tel"
                  value={phonePrimary}
                  onChange={(e) => setPhonePrimary(e.target.value)}
                  placeholder="01012345678"
                  dir="ltr"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-mono bg-white text-left outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">موبايل بديل (اختياري)</label>
                <input
                  type="tel"
                  value={phoneSecondary}
                  onChange={(e) => setPhoneSecondary(e.target.value)}
                  placeholder="011..."
                  dir="ltr"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-mono bg-white text-left outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">المحافظة / المدينة</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثال: القاهرة / الجيزة / المنصورة"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">العنوان بالتفصيل *</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="الشارع، رقم العقار، الدور..."
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">علامة مميزة</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="بجوار مسجد / مدرسة..."
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Product Picker */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                <Package size={15} />
                <span>اختيار الأجهزة من الكتالوج (بحث فوري على قاعدة البيانات)</span>
              </span>
              <span className="text-[11px] text-gray-500 font-bold">
                ابحث بالاسم أو الكود واضغط لإضافة الصنف
              </span>
            </div>

            <div className="relative">
              <Search size={15} className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                placeholder="ابحث باسم الجهاز، الماركة، أو رقم الصنف..."
                className="w-full pr-9 pl-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600"
              />
              {searchingCatalog && (
                <Loader2 size={15} className="absolute left-3 top-3 text-blue-700 animate-spin" />
              )}

              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-blue-200 rounded-xl divide-y divide-gray-100 max-h-52 overflow-y-auto shadow-lg">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addCatalogProduct(p)}
                      className="w-full px-3 py-2 hover:bg-blue-50 flex items-center justify-between gap-2 text-right transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{p.nameAr}</p>
                        <p className="text-[10px] text-gray-500">
                          {p.brand} · {p.unifiedCode || p.itemNumber || ''}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-black text-blue-900 shrink-0 tabular-nums">
                        {p.actualprice > 0 ? `${p.actualprice.toLocaleString('ar-EG')} ج.م` : 'حدد السعر'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Manual Item Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-blue-100">
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="أو اكتب اسم صنف يدوياً..."
                className="sm:col-span-6 p-2 bg-white border border-gray-300 rounded-xl text-xs"
              />
              <input
                type="number"
                min={1}
                value={customItemQty}
                onChange={(e) => setCustomItemQty(Number(e.target.value) || 1)}
                placeholder="الكمية"
                className="sm:col-span-2 p-2 bg-white border border-gray-300 rounded-xl text-xs text-center font-mono"
              />
              <input
                type="number"
                min={0}
                value={customItemPrice || ''}
                onChange={(e) => setCustomItemPrice(Number(e.target.value) || 0)}
                placeholder="السعر ج.م"
                className="sm:col-span-2 p-2 bg-white border border-gray-300 rounded-xl text-xs text-center font-mono"
              />
              <button
                type="button"
                onClick={addCustomRow}
                className="sm:col-span-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold py-2 px-3 flex items-center justify-center gap-1"
              >
                <Plus size={14} />
                <span>إضافة</span>
              </button>
            </div>
          </div>

          {/* Order Items Table */}
          {items.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-2.5">الصنف</th>
                    <th className="p-2.5 text-center w-24">الكمية</th>
                    <th className="p-2.5 text-center w-32">سعر الوحدة</th>
                    <th className="p-2.5 text-left w-28">الإجمالي</th>
                    <th className="p-2.5 text-center w-12">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, idx) => {
                    const rowTotal = (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0);
                    return (
                      <tr key={idx}>
                        <td className="p-2.5">
                          <span className="font-bold text-gray-900 block">{it.nameAr}</span>
                          {it.unifiedCode && (
                            <span className="text-[10px] font-mono text-gray-500">{it.unifiedCode}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min={1}
                            value={it.quantity || 1}
                            onChange={(e) => {
                              const qty = Math.max(1, Number(e.target.value) || 1);
                              setItems((prev) =>
                                prev.map((row, i) =>
                                  i === idx
                                    ? { ...row, quantity: qty, totalItemPrice: qty * (row.unitPrice || 0) }
                                    : row
                                )
                              );
                            }}
                            className="w-16 p-1 text-center border border-gray-300 rounded-lg font-mono font-bold tabular-nums"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min={0}
                            value={it.unitPrice || ''}
                            onChange={(e) => {
                              const price = Math.max(0, Number(e.target.value) || 0);
                              setItems((prev) =>
                                prev.map((row, i) =>
                                  i === idx
                                    ? { ...row, unitPrice: price, totalItemPrice: (row.quantity || 1) * price }
                                    : row
                                )
                              );
                            }}
                            placeholder="0"
                            className="w-24 p-1 text-center border border-blue-200 bg-blue-50/40 rounded-lg font-mono font-bold tabular-nums"
                          />
                        </td>
                        <td className="p-2.5 text-left font-mono font-black text-blue-950 tabular-nums">
                          {rowTotal.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">موعد التسليم والملاحظات</label>
              <input
                type="text"
                value={deliveryTimeWindow}
                onChange={(e) => setDeliveryTimeWindow(e.target.value)}
                placeholder="مثال: التوصيل خلال 48 ساعة"
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
              />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات إضافية للمندوب أو العميل..."
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold">مجموع الأصناف:</span>
                <span className="font-mono font-bold tabular-nums">
                  {itemsSubtotal.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold flex items-center gap-1">
                  <Truck size={13} />
                  <span>مصاريف الشحن:</span>
                </span>
                <input
                  type="number"
                  min={0}
                  value={deliveryFee || ''}
                  onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 p-1 text-center border border-gray-300 rounded-lg font-mono font-bold bg-white tabular-nums"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold flex items-center gap-1">
                  <Tag size={13} />
                  <span>خصم خاص:</span>
                </span>
                <input
                  type="number"
                  min={0}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 p-1 text-center border border-gray-300 rounded-lg font-mono font-bold bg-white text-emerald-700 tabular-nums"
                />
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-blue-950">
                <span>الإجمالي النهائي المطلوب:</span>
                <span className="font-mono text-emerald-700 tabular-nums">
                  {grandTotal.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
          >
            إلغاء
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>حفظ الطلب فقط</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(true)}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} className="text-yellow-300" />}
              <span>حفظ واستخراج كارت الفاتورة PDF فوراً</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
