import React, { useState, useEffect } from 'react';
import type { FirebaseOrder } from '../types/firebase';
import { orderService } from '../supabase/orders.service';
import { productService } from '../supabase/products.service';
import { InvoiceCardModal } from './InvoiceCardModal';
import type { OrderInvoiceData, OrderItemInvoice } from '../services/invoice-to-whatsapp';
import { normalizeWhatsAppNumber } from '../services/whatsapp-order';
import type { FirebaseProduct } from '../types/firebase';
import { 
  FileText, 
  PhoneCall, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Package, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Truck, 
  Calendar,
  AlertCircle,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Save,
  X
} from 'lucide-react';

interface OrdersTabProps {
  orders: FirebaseOrder[];
  onRefresh?: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders: initialOrders, onRefresh }) => {
  const [ordersList, setOrdersList] = useState<FirebaseOrder[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'quoted' | 'partially_accepted' | 'confirmed' | 'dispatched' | 'delivered'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<OrderInvoiceData | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [quoteDraft, setQuoteDraft] = useState<OrderInvoiceData | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<FirebaseProduct[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);

  useEffect(() => {
    setOrdersList(initialOrders);
  }, [initialOrders]);

  const fetchLatestOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll();
      setOrdersList(data);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: FirebaseOrder['status']) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      setOrdersList((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (e: any) {
      alert('تعذر تحديث حالة الطلب: ' + e.message);
    }
  };

  const handleSavePrice = async (orderId: string) => {
    const val = Number(priceInput);
    if (isNaN(val)) return;
    try {
      await orderService.updateTotalPrice(orderId, val);
      setOrdersList((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, totalPrice: val } : o))
      );
      setEditingPriceId(null);
    } catch (e: any) {
      alert('تعذر تحديث السعر: ' + e.message);
    }
  };

  const openInvoiceForOrder = (order: FirebaseOrder) => {
    const itemsPayload = (order as any).items || {};
    const orderedItems = itemsPayload.orderedItems || [
      {
        nameAr: order.productNameAr || 'جهاز منزلي',
        quantity: order.quantity || 1,
        brand: 'طنطاوي جروب',
        size: order.selectedSize,
        color: order.selectedColor
      }
    ];

    const invoice: OrderInvoiceData = {
      orderId: order.orderId,
      customerName: order.customerName,
      phonePrimary: order.customerPhone,
      phoneSecondary: itemsPayload.phoneSecondary || undefined,
      deliveryAddress: itemsPayload.deliveryAddress || 'عنوان غير محدد',
      city: itemsPayload.city || undefined,
      landmark: itemsPayload.landmark || undefined,
      deliveryTimeWindow: itemsPayload.deliveryTimeWindow || order.selectedSize || undefined,
      notes: itemsPayload.notes || undefined,
      items: orderedItems.filter((item: OrderItemInvoice) => item.decision !== 'rejected'),
      totalPrice: order.totalPrice || undefined,
      createdAt: new Date(order.createdAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: order.status
    };

    setSelectedInvoice(invoice);
  };

  const openQuoteEditor = async (order: FirebaseOrder) => {
    const itemsPayload = order.items || {};
    const orderItems = Array.isArray(itemsPayload.orderedItems) && itemsPayload.orderedItems.length > 0
      ? itemsPayload.orderedItems
      : [{
          nameAr: order.productNameAr || 'منتج من الطلب',
          quantity: order.quantity || 1,
          unitPrice: order.totalPrice > 0 ? order.totalPrice / Math.max(order.quantity || 1, 1) : undefined,
          decision: 'pending' as const,
        }];
    setQuoteDraft({
      orderId: order.orderId,
      customerName: order.customerName,
      phonePrimary: order.customerPhone,
      phoneSecondary: itemsPayload.phoneSecondary || undefined,
      deliveryAddress: itemsPayload.deliveryAddress || (order as any).address || '',
      city: itemsPayload.city || undefined,
      landmark: itemsPayload.landmark || undefined,
      deliveryTimeWindow: itemsPayload.deliveryTimeWindow || order.selectedSize || '',
      notes: itemsPayload.notes || undefined,
      items: orderItems.map((item: OrderItemInvoice) => ({
        ...item,
        unitPrice: item.unitPrice === undefined ? undefined : Number(item.unitPrice),
        decision: item.decision || 'pending',
      })),
      totalPrice: order.totalPrice || 0,
      createdAt: new Date(order.createdAt).toLocaleString('ar-EG'),
    });
    setEditingQuoteId(order.id || null);
    setCatalogSearch('');

    if (catalogProducts.length === 0) {
      try {
        setCatalogProducts(await productService.getAll());
      } catch (error: any) {
        alert(`تعذر تحميل كتالوج المنتجات: ${error.message}`);
      }
    }
  };

  const addCatalogProduct = (product: FirebaseProduct) => {
    if (!quoteDraft) return;
    const item: OrderItemInvoice = {
      nameAr: product.nameAr,
      itemNumber: product.itemNumber,
      brand: product.brand,
      quantity: 1,
      image: product.imageUrl,
      unitPrice: undefined,
      decision: 'pending',
    };
    setQuoteDraft({ ...quoteDraft, items: [...quoteDraft.items, item] });
  };

  const saveQuote = async (order: FirebaseOrder) => {
    if (!quoteDraft || !order.id || savingQuote) return;
    const activeItems = quoteDraft.items.filter((item) => item.decision !== 'rejected');
    if (activeItems.length === 0) {
      alert('لا يمكن إصدار عرض سعر بدون أصناف. غيّر حالة الطلب إلى ملغي إذا رفض العميل كل الأصناف.');
      return;
    }
    if (activeItems.some((item) => item.unitPrice === undefined || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
      alert('أدخل سعرًا صحيحًا لكل صنف غير مرفوض قبل حفظ عرض السعر.');
      return;
    }

    const totalPrice = activeItems.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);
    const itemsPayload = order.items || {};
    const quoteHistory = Array.isArray(itemsPayload.quoteHistory) ? itemsPayload.quoteHistory : [];
    const snapshot = {
      version: quoteHistory.length + 1,
      createdAt: new Date().toISOString(),
      items: quoteDraft.items,
      totalPrice,
      deliveryTimeWindow: quoteDraft.deliveryTimeWindow || '',
    };
    const updatedItems = {
      ...itemsPayload,
      deliveryTimeWindow: quoteDraft.deliveryTimeWindow || '',
      orderedItems: quoteDraft.items,
      quoteHistory: [...quoteHistory, snapshot],
    };
    const acceptedCount = activeItems.filter((item) => item.decision === 'accepted').length;
    const rejectedCount = quoteDraft.items.filter((item) => item.decision === 'rejected').length;
    const status: FirebaseOrder['status'] = acceptedCount > 0 && rejectedCount > 0
      ? 'partially_accepted'
      : acceptedCount === activeItems.length && rejectedCount === 0
        ? 'confirmed'
        : acceptedCount > 0
          ? 'partially_accepted'
          : 'quoted';

    setSavingQuote(true);
    try {
      await orderService.updateQuote(
        order.id,
        updatedItems,
        totalPrice,
        status,
        activeItems.map((item) => item.nameAr).slice(0, 3).join('، '),
        activeItems.reduce((sum, item) => sum + item.quantity, 0),
        quoteDraft.deliveryTimeWindow || ''
      );
      const updatedOrder = { ...order, items: updatedItems, totalPrice, status };
      setOrdersList((prev) => prev.map((item) => item.id === order.id ? updatedOrder : item));
      setQuoteDraft({ ...quoteDraft, items: updatedItems.orderedItems, totalPrice });
      setEditingQuoteId(null);
      setSelectedInvoice({ ...quoteDraft, items: activeItems, totalPrice });
    } catch (error: any) {
      alert(`تعذر حفظ عرض السعر: ${error.message}`);
    } finally {
      setSavingQuote(false);
    }
  };

  const filteredOrders = ordersList.filter((o) => {
    const matchesSearch =
      o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={24} />
            <span>إدارة طلبات وفواتير العملاء (مربوطة بقاعدة البيانات مباشرة)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            متابعة كروت الفواتير الواردة، أرقام تليفونات العملاء، مواعيد وعناوين التوصيل، وتأكيد الأسعار
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLatestOrders}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>تحديث الطلبات من الخادم 🔄</span>
          </button>
          <span className="bg-blue-900 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs">
            {ordersList.length} طلب إجمالي
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الطلب، اسم العميل، أو التليفون..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-none font-medium"
          />
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'pending', label: 'قيد التسعير ⏳' },
            { id: 'quoted', label: 'عرض السعر أُرسل' },
            { id: 'partially_accepted', label: 'موافقة جزئية' },
            { id: 'confirmed', label: 'تم الاتفاق وتأكيد السعر ✍️' },
            { id: 'dispatched', label: 'خرج للتوصيل 🚚' },
            { id: 'delivered', label: 'تم التسليم بنجاح ✅' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === tab.id
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Cards List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <AlertCircle size={44} className="text-gray-300 mx-auto" />
          <h4 className="text-base font-bold text-gray-700">لا توجد طلبات مطابقة</h4>
          <p className="text-xs text-gray-400">
            عند قيام أي عميل بطلب أوردر واستخراج كارت فاتورة ستظهر جميع بياناته هنا فوراً.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const itemsPayload = (o as any).items || {};
            const orderedItems = Array.isArray(itemsPayload.orderedItems) ? itemsPayload.orderedItems : [];
            const orderItemsText = orderedItems.length > 0
              ? orderedItems.map((item: any) => `- ${item.nameAr} × ${item.quantity}`).join('\n')
              : `- ${o.productNameAr} × ${o.quantity}`;
            const phoneSec = itemsPayload.phoneSecondary;
            const landmark = itemsPayload.landmark;
            const deliveryWindow = itemsPayload.deliveryTimeWindow || o.selectedSize;
            const address = itemsPayload.deliveryAddress || (o as any).address;
            const city = itemsPayload.city;

            return (
              <div
                key={o.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 shadow-sm p-5 space-y-4 transition"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black bg-blue-950 text-white px-3 py-1 rounded-lg">
                      #{o.orderId}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">{o.customerName}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                        <Calendar size={12} />
                        <span>{new Date(o.createdAt).toLocaleString('ar-EG')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={o.status}
                      onChange={(e) => handleUpdateStatus(o.id || '', e.target.value as any)}
                      className={`text-xs font-black px-3 py-1.5 rounded-xl border outline-none cursor-pointer ${
                        o.status === 'pending'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : o.status === 'confirmed'
                          ? 'bg-blue-50 text-blue-900 border-blue-300'
                          : o.status === 'dispatched'
                          ? 'bg-purple-50 text-purple-900 border-purple-300'
                          : o.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-red-50 text-red-900 border-red-300'
                      }`}
                    >
                      <option value="pending">قيد المراجعة والإفادة بالأسعار</option>
                      <option value="quoted">تم إرسال عرض السعر للعميل</option>
                      <option value="partially_accepted">موافقة جزئية / تعديل مطلوب</option>
                      <option value="confirmed">تم تأكيد السعر مع العميل</option>
                      <option value="dispatched">تم خروج الشحنة مع المندوب</option>
                      <option value="delivered">تم تسليم الأوردر وتحصيل القيمة</option>
                      <option value="cancelled">ملغي</option>
                    </select>

                    <button
                      onClick={() => void openQuoteEditor(o)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                    >
                      <Edit3 size={13} />
                      <span>تسعير الأصناف</span>
                    </button>
                    <button
                      onClick={() => openInvoiceForOrder(o)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                      title="عرض كارت الفاتورة الرسمي وطباعته كـ PDF"
                    >
                      <Eye size={13} />
                      <span>عرض كارت الفاتورة PDF 📄</span>
                    </button>
                  </div>
                </div>

                {editingQuoteId === o.id && quoteDraft && (
                  <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="min-w-[220px] flex-1 text-xs font-bold text-gray-700">
                        البحث في الكتالوج بالاسم أو الكود
                        <input
                          value={catalogSearch}
                          onChange={(event) => setCatalogSearch(event.target.value)}
                          placeholder="اسم المنتج أو كوده"
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal"
                        />
                      </label>
                      <label className="min-w-[180px] text-xs font-bold text-gray-700">
                        مدة التوصيل المؤكدة
                        <input
                          value={quoteDraft.deliveryTimeWindow || ''}
                          onChange={(event) => setQuoteDraft({ ...quoteDraft, deliveryTimeWindow: event.target.value })}
                          placeholder="مثال: خلال 24 إلى 48 ساعة"
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal"
                        />
                      </label>
                    </div>

                    {catalogSearch.trim() && (
                      <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                        {catalogProducts
                          .filter((product) => `${product.nameAr} ${product.itemNumber || ''}`.toLowerCase().includes(catalogSearch.trim().toLowerCase()))
                          .slice(0, 12)
                          .map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => addCatalogProduct(product)}
                              className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-right hover:bg-blue-50"
                            >
                              <img src={product.imageUrl || '/logo.png'} alt="" className="h-10 w-10 rounded-md border border-gray-200 object-contain" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-bold text-gray-900">{product.nameAr}</span>
                                <span className="text-[10px] text-gray-500">كود داخلي: {product.itemNumber || product.id}</span>
                              </span>
                              <Plus size={16} className="text-blue-700" />
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      {quoteDraft.items.map((item, index) => (
                        <div key={`${item.nameAr}-${index}`} className="grid grid-cols-1 items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_90px_110px_130px_32px]">
                          <div className="flex min-w-0 items-center gap-2">
                            {item.image && <img src={item.image} alt="" className="h-11 w-11 rounded-md border border-gray-200 object-contain" />}
                            <div className="min-w-0">
                              <div className="truncate text-xs font-black text-gray-900">{item.nameAr}</div>
                              <div className="text-[10px] text-blue-800">كود داخلي: {item.unifiedCode || item.itemNumber || 'غير محدد'}</div>
                            </div>
                          </div>
                          <label className="text-[10px] font-bold text-gray-500">الكمية
                            <input type="number" min="1" value={item.quantity} onChange={(event) => setQuoteDraft({ ...quoteDraft, items: quoteDraft.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) } : entry) })} className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs text-gray-900" />
                          </label>
                          <label className="text-[10px] font-bold text-gray-500">سعر الوحدة
                            <input type="number" min="0" value={item.unitPrice ?? ''} onChange={(event) => setQuoteDraft({ ...quoteDraft, items: quoteDraft.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, unitPrice: event.target.value === '' ? undefined : Number(event.target.value) } : entry) })} className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs text-gray-900" />
                          </label>
                          <label className="text-[10px] font-bold text-gray-500">رد العميل
                            <select value={item.decision || 'pending'} onChange={(event) => setQuoteDraft({ ...quoteDraft, items: quoteDraft.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, decision: event.target.value as OrderItemInvoice['decision'] } : entry) })} className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900">
                              <option value="pending">بانتظار الرد</option>
                              <option value="accepted">موافق</option>
                              <option value="rejected">مرفوض / استبدال</option>
                            </select>
                          </label>
                          <button type="button" onClick={() => setQuoteDraft({ ...quoteDraft, items: quoteDraft.items.filter((_, itemIndex) => itemIndex !== index) })} className="p-1 text-red-600 hover:bg-red-50" title="حذف الصنف من عرض السعر"><Trash2 size={15} /></button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-200 pt-3">
                      <strong className="text-sm text-blue-950">
                        الإجمالي: {quoteDraft.items.filter((item) => item.decision !== 'rejected').reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0)} جنيه
                      </strong>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setEditingQuoteId(null); setQuoteDraft(null); }} className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700"><X size={14} />إلغاء</button>
                        <button type="button" disabled={savingQuote} onClick={() => void saveQuote(o)} className="flex items-center gap-1 rounded-lg bg-blue-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><Save size={14} />{savingQuote ? 'جاري الحفظ...' : 'حفظ العرض وإصداره'}</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details Grid: Phones, Delivery, Landmark */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/80 p-3.5 rounded-xl text-xs">
                  {/* Phones */}
                  <div className="space-y-1">
                    <span className="text-gray-500 font-bold block text-[11px]">أرقام التواصل:</span>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <strong className="font-mono text-blue-900 text-xs font-black" dir="ltr">
                        {o.customerPhone}
                      </strong>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded font-bold">أساسي</span>
                      <a
                        href={`tel:${o.customerPhone}`}
                        className="p-1 bg-white hover:bg-blue-50 rounded border border-gray-200 text-blue-700"
                        title="اتصال هاتفي"
                      >
                        <PhoneCall size={12} />
                      </a>
                      <a
                        href={`https://wa.me/${normalizeWhatsAppNumber(o.customerPhone)}?text=${encodeURIComponent(
                          `السلام عليكم أ/ ${o.customerName}، بخصوص طلبك رقم #${o.orderId}:\n${orderItemsText}\n${o.totalPrice > 0 ? `إجمالي السعر: ${o.totalPrice} جنيه.` : 'جاري مراجعة الأسعار وسيتم إرسال عرض السعر لحضرتك.'}\nمع تحيات فريق مبيعات طنطاوي جروب.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                        title="فتح واتساب لإرسال تفاصيل الطلب والسعر المسجل"
                      >
                        <MessageCircle size={12} />
                        <span>إرسال السعر واتساب 💬</span>
                      </a>
                    </div>

                    {phoneSec && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-200/60">
                        <strong className="font-mono text-emerald-900 text-xs font-black" dir="ltr">
                          {phoneSec}
                        </strong>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">بديل</span>
                        <a
                          href={`tel:${phoneSec}`}
                          className="p-1 bg-white hover:bg-blue-50 rounded border border-gray-200 text-blue-700"
                          title="اتصال بالهاتف البديل"
                        >
                          <PhoneCall size={12} />
                        </a>
                        <a
                          href={`https://wa.me/2${phoneSec.replace(/^0+/, '')}?text=${encodeURIComponent(
                            `السلام عليكم ورحمة الله أستاذ/ة ${o.customerName}، مع حضرتك مبيعات طنطاوي جروب بخصوص طلبك رقم #${o.orderId}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded font-bold text-[10px] flex items-center gap-1"
                        >
                          <MessageCircle size={11} />
                          <span>واتساب بديل</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Address & Landmark */}
                  <div className="space-y-1">
                    <span className="text-gray-500 font-bold block text-[11px] flex items-center gap-1">
                      <MapPin size={12} className="text-red-500" />
                      <span>عنوان ومكان التوصيل:</span>
                    </span>
                    <p className="font-bold text-gray-800">
                      {city ? `${city} - ` : ''}{address || 'تم التسجيل في تفاصيل الطلب'}
                    </p>
                    {landmark && (
                      <p className="text-[11px] text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded-sm inline-block">
                        علامة مميزة: {landmark}
                      </p>
                    )}
                  </div>

                  {/* Delivery window & Total Price */}
                  <div className="space-y-1">
                    <span className="text-gray-500 font-bold block text-[11px] flex items-center gap-1">
                      <Clock size={12} className="text-blue-600" />
                      <span>مدة التوصيل المطلوبة:</span>
                    </span>
                    <strong className="text-gray-800 block">{deliveryWindow || 'غير محدد'}</strong>

                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-gray-500 text-[11px]">إجمالي الفاتورة:</span>
                      {editingPriceId === o.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            placeholder="المبلغ"
                            className="w-20 p-1 border rounded text-xs font-mono font-bold"
                          />
                          <button
                            onClick={() => handleSavePrice(o.id || '')}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                          >
                            حفظ
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <strong className="font-mono font-black text-sm text-blue-950">
                            {o.totalPrice ? `${o.totalPrice} ج.م` : 'بانتظار التسعير'}
                          </strong>
                          <button
                            onClick={() => {
                              setEditingPriceId(o.id || null);
                              setPriceInput(String(o.totalPrice || ''));
                            }}
                            className="text-gray-400 hover:text-blue-700"
                            title="تعديل السعر النهائي"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="flex items-center justify-between text-xs text-gray-700 bg-blue-50/40 p-2.5 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-blue-900" />
                    <span className="font-bold">بيان الأصناف:</span>
                    <span>{o.productNameAr}</span>
                  </div>
                  <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                    العدد: {o.quantity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Card Popup View */}
      {selectedInvoice && (
        <InvoiceCardModal
          isOpen={Boolean(selectedInvoice)}
          order={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};