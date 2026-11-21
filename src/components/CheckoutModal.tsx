import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { 
  X, 
  CheckCircle, 
  Truck, 
  ShieldCheck, 
  PhoneCall,
  MapPin,
  Sparkles,
  Send,
  Printer,
  Copy,
  Calendar,
  Building2,
  FileText,
  FileDown,
  Loader2,
  QrCode,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { OrderItem } from '../types';
import { OrderInvoiceData, sendInvoiceToWhatsApp, generateInvoiceMessage } from '../services/invoice-to-whatsapp';
import { orderService } from '../supabase/orders.service';
import { offlineStoreService, isLikelyOfflineError } from '../services/offline-store.service';
import { STOREFRONT_TEXT, getNumberLocale, getLocalizedProductName } from '../i18n/translations';

export const CheckoutModal: React.FC = () => {
  const { 
    isCheckoutModalOpen, 
    setIsCheckoutModalOpen, 
    cart, 
    clearCart,
    createOrder, 
    setActiveTab,
    setIsOrderTrackingOpen,
    setTrackingPhone,
    whatsappNumber,
    language,
  } = useApp();

  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].checkout;
  const numLocale = getNumberLocale(language);

  const [customerName, setCustomerName] = useState('');
  const [phonePrimary, setPhonePrimary] = useState('');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [contactPreference, setContactPreference] = useState<'whatsapp' | 'call' | 'both'>('whatsapp');
  const [city, setCity] = useState('القاهرة والجيزة');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const deliveryTimeWindow = isRtl ? 'من يومين إلى 7 أيام عمل' : '2–7 business days';
  const [notes, setNotes] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');

  const [completedOrder, setCompletedOrder] = useState<OrderItem | null>(null);
  const [invoiceData, setInvoiceData] = useState<OrderInvoiceData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState(false);
  const invoiceCardRef = useRef<HTMLDivElement>(null);

  if (!isCheckoutModalOpen) return null;

  const validateEgyptianPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return cleaned.length === 11 && /^01[0125]/.test(cleaned);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim() || !phonePrimary.trim() || !deliveryAddress.trim()) {
      setFormError(t.requiredAlert);
      return;
    }

    const cleanedPhone = phonePrimary.replace(/[^0-9]/g, '');
    if (!validateEgyptianPhone(cleanedPhone)) {
      setPhoneError(t.invalidPhoneAlert);
      return;
    }
    setPhoneError('');

    const fullAddress = `${city} - ${deliveryAddress}${landmark ? ` (${isRtl ? 'علامة مميزة:' : 'Landmark:'} ${landmark})` : ''} - ${cleanedPhone}${phoneSecondary ? ` / ${phoneSecondary}` : ''} - ${contactPreference} - ${deliveryTimeWindow}${notes ? ` - ${notes}` : ''}`;
    
    const order = createOrder(fullAddress, isRtl ? 'دفع عند الاستلام - طنطاوي جروب' : 'Cash on Delivery - Tantawy Group');

    if (order) {
      const generatedInvoice: OrderInvoiceData = {
        orderId: order.orderid,
        customerName: customerName.trim(),
        phonePrimary: cleanedPhone,
        phoneSecondary: phoneSecondary.trim() || undefined,
        contactPreference,
        deliveryAddress: deliveryAddress.trim(),
        city: city,
        landmark: landmark.trim() || undefined,
        deliveryTimeWindow: deliveryTimeWindow.trim() || undefined,
        notes: notes.trim() || undefined,
        items: cart.map(item => ({
          nameAr: getLocalizedProductName(item.product, language),
          itemNumber: item.product.itemNumber,
          unifiedCode: item.product.unifiedCode,
          size: item.selectedSize || item.product.size,
          color: item.product.color,
          brand: item.product.brand,
          quantity: item.quantity,
          image: item.product.previewimage
        })),
        createdAt: new Date().toLocaleDateString(numLocale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
      };

      setInvoiceData(generatedInvoice);
      setCompletedOrder(order);
      setTrackingPhone(cleanedPhone);
      clearCart();

      const primarySummary =
        generatedInvoice.items.length > 1
          ? `${generatedInvoice.items[0]?.nameAr} (+ ${generatedInvoice.items.length - 1})`
          : generatedInvoice.items[0]?.nameAr || order.nameAr;

      const isOfflineNow = typeof navigator !== 'undefined' && !navigator.onLine;
      void offlineStoreService.saveLocalOrder({
        orderId: generatedInvoice.orderId,
        customerName: generatedInvoice.customerName,
        customerPhone: generatedInvoice.phonePrimary,
        customerAddress: `${generatedInvoice.city} - ${generatedInvoice.deliveryAddress}`,
        productName: primarySummary,
        quantity: generatedInvoice.items.reduce((s, i) => s + (i.quantity || 1), 0),
        totalPrice: order.price || 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        pendingSync: isOfflineNow,
      });

      if (isOfflineNow) {
        void offlineStoreService.enqueueAction('invoice_order', generatedInvoice);
      } else {
        orderService.saveInvoiceOrder(generatedInvoice).catch((err) => {
          console.warn('Supabase order auto-save fallback:', err);
          if (isLikelyOfflineError(err)) {
            void offlineStoreService.saveLocalOrder({
              orderId: generatedInvoice.orderId,
              customerName: generatedInvoice.customerName,
              customerPhone: generatedInvoice.phonePrimary,
              customerAddress: `${generatedInvoice.city} - ${generatedInvoice.deliveryAddress}`,
              productName: primarySummary,
              quantity: generatedInvoice.items.reduce((s, i) => s + (i.quantity || 1), 0),
              totalPrice: order.price || 0,
              status: 'pending',
              createdAt: new Date().toISOString(),
              pendingSync: true,
            });
            void offlineStoreService.enqueueAction('invoice_order', generatedInvoice);
          }
        });
      }
    }
  };

  const handleSendWhatsApp = () => {
    if (invoiceData) {
      sendInvoiceToWhatsApp(invoiceData, whatsappNumber);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!invoiceCardRef.current || !invoiceData) return;
    try {
      setIsExportingPDF(true);
      await new Promise((r) => setTimeout(r, 120));

      const element = invoiceCardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        allowTaint: false,
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
        heightLeft -= pdfHeight - margin * 2;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight - margin * 2;
        }
      }

      pdf.save(`Dream_Tantawy_Invoice_${invoiceData.orderId}.pdf`);
      setPdfExportSuccess(true);
      setTimeout(() => setPdfExportSuccess(false), 4000);
    } catch (err) {
      console.error('Customer PDF Export Error:', err);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleCopy = () => {
    if (invoiceData) {
      const text = generateInvoiceMessage(invoiceData);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleFinish = () => {
    setCompletedOrder(null);
    setInvoiceData(null);
    setIsCheckoutModalOpen(false);
    setActiveTab('home');
  };

  const cityOptions = [
    { value: 'القاهرة والجيزة', label: isRtl ? 'القاهرة والجيزة' : 'Cairo & Giza' },
    { value: 'الإسكندرية والساحل', label: isRtl ? 'الإسكندرية والساحل' : 'Alexandria & North Coast' },
    { value: 'محافظات الدلتا', label: isRtl ? 'محافظات الدلتا' : 'Delta Governorates' },
    { value: 'محافظات القناة', label: isRtl ? 'محافظات القناة' : 'Canal Governorates' },
    { value: 'محافظات الصعيد', label: isRtl ? 'محافظات الصعيد' : 'Upper Egypt' },
    { value: 'كافة محافظات مصر', label: isRtl ? 'محافظة أخرى' : 'Other Governorate' },
  ];

  const isOfflineStatus = typeof navigator !== 'undefined' && !navigator.onLine;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white"
      onClick={() => {
        if (!completedOrder) setIsCheckoutModalOpen(false);
      }}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="text-yellow-400" size={20} />
            <h3 className="font-black text-sm sm:text-base">
              {completedOrder ? t.invoiceTitle : t.formTitle}
            </h3>
          </div>
          <button
            onClick={() => {
              if (completedOrder) handleFinish();
              else setIsCheckoutModalOpen(false);
            }}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition text-gray-300 hover:text-white"
            title={STOREFRONT_TEXT[language].about.close}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className={`flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 ${isRtl ? 'text-right' : 'text-left'} print:overflow-visible print:p-4`}>
          
          {completedOrder && invoiceData ? (
            <div className="space-y-6">
              
              {/* Success Banner */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-950 print:hidden">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h4 className="font-black text-sm">
                    {isOfflineStatus ? t.successOfflineTitle : t.successOnlineTitle}
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    {isOfflineStatus ? t.successOfflineSub : t.successOnlineSub}
                  </p>
                </div>
              </div>

              {/* Official Invoice Card */}
              <div
                ref={invoiceCardRef}
                className="border-4 border-double border-blue-950/35 rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-slate-50 via-white to-blue-50/30 relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-l from-blue-950 via-indigo-900 to-amber-500" />

                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
                  <Building2 size={220} className="text-blue-950" />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-blue-900/15 pb-4 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-auto bg-white p-1.5 rounded-xl shadow-xs border border-gray-200 flex items-center justify-center">
                      <img src="/logo.png" alt="Dream Tantawy Group Logo" className="h-full w-auto object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-black text-blue-950">
                          {STOREFRONT_TEXT[language].brandName}
                        </h2>
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md">
                          {isRtl ? 'معتمدة ✓' : 'Certified ✓'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 font-bold tracking-wide mt-0.5">
                        {isRtl
                          ? 'DREAM TANTAWY GROUP • للأجهزة المنزلية والكهربية'
                          : 'DREAM TANTAWY GROUP • Home & Electrical Appliances'}
                      </p>
                    </div>
                  </div>

                  <div className={`text-center ${isRtl ? 'sm:text-left' : 'sm:text-right'} space-y-1.5`}>
                    <div className="bg-blue-950 text-white px-3.5 py-1.5 rounded-xl text-xs font-mono font-black inline-block shadow-xs">
                      {isRtl ? `كارت فاتورة: #${invoiceData.orderId}` : `Invoice Card: #${invoiceData.orderId}`}
                    </div>
                    <div className="text-[11px] text-gray-600 font-bold flex items-center justify-center sm:justify-end gap-1">
                      <Calendar size={12} className="text-blue-900" />
                      <span>{invoiceData.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 relative">
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5 shadow-2xs">
                    <h5 className="font-black text-blue-950 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                      <Building2 size={14} className="text-blue-700" />
                      <span>{isRtl ? 'بيانات العميل المستلم' : 'Customer Information'}</span>
                    </h5>
                    <p><span className="text-gray-500">{isRtl ? 'الاسم:' : 'Name:'}</span> <strong className="text-gray-900">{invoiceData.customerName}</strong></p>
                    <p><span className="text-gray-500">{isRtl ? 'الموبايل الأساسي:' : 'Primary Mobile:'}</span> <strong className="font-mono text-blue-900" dir="ltr">{invoiceData.phonePrimary}</strong></p>
                    {invoiceData.phoneSecondary && (
                      <p><span className="text-gray-500">{isRtl ? 'الموبايل البديل:' : 'Alt Mobile:'}</span> <strong className="font-mono text-emerald-800" dir="ltr">{invoiceData.phoneSecondary}</strong></p>
                    )}
                    <p>
                      <span className="text-gray-500">{isRtl ? 'التواصل المفضل:' : 'Preferred Contact:'}</span>{' '}
                      <strong className="text-blue-950">
                        {invoiceData.contactPreference === 'whatsapp'
                          ? (isRtl ? 'واتساب' : 'WhatsApp')
                          : invoiceData.contactPreference === 'call'
                          ? (isRtl ? 'مكالمة هاتفية' : 'Phone Call')
                          : (isRtl ? 'واتساب أو اتصال' : 'WhatsApp or Call')}
                      </strong>
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5 shadow-2xs">
                    <h5 className="font-black text-blue-950 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                      <MapPin size={14} className="text-red-600" />
                      <span>{isRtl ? 'بيانات ومكان التوصيل' : 'Delivery Address Details'}</span>
                    </h5>
                    <p><span className="text-gray-500">{isRtl ? 'العنوان:' : 'Address:'}</span> <strong>{invoiceData.city ? `${invoiceData.city} - ` : ''}{invoiceData.deliveryAddress}</strong></p>
                    {invoiceData.landmark && (
                      <p><span className="text-gray-500">{isRtl ? 'علامة مميزة:' : 'Landmark:'}</span> <strong className="text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-sm">{invoiceData.landmark}</strong></p>
                    )}
                    {invoiceData.deliveryTimeWindow && (
                      <p><span className="text-gray-500">{isRtl ? 'مدة التوصيل:' : 'Delivery ETA:'}</span> <strong className="text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded-sm">{invoiceData.deliveryTimeWindow}</strong></p>
                    )}
                    {invoiceData.notes && (
                      <p><span className="text-gray-500">{isRtl ? 'ملاحظات:' : 'Notes:'}</span> <strong className="text-gray-800">{invoiceData.notes}</strong></p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-1.5 relative">
                  <h5 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <Package size={15} className="text-blue-900" />
                    <span>
                      {isRtl
                        ? `بيان الأصناف المطلوبة (${invoiceData.items.length} صنف):`
                        : `Requested Items Breakdown (${invoiceData.items.length} items):`}
                    </span>
                  </h5>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-2xs">
                    <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} text-xs`}>
                      <thead className="bg-blue-950 text-white font-bold">
                        <tr>
                          <th className="p-2.5 w-8">#</th>
                          <th className="p-2.5">{isRtl ? 'اسم الصنف' : 'Item Name'}</th>
                          <th className="p-2.5">{isRtl ? 'كود الصنف' : 'Item Code'}</th>
                          <th className="p-2.5">{isRtl ? 'المواصفة' : 'Spec'}</th>
                          <th className="p-2.5 text-center">{isRtl ? 'الكمية' : 'Qty'}</th>
                          <th className={`p-2.5 ${isRtl ? 'text-left' : 'text-right'}`}>{isRtl ? 'حالة التسعير' : 'Pricing Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoiceData.items.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="p-2.5 font-bold text-gray-400">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-gray-900">{item.nameAr}</td>
                            <td className="p-2.5 font-mono text-[11px] text-blue-900 font-bold">{item.unifiedCode || item.itemNumber || '-'}</td>
                            <td className="p-2.5 text-gray-600">{[item.size, item.color].filter(Boolean).join(' - ') || (isRtl ? 'قياسي' : 'Standard')}</td>
                            <td className="p-2.5 text-center font-black text-blue-950 bg-blue-50/50">{item.quantity}</td>
                            <td className={`p-2.5 ${isRtl ? 'text-left' : 'text-right'} text-amber-800 text-[11px] font-bold`}>
                              {isRtl ? 'يعتمد من المبيعات' : 'Quoted by Sales'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pricing Instruction Note */}
                <div className="mt-3.5 bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 space-y-1">
                  <p className="font-black">
                    {isRtl ? '📌 إشعار التسعير الرسمي لشركة دريم طنطاوي جروب:' : '📌 Official Dream Tantawy Group Pricing Notice:'}
                  </p>
                  <p className="text-amber-900 leading-relaxed">
                    {isRtl
                      ? 'سيقوم موظف المبيعات بتأكيد الأسعار النهائية (جملة أو قطاعي) وإرسال كارت الفاتورة المسعّر وموعد وصول المندوب إليك عبر واتساب أو الهاتف.'
                      : 'Our sales specialist will confirm final wholesale/retail pricing and send your priced invoice card along with courier ETA via WhatsApp or phone.'}
                  </p>
                </div>

                {/* Official Verification Stamp & Hotline */}
                <div className="mt-3.5 pt-3 border-t-2 border-dashed border-blue-900/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-blue-50/60 p-3 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-white rounded-xl border border-blue-200 flex items-center justify-center shrink-0">
                      <QrCode size={24} className="text-blue-950" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-blue-950">
                        {isRtl ? 'كارت فاتورة إلكتروني موثق • شركة دريم طنطاوي جروب' : 'Verified Digital Invoice Card • Dream Tantawy Group'}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-gray-500">DREAM-TG-{invoiceData.orderId}</p>
                    </div>
                  </div>
                  <div className={`text-center ${isRtl ? 'sm:text-left' : 'sm:text-right'} text-[11px]`}>
                    <p className="font-bold text-emerald-800">{STOREFRONT_TEXT[language].footer.codInspect}</p>
                    <p className="font-black text-blue-950">{STOREFRONT_TEXT[language].footer.hotlineFull}</p>
                  </div>
                </div>
              </div>

              {pdfExportSuccess && (
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 print:hidden">
                  <CheckCircle2 size={16} className="text-indigo-700 shrink-0" />
                  <span>
                    {isRtl
                      ? 'تم تحميل كارت الفاتورة كملف PDF على جهازك بنجاح — يمكنك إرفاقه مباشرة في محادثة الواتساب!'
                      : 'PDF invoice card downloaded successfully — attach it directly in your WhatsApp chat!'}
                  </span>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 print:hidden">
                <button
                  type="button"
                  disabled={isExportingPDF}
                  onClick={handleExportPDF}
                  className="w-full bg-indigo-900 hover:bg-indigo-950 active:scale-98 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isExportingPDF ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-yellow-400" />
                      <span>{t.generatingPdf}</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={16} className="text-yellow-400" />
                      <span>{t.downloadPdf}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={16} />
                  <span>{t.sendWhatsApp}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 print:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setTrackingPhone(invoiceData.phonePrimary);
                    setIsCheckoutModalOpen(false);
                    setIsOrderTrackingOpen(true);
                  }}
                  className="bg-amber-400 hover:bg-amber-500 text-blue-950 font-black py-2 px-3.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Truck size={14} />
                  <span>{t.trackOrder}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold py-2 px-3 rounded-xl text-xs transition flex items-center gap-1"
                  >
                    <Printer size={14} />
                    <span>{t.print}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold py-2 px-3 rounded-xl text-xs transition flex items-center gap-1"
                  >
                    <Copy size={14} />
                    <span>{copied ? t.copied : t.copy}</span>
                  </button>
                </div>
              </div>

              <div className="pt-1 text-center print:hidden">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="text-xs text-blue-900 font-bold hover:underline"
                >
                  {t.backToCatalog}
                </button>
              </div>

            </div>
          ) : (
            /* Order Form Screen */
            <form onSubmit={handleConfirmOrder} className="space-y-4">
              
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 space-y-1">
                <p className="font-black flex items-center gap-1.5">
                  <Sparkles size={15} className="text-yellow-600" />
                  <span>
                    {isRtl ? 'طلب شراء فوري واستخراج كارت الفاتورة:' : 'Instant Order Request & Official Invoice Card:'}
                  </span>
                </p>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  {isRtl
                    ? 'أدخل بيانات الاستلام أدناه؛ سيتم استخراج كارت فاتورة أنيق بالأصناف والكميات للتواصل المباشر مع موظف المبيعات عبر واتساب للرد بالأسعار وقيمة الفاتورة وميعاد التوصيل.'
                    : 'Enter delivery details below; an official invoice card with your selected items will be generated immediately for live pricing & delivery scheduling.'}
                </p>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Customer Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">
                  {isRtl ? 'اسم العميل المستلم بالكامل' : 'Recipient Full Name'} <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isRtl ? 'مثال: أحمد عبد الله الشريف' : 'e.g., Ahmed Abdallah El-Sherif'}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 font-bold outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              {/* 2. Two Mobile Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    {isRtl ? 'رقم الموبايل الأساسي' : 'Primary Mobile'} <span className="text-red-500">*</span>:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phonePrimary}
                      onChange={(e) => {
                        setPhonePrimary(e.target.value);
                        if (phoneError) setPhoneError('');
                      }}
                      placeholder="01012345678"
                      className={`w-full p-3 bg-white border ${phoneError ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300'} rounded-xl text-xs font-mono font-bold text-left outline-none focus:ring-2 focus:ring-blue-600 transition`}
                      dir="ltr"
                    />
                    <PhoneCall size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {phoneError ? (
                    <span className="text-[11px] text-red-600 font-bold block animate-pulse">
                      ⚠️ {phoneError}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500 block">
                      {isRtl ? 'رقم للتواصل وتأكيد الأوردر (11 رقم)' : '11-digit mobile for order confirmation'}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    {isRtl ? 'رقم موبايل إضافي (بديل)' : 'Alternative Mobile'}{' '}
                    <span className="text-gray-400 font-normal">({isRtl ? 'اختياري' : 'Optional'})</span>:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneSecondary}
                      onChange={(e) => setPhoneSecondary(e.target.value)}
                      placeholder="01123456789"
                      className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold text-left outline-none focus:ring-2 focus:ring-blue-600 transition"
                      dir="ltr"
                    />
                    <PhoneCall size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {isRtl ? 'في حال كان الهاتف الأول غير متاح' : 'In case primary mobile is unreachable'}
                  </span>
                </div>
              </div>

              {/* 2.5 Contact Preference */}
              <div className="space-y-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-800">
                  {isRtl
                    ? 'كيف تفضل أن نتواصل معك لتأكيد الأسعار وتفاصيل الطلب؟'
                    : 'Preferred contact method for quote & order details?'}{' '}
                  <span className="text-red-500">*</span>:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setContactPreference('whatsapp')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      contactPreference === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span>{isRtl ? '🟢 عبر واتساب' : '🟢 WhatsApp'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContactPreference('call')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      contactPreference === 'call'
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs scale-102'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span>{isRtl ? '📞 مكالمة هاتفية' : '📞 Phone Call'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContactPreference('both')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      contactPreference === 'both'
                        ? 'bg-purple-900 text-white border-purple-900 shadow-xs scale-102'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span>{isRtl ? '💬 كلاهما متاح' : '💬 Either'}</span>
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 block">
                  {isRtl
                    ? 'سيقوم موظف المبيعات بمراسلتك أو الاتصال بك وفق رغبتك لإفادتك بالأسعار وحساب الفاتورة'
                    : 'Sales will reach out via your preferred channel with prices and invoice summary'}
                </span>
              </div>

              {/* 3. Delivery Location & City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    {isRtl ? 'المحافظة / النطاق:' : 'Governorate / Region:'}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 transition"
                  >
                    {cityOptions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    {isRtl ? 'مكان وعنوان التوصيل بالتفصيل' : 'Detailed Delivery Address'} <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={isRtl ? 'المنطقة، اسم الشارع، رقم العقار، رقم الشقة' : 'District, street, building #, apartment #'}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              {/* 4. Landmark & Delivery Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    {isRtl ? 'علامة مميزة لمكان التوصيل:' : 'Nearest Landmark:'}
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder={isRtl ? 'مثال: بجوار مسجد النور / أمام صيدلية العزبي' : 'e.g., Next to Al-Nour Mosque'}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    {isRtl ? 'مدة التوصيل المعتمدة:' : 'Standard Delivery Window:'}
                  </label>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 flex items-center gap-2">
                    <Truck size={16} className="text-emerald-700 shrink-0" />
                    <div>
                      <span>{deliveryTimeWindow}</span>
                      <span className="text-[10px] text-emerald-800 block font-medium">
                        {isRtl ? 'لجميع محافظات مصر مع المعاينة والفحص عند الاستلام' : 'Nationwide delivery with full inspection before pay'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">
                  {isRtl ? 'ملاحظات إضافية للمندوب أو المبيعات (اختياري):' : 'Extra notes for courier / sales (Optional):'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isRtl ? 'مثال: الاتصال قبل التحرك بساعة / تسليم في الفترة المسائية' : 'e.g., Call 1 hour prior / evening delivery preferred'}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              {/* Items Summary in Cart */}
              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between items-center text-gray-700 font-bold border-b border-gray-200 pb-1.5">
                  <span>{isRtl ? 'الأصناف في الطلب الحالي:' : 'Items in Current Order:'}</span>
                  <span className="text-blue-900 font-black">
                    {cart.length} {STOREFRONT_TEXT[language].header.itemsUnit}
                  </span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-[11px] text-gray-600">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate max-w-[260px] font-medium">
                        {i + 1}. {getLocalizedProductName(item.product, language)}
                      </span>
                      <span className="font-bold text-blue-900 font-mono">× {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-900 hover:bg-blue-950 active:scale-98 text-white font-black py-3.5 px-6 rounded-2xl text-sm shadow-lg transition flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  <span>{t.submitOrderBtn}</span>
                </button>
              </div>

              <div className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-2 pt-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>{STOREFRONT_TEXT[language].footer.codInspect}</span>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
