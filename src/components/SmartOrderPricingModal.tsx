import React, { useState, useEffect, useRef } from 'react';
import type { FirebaseOrder } from '../types/firebase';
import { orderService } from '../supabase/orders.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  OrderItemInvoice, 
  OrderInvoiceData, 
  sendFinalInvoiceToCustomerWhatsApp,
  generateFinalCustomerInvoiceMessage 
} from '../services/invoice-to-whatsapp';
import { 
  X, 
  Save, 
  Send, 
  Printer, 
  Trash2, 
  Plus, 
  PhoneCall, 
  MessageCircle, 
  Building2, 
  MapPin, 
  Calendar, 
  Package, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  DollarSign,
  Tag,
  Copy,
  Clock,
  ShieldCheck,
  FileDown,
  Loader2,
  QrCode
} from 'lucide-react';
import { normalizeWhatsAppNumber } from '../services/whatsapp-order';
import { useApp } from '../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: FirebaseOrder | null;
  onOrderUpdated: (updatedOrder: FirebaseOrder) => void;
}

export const SmartOrderPricingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
}) => {
  const { products: storeProducts } = useApp();
  if (!isOpen || !order) return null;

  // Extract nested items and metadata
  const rawItemsData = (order as any).items || {};
  const initialOrderedItems: OrderItemInvoice[] = Array.isArray(rawItemsData.orderedItems)
    ? rawItemsData.orderedItems
    : Array.isArray(rawItemsData)
    ? rawItemsData
    : [
        {
          nameAr: order.productNameAr || 'جهاز منزلي',
          quantity: order.quantity || 1,
          brand: 'طنطاوي جروب',
          size: order.selectedSize,
          color: order.selectedColor,
          unitPrice: order.totalPrice ? Math.round(order.totalPrice / (order.quantity || 1)) : 0,
        },
      ];

  const [items, setItems] = useState<OrderItemInvoice[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [status, setStatus] = useState<FirebaseOrder['status']>(order.status || 'pending');
  const [notes, setNotes] = useState<string>(rawItemsData.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // PDF Export Reference and State
  const invoiceCardRef = useRef<HTMLDivElement>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState(false);

  // New item draft row
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  useEffect(() => {
    // Initialize items with unitPrice and quantity
    const prepared = initialOrderedItems.map((item) => ({
      ...item,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      totalItemPrice: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    }));
    setItems(prepared);
    setDeliveryFee(Number(rawItemsData.deliveryFee) || 0);
    setDiscount(Number(rawItemsData.discount) || 0);
    setStatus(order.status || 'pending');
    setNotes(rawItemsData.notes || '');
  }, [order]);

  // Calculations
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    0
  );
  const grandTotal = Math.max(0, itemsSubtotal + Number(deliveryFee || 0) - Number(discount || 0));
  const totalItemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const contactPreference = rawItemsData.contactPreference || 'whatsapp';
  const phoneSecondary = rawItemsData.phoneSecondary;
  const deliveryAddress = rawItemsData.deliveryAddress || order.customerAddress || 'عنوان العميل';
  const city = rawItemsData.city;
  const landmark = rawItemsData.landmark;
  const deliveryTimeWindow = rawItemsData.deliveryTimeWindow || 'من يومين إلى 7 أيام عمل';

  // Handle changing an item's unit price
  const handlePriceChange = (index: number, newPrice: number) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const validPrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
        return {
          ...it,
          unitPrice: validPrice,
          totalItemPrice: validPrice * (it.quantity || 1),
        };
      })
    );
  };

  // Handle changing an item's quantity
  const handleQuantityChange = (index: number, newQty: number) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const validQty = Math.max(1, isNaN(newQty) ? 1 : newQty);
        return {
          ...it,
          quantity: validQty,
          totalItemPrice: (it.unitPrice || 0) * validQty,
        };
      })
    );
  };

  // Delete an item if customer cancelled it
  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      if (!confirm('هذا هو الصنف الوحيد في الأوردر. هل تريد بالتأكيد حذفه وإلغاء الطلب؟')) return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add new item to order
  const handleAddNewItem = () => {
    if (!newItemName.trim()) {
      alert('يرجى كتابة اسم الجهاز أو الصنف');
      return;
    }
    const created: OrderItemInvoice = {
      nameAr: newItemName.trim(),
      unifiedCode: newItemCode.trim() || undefined,
      quantity: Math.max(1, Number(newItemQty) || 1),
      unitPrice: Math.max(0, Number(newItemPrice) || 0),
      totalItemPrice: (Math.max(1, Number(newItemQty) || 1)) * (Math.max(0, Number(newItemPrice) || 0)),
      brand: 'طنطاوي جروب',
    };
    setItems((prev) => [...prev, created]);
    setNewItemName('');
    setNewItemCode('');
    setNewItemQty(1);
    setNewItemPrice(0);
    setShowAddItem(false);
  };

  // Save changes to Supabase database
  const handleSaveChanges = async (targetStatus?: FirebaseOrder['status']) => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const finalStatus = targetStatus || status;
      const updatedPayload = {
        ...rawItemsData,
        orderedItems: items,
        itemsSubtotal,
        deliveryFee: Number(deliveryFee) || 0,
        discount: Number(discount) || 0,
        totalPrice: grandTotal,
        notes,
      };

      const summaryAr = items
        .map((i) => `${i.nameAr} (عدد ${i.quantity})`)
        .slice(0, 3)
        .join('، ') + (items.length > 3 ? ` و${items.length - 3} أصناف أخرى` : '');

      if (order.id) {
        await orderService.updateOrderFull(order.id, {
          totalPrice: grandTotal,
          status: finalStatus,
          quantity: totalItemCount,
          productNameAr: summaryAr || order.productNameAr,
          items: updatedPayload,
        });
      }

      const updatedOrderObj: FirebaseOrder = {
        ...order,
        status: finalStatus,
        totalPrice: grandTotal,
        quantity: totalItemCount,
        productNameAr: summaryAr || order.productNameAr,
        items: updatedPayload as any,
      };

      onOrderUpdated(updatedOrderObj);
      setStatus(finalStatus);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      console.error('Error updating order:', e);
      alert('حدث خطأ أثناء حفظ التعديلات: ' + (e.message || 'يرجى المحاولة ثانية'));
    } finally {
      setIsSaving(false);
    }
  };

  // Build full OrderInvoiceData for sending and printing
  const buildCurrentInvoiceData = (): OrderInvoiceData => {
    return {
      orderId: order.orderId,
      customerName: order.customerName,
      phonePrimary: order.customerPhone,
      phoneSecondary,
      contactPreference,
      deliveryAddress,
      city,
      landmark,
      deliveryTimeWindow,
      notes,
      items,
      itemsSubtotal,
      deliveryFee,
      discount,
      totalPrice: grandTotal,
      createdAt: new Date(order.createdAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status,
    };
  };

  // Send the finalized priced invoice to customer on WhatsApp
  const handleSendToCustomer = async () => {
    // First auto-save if needed
    await handleSaveChanges('priced');
    const invoice = buildCurrentInvoiceData();
    sendFinalInvoiceToCustomerWhatsApp(invoice);
  };

  // Copy invoice text
  const handleCopyText = () => {
    const invoice = buildCurrentInvoiceData();
    const text = generateFinalCustomerInvoiceMessage(invoice);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Direct print
  const handlePrint = () => {
    window.print();
  };

  // Professional PDF Export using jsPDF and html2canvas
  const handleExportPDF = async () => {
    if (!invoiceCardRef.current) return;
    try {
      setIsExportingPDF(true);
      // Wait for state update to flush clean read-only elements
      await new Promise((r) => setTimeout(r, 120));

      const element = invoiceCardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pdfHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
          heightLeft -= (pdfHeight - margin * 2);
        }
      }

      const orderIdentifier = order.orderId || (order as any).unifiedCode || order.id || 'طلب';
      pdf.save(`كارت_فاتورة_طنطاوي_جروب_${orderIdentifier}.pdf`);
      setPdfExportSuccess(true);
      setTimeout(() => setPdfExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-400 text-blue-950 rounded-xl font-bold">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>كارت الفاتورة والتسعير الذكي للأوردر</span>
                <span className="font-mono text-yellow-300 text-xs sm:text-sm">#{order.orderId}</span>
              </h3>
              <p className="text-[11px] text-gray-300">
                تسجيل أسعار الأصناف، تعديل الكميات، تصدير الفاتورة PDF ككارت ذكي، وإرسالها للعميل
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition text-gray-300 hover:text-white"
            title="إغلاق النافذة"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-right font-['Cairo',sans-serif] print:p-2">
          
          {/* Printable Official Tantawy Header (Shown on print & screen & PDF) */}
          <div 
            ref={invoiceCardRef}
            className="border-2 border-blue-900/30 rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-blue-50/30 to-white relative shadow-xs"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-blue-900/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-auto bg-white p-1 rounded-xl shadow-xs border border-gray-200 flex items-center justify-center">
                  <img src="/logo.png" alt="Tantawy Logo" className="h-full w-auto object-contain" />
                </div>
                <div>
                  <h4 className="text-base font-black text-blue-950 flex items-center gap-1.5">
                    <span>طنطاوي جروب للأجهزة المنزلية والكهربية</span>
                    <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-sm">مصر</span>
                  </h4>
                  <p className="text-[10px] text-gray-500 font-bold">
                    TANTAWY GROUP - كارت فاتورة معتمد ودفع عند الاستلام
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <div className="bg-blue-950 text-white px-3 py-1 rounded-lg text-xs font-mono font-black inline-block">
                  رقم الفاتورة: #{order.orderId}
                </div>
                <div className="text-[11px] text-gray-500 font-bold flex items-center justify-center sm:justify-start gap-1">
                  <Calendar size={12} />
                  <span>تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </div>

            {/* Customer Contact & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-1">
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs space-y-2 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="font-black text-blue-900 flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-700" />
                    <span>بيانات العميل المستلم:</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    contactPreference === 'whatsapp' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : contactPreference === 'call' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {contactPreference === 'whatsapp' ? '🟢 يفضل التواصل واتساب' : contactPreference === 'call' ? '📞 يفضل اتصال هاتفي' : '📱 واتساب أو اتصال'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-[11px]">اسم العميل:</span>
                    <strong className="text-gray-900 font-black">{order.customerName}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-[11px]">الموبايل الأساسي:</span>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-blue-900 font-bold" dir="ltr">{order.customerPhone}</strong>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="p-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                        title="اتصال هاتفي بالعميل"
                      >
                        <PhoneCall size={13} />
                      </a>
                      <a
                        href={`https://wa.me/${normalizeWhatsAppNumber(order.customerPhone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                        title="محادثة واتساب مباشرة مع العميل"
                      >
                        <MessageCircle size={13} />
                      </a>
                    </div>
                  </div>

                  {phoneSecondary && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">الموبايل البديل:</span>
                      <strong className="font-mono text-emerald-800 font-bold" dir="ltr">{phoneSecondary}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs space-y-2 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="font-black text-blue-900 flex items-center gap-1.5">
                    <MapPin size={14} className="text-red-600" />
                    <span>عنوان وموعد التوصيل:</span>
                  </span>
                  <div className="print:hidden flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">الحالة:</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="text-[11px] font-bold p-1 bg-gray-50 border border-gray-300 rounded-lg outline-none"
                    >
                      <option value="pending">⏳ بانتظار التسعير</option>
                      <option value="priced">💵 تم التسعير وإرسال الفاتورة</option>
                      <option value="confirmed">✅ تم تأكيد الشراء من العميل</option>
                      <option value="dispatched">🚚 جاري التجهيز والشحن</option>
                      <option value="delivered">🎉 تم التسليم والاستلام</option>
                      <option value="cancelled">❌ ملغي من العميل</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-800">
                  <div>
                    <span className="text-gray-500 text-[11px]">العنوان: </span>
                    <strong className="text-gray-900">{city ? `${city} - ` : ''}{deliveryAddress}</strong>
                  </div>
                  {landmark && (
                    <div>
                      <span className="text-gray-500 text-[11px]">علامة مميزة: </span>
                      <strong className="text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-sm">{landmark}</strong>
                    </div>
                  )}
                  {deliveryTimeWindow && (
                    <div>
                      <span className="text-gray-500 text-[11px]">موعد التوصيل: </span>
                      <strong className="text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded-sm">{deliveryTimeWindow}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Items Table with Pricing Input */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Package size={15} className="text-blue-900" />
                  <span>جدول أصناف الأوردر والتسعير المعتمد ({items.length} صنف / {totalItemCount} قطعة):</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddItem(!showAddItem)}
                  className="print:hidden text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                >
                  <Plus size={14} />
                  <span>إضافة صنف للأوردر</span>
                </button>
              </div>

              {/* Add item collapsible row with Smart Catalog Suggestions */}
              {showAddItem && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2.5 print:hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-yellow-600" />
                      <span>إضافة جهاز أو صنف جديد لطلب العميل (من كتالوج طنطاوي جروب أو صنف مخصص):</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      ابحث بالاسم لتظهر اقتراحات من المنتجات الـ 3,824
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="relative sm:col-span-1">
                      <input
                        type="text"
                        placeholder="ابحث عن الصنف (مثال: حلة، شاشة، خلاط...)"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="كود الصنف (اختياري)"
                      value={newItemCode}
                      onChange={(e) => setNewItemCode(e.target.value)}
                      className="p-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold"
                    />

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-gray-600 font-bold">الكمية:</span>
                      <input
                        type="number"
                        min="1"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(Number(e.target.value) || 1)}
                        className="w-16 p-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-center"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-600 font-bold">السعر:</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="ج.م"
                        value={newItemPrice || ''}
                        onChange={(e) => setNewItemPrice(Number(e.target.value) || 0)}
                        className="w-24 p-2 bg-white border border-gray-300 rounded-xl text-xs font-bold font-mono text-center text-blue-950"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewItem}
                        className="bg-blue-900 hover:bg-blue-950 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 shadow-2xs"
                      >
                        إضافة +
                      </button>
                    </div>
                  </div>

                  {/* Top matching catalog suggestions */}
                  {newItemName.trim().length >= 2 && (
                    <div className="pt-1 border-t border-blue-200">
                      <span className="text-[10px] text-blue-900 font-bold block mb-1">
                        أقرب أصناف من الكتالوج (اضغط للاختيار التلقائي):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {storeProducts
                          .filter((p) => p.nameAr.toLowerCase().includes(newItemName.trim().toLowerCase()))
                          .slice(0, 5)
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setNewItemName(p.nameAr);
                                setNewItemCode(p.unifiedCode || p.itemNumber || '');
                                if (p.actualprice && p.actualprice > 0) {
                                  setNewItemPrice(p.actualprice);
                                }
                              }}
                              className="text-[11px] bg-white hover:bg-blue-100 text-blue-950 border border-blue-200 px-2 py-1 rounded-lg text-right font-medium transition flex items-center gap-1.5 shadow-2xs"
                            >
                              <span className="font-bold truncate max-w-[200px]">{p.nameAr}</span>
                              <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 rounded">{p.unifiedCode || p.brand}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-right text-xs">
                  <thead className="bg-blue-950 text-white font-bold">
                    <tr>
                      <th className="p-2.5 w-8">م</th>
                      <th className="p-2.5">اسم الصنف والمواصفات</th>
                      <th className="p-2.5">كود الصنف</th>
                      <th className="p-2.5 text-center w-28">الكمية</th>
                      <th className="p-2.5 text-center w-36">سعر الوحدة (ج.م)</th>
                      <th className="p-2.5 text-left w-28">إجمالي الصنف</th>
                      <th className="p-2.5 text-center w-10 print:hidden">إلغاء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => {
                      const itemTotal = (item.unitPrice || 0) * (item.quantity || 1);
                      return (
                        <tr key={idx} className="hover:bg-blue-50/30 transition">
                          <td className="p-2.5 font-bold text-gray-400">{idx + 1}</td>
                          <td className="p-2.5">
                            <strong className="text-gray-900 block">{item.nameAr}</strong>
                            <span className="text-[11px] text-gray-500 font-medium">
                              {[item.brand, item.size, item.color].filter(Boolean).join(' • ') || 'مواصفة قياسية'}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-blue-900 font-bold text-[11px]">
                            {item.unifiedCode || item.itemNumber || '-'}
                          </td>
                          <td className="p-2.5 text-center">
                            {isExportingPDF ? (
                              <span className="font-bold text-xs text-gray-900">{item.quantity || 1}</span>
                            ) : (
                              <>
                                <div className="inline-flex items-center gap-1 print:hidden">
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(idx, (item.quantity || 1) - 1)}
                                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs flex items-center justify-center"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity || 1}
                                    onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                                    className="w-12 p-1 text-center font-bold text-xs border border-gray-300 rounded bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(idx, (item.quantity || 1) + 1)}
                                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="hidden print:inline font-bold">{item.quantity}</span>
                              </>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            {isExportingPDF ? (
                              <span className="font-mono font-bold text-xs text-blue-950">
                                {item.unitPrice ? `${item.unitPrice.toLocaleString('ar-EG')} ج.م` : 'قيد التقدير'}
                              </span>
                            ) : (
                              <>
                                <div className="print:hidden">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="اكتب السعر..."
                                    value={item.unitPrice || ''}
                                    onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                                    className="w-28 p-1.5 text-center font-mono font-bold text-xs border-2 border-blue-200 focus:border-blue-600 rounded-lg bg-blue-50/40 text-blue-950 outline-none transition"
                                  />
                                </div>
                                <span className="hidden print:inline font-mono font-bold">
                                  {item.unitPrice ? `${item.unitPrice.toLocaleString('ar-EG')} ج.م` : 'قيد التقدير'}
                                </span>
                              </>
                            )}
                          </td>
                          <td className="p-2.5 text-left font-mono font-black text-blue-950">
                            {itemTotal > 0 ? `${itemTotal.toLocaleString('ar-EG')} ج.م` : '-'}
                          </td>
                          <td className="p-2.5 text-center print:hidden">
                            {!isExportingPDF && (
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(idx)}
                                className="p-1 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title="إلغاء هذا الصنف من الأوردر"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-400 font-bold">
                          تم إلغاء جميع أصناف الأوردر
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Breakdown (Subtotal, Shipping, Discount, Total) */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">ملاحظات الموظف / التوصيل:</label>
                {isExportingPDF ? (
                  <div className="p-2.5 text-xs bg-white border border-gray-200 rounded-xl min-h-[38px] text-gray-800">
                    {notes || 'الطلب مسعر ومعتمد وجاهز للتسليم والشحن المباشر مع إتاحة الفحص الكامل.'}
                  </div>
                ) : (
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي تفاصيل خاصة بتأكيد الأوردر أو موعد الشحن..."
                    className="w-full p-2.5 text-xs bg-white border border-gray-300 rounded-xl outline-none focus:ring-1 focus:ring-blue-600"
                  />
                )}
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">إجمالي قيمة الأصناف:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {itemsSubtotal.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium flex items-center gap-1">
                    <Truck size={13} className="text-blue-700" />
                    <span>مصاريف الشحن والتوصيل:</span>
                  </span>
                  {isExportingPDF ? (
                    <span className="font-mono font-bold text-xs text-gray-900">
                      {deliveryFee > 0 ? `${deliveryFee.toLocaleString('ar-EG')} ج.م` : 'شحن مجاني'}
                    </span>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 print:hidden">
                        <input
                          type="number"
                          min="0"
                          value={deliveryFee || ''}
                          onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20 p-1 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-lg"
                        />
                        <span className="text-[11px] text-gray-500">ج.م</span>
                      </div>
                      <span className="hidden print:inline font-mono font-bold">
                        {deliveryFee > 0 ? `${deliveryFee.toLocaleString('ar-EG')} ج.م` : 'شحن مجاني'}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium flex items-center gap-1">
                    <Tag size={13} className="text-emerald-700" />
                    <span>خصم خاص / تفاوض:</span>
                  </span>
                  {isExportingPDF ? (
                    <span className="font-mono font-bold text-xs text-emerald-700">
                      {discount > 0 ? `-${discount.toLocaleString('ar-EG')} ج.م` : '0 ج.م'}
                    </span>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 print:hidden">
                        <input
                          type="number"
                          min="0"
                          value={discount || ''}
                          onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20 p-1 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-lg text-emerald-800"
                        />
                        <span className="text-[11px] text-gray-500">ج.م</span>
                      </div>
                      <span className="hidden print:inline font-mono font-bold text-emerald-700">
                        {discount > 0 ? `-${discount.toLocaleString('ar-EG')} ج.م` : '0'}
                      </span>
                    </>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-sm sm:text-base font-black text-blue-950">
                  <span>الإجمالي النهائي المطلوب عند الاستلام:</span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {grandTotal.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* Official Security Verification Seal & Smart Card Stamp */}
            <div className="mt-4 pt-3 border-t-2 border-dashed border-blue-900/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-600 bg-blue-50/50 p-3 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 bg-white p-1 rounded-xl border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <QrCode size={28} className="text-blue-950" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-blue-950 text-xs">كارت فاتورة إلكتروني ذكي معتمد</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2 rounded">موثق ✓</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono font-bold mt-0.5">
                    TG-CARD-{order.orderId || (order as any).unifiedCode || 'VERIFIED'}
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-left space-y-0.5">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 size={13} />
                  <span>معاينة وفحص الجهاز بالكامل قبل دفع أي مبالغ للمندوب</span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  الخط الساخن لخدمة عملاء طنطاوي جروب: <strong className="text-blue-950">15218</strong>
                </div>
              </div>
            </div>

            {/* Terms and Hotline */}
            <div className="mt-3 pt-2 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500 font-bold">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>ضمان طنطاوي جروب الرسمي وضمان الوكيل المعتمد لجميع المحافظات</span>
              </div>
              <div className="text-blue-950 font-black">
                الخط الساخن الموحد: 15218
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions (Hidden when printing) */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isExportingPDF}
              onClick={handleExportPDF}
              className="bg-indigo-900 hover:bg-indigo-950 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
              title="تصدير كارت الفاتورة كملف PDF عالي الجودة للعميل"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 size={16} className="animate-spin text-yellow-400" />
                  <span>جارٍ تجهيز الـ PDF...</span>
                </>
              ) : (
                <>
                  <FileDown size={16} className="text-yellow-400" />
                  <span>تصدير الفاتورة PDF (كارت ذكي) 📄</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
              title="طباعة كارت الفاتورة"
            >
              <Printer size={15} />
              <span>طباعة 🖨️</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold text-xs px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
              title="نسخ نص الفاتورة الرسمية"
            >
              <Copy size={15} />
              <span>{copied ? 'تم النسخ ✅' : 'نسخ النص'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {pdfExportSuccess && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-indigo-200">
                <CheckCircle2 size={15} />
                <span>تم تحميل كارت الفاتورة PDF بنجاح! 📥</span>
              </span>
            )}

            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={16} />
                <span>تم الحفظ في قاعدة البيانات بنجاح!</span>
              </span>
            )}
            
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveChanges()}
              className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Save size={16} />
              <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ الأسعار 💾'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendToCustomer}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md"
              title="إرسال الفاتورة بعد التسعير لواتساب العميل مباشرة"
            >
              <Send size={16} />
              <span>إرسال الفاتورة للواتساب 📲</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
