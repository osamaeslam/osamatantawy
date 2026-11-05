import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  CheckCircle, 
  Truck, 
  ShieldCheck, 
  ShoppingBag,
  PhoneCall,
  MapPin,
  Clock,
  Sparkles,
  Send,
  Printer,
  Copy,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { OrderItem } from '../types';
import { OrderInvoiceData, sendInvoiceToWhatsApp, generateInvoiceMessage } from '../services/invoice-to-whatsapp';
import { orderService } from '../supabase/orders.service';

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
    whatsappNumber
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [phonePrimary, setPhonePrimary] = useState('');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [contactPreference, setContactPreference] = useState<'whatsapp' | 'call' | 'both'>('whatsapp');
  const [city, setCity] = useState('القاهرة والجيزة');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState('خلال 24 إلى 48 ساعة');
  const [notes, setNotes] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [completedOrder, setCompletedOrder] = useState<OrderItem | null>(null);
  const [invoiceData, setInvoiceData] = useState<OrderInvoiceData | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isCheckoutModalOpen) return null;

  // التحقق من صحة رقم الموبايل المصري
  const validateEgyptianPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return cleaned.length === 11 && /^01[0125]/.test(cleaned);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !phonePrimary.trim() || !deliveryAddress.trim()) {
      alert('يرجى استكمال البيانات الأساسية: الاسم ورقم الموبايل ومكان التوصيل.');
      return;
    }

    const cleanedPhone = phonePrimary.replace(/[^0-9]/g, '');
    if (!validateEgyptianPhone(cleanedPhone)) {
      setPhoneError('يرجى كتابة رقم موبايل مصري صحيح مكون من 11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015 لتأكيد الأوردر.');
      return;
    }
    setPhoneError('');

    const fullAddress = `${city} - ${deliveryAddress}${landmark ? ` (علامة مميزة: ${landmark})` : ''} - هاتف أساسي: ${cleanedPhone}${phoneSecondary ? ` - هاتف بديل: ${phoneSecondary}` : ''} - طريقة التواصل: ${contactPreference === 'whatsapp' ? 'واتساب' : contactPreference === 'call' ? 'مكالمة' : 'كلاهما'} - موعد التوصيل: ${deliveryTimeWindow}${notes ? ` - ملاحظات: ${notes}` : ''}`;
    
    const order = createOrder(fullAddress, 'دفع عند الاستلام - طنطاوي جروب');

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
          nameAr: item.product.nameAr,
          itemNumber: item.product.itemNumber,
          unifiedCode: item.product.unifiedCode,
          size: item.selectedSize || item.product.size,
          color: item.product.color,
          brand: item.product.brand,
          quantity: item.quantity,
          image: item.product.previewimage
        })),
        createdAt: new Date().toLocaleDateString('ar-EG', {
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

      // حفظ كارت الفاتورة والطلب مباشرة في قاعدة بيانات سوبابيز
      orderService.saveInvoiceOrder(generatedInvoice).catch((err) => {
        console.warn('Supabase order auto-save fallback:', err);
      });
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
      >
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="text-yellow-400" size={20} />
            <h3 className="font-black text-sm sm:text-base">
              {completedOrder ? 'كارت فاتورة الطلب الصادرة - طنطاوي جروب' : 'استكمال بيانات طلب الشراء والفاتورة'}
            </h3>
          </div>
          <button
            onClick={() => {
              if (completedOrder) handleFinish();
              else setIsCheckoutModalOpen(false);
            }}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition text-gray-300 hover:text-white"
            title="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-right font-['Cairo',sans-serif] print:overflow-visible print:p-4">
          
          {completedOrder && invoiceData ? (
            /* ========================================================
               Screen 2: Official Order Invoice Card
               ======================================================== */
            <div className="space-y-6">
              
              {/* Success Banner (Hidden in print) */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-950 print:hidden">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h4 className="font-black text-sm">تم تسجيل طلب الشراء وتوليد كارت الفاتورة بنجاح!</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    أرسل الكارت الآن لموظف مبيعات واتساب ليرد عليك فوراً بأسعار الأصناف وإجمالي الفاتورة وموعد الوصول.
                  </p>
                </div>
              </div>

              {/* The Official Tantawy Card */}
              <div className="border-4 border-double border-blue-900/40 rounded-2xl p-5 bg-gradient-to-b from-blue-50/40 to-white relative overflow-hidden shadow-xs">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-blue-900/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-auto bg-white p-1 rounded-xl shadow-xs border border-gray-200 flex items-center justify-center">
                      <img src="/logo.png" alt="Tantawy Group Logo" className="h-full w-auto object-contain" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-blue-950 flex items-center gap-1.5">
                        <span>طنطاوي جروب</span>
                        <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-sm">مصر</span>
                      </h2>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        TANTAWY GROUP - كارت فاتورة معتمدة
                      </p>
                    </div>
                  </div>

                  <div className="text-center sm:text-left space-y-1">
                    <div className="bg-blue-950 text-white px-3 py-1 rounded-lg text-xs font-mono font-black inline-block">
                      فاتورة طلب: #{invoiceData.orderId}
                    </div>
                    <div className="text-[11px] text-gray-500 font-bold flex items-center justify-center sm:justify-start gap-1">
                      <Calendar size={12} />
                      <span>{invoiceData.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                  <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs space-y-1.5">
                    <h5 className="font-black text-blue-900 border-b border-gray-100 pb-1 flex items-center gap-1">
                      <Building2 size={13} />
                      <span>بيانات العميل المستلم:</span>
                    </h5>
                    <p><span className="text-gray-500">الاسم:</span> <strong>{invoiceData.customerName}</strong></p>
                    <p><span className="text-gray-500">الموبايل الأساسي:</span> <strong className="font-mono text-blue-900" dir="ltr">{invoiceData.phonePrimary}</strong></p>
                    {invoiceData.phoneSecondary && (
                      <p><span className="text-gray-500">الموبايل الإضافي:</span> <strong className="font-mono text-emerald-800" dir="ltr">{invoiceData.phoneSecondary}</strong></p>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs space-y-1.5">
                    <h5 className="font-black text-blue-900 border-b border-gray-100 pb-1 flex items-center gap-1">
                      <MapPin size={13} className="text-red-600" />
                      <span>بيانات ومكان التوصيل:</span>
                    </h5>
                    <p><span className="text-gray-500">العنوان:</span> <strong>{invoiceData.city ? `${invoiceData.city} - ` : ''}{invoiceData.deliveryAddress}</strong></p>
                    {invoiceData.landmark && (
                      <p><span className="text-gray-500">علامة مميزة:</span> <strong className="text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-sm">{invoiceData.landmark}</strong></p>
                    )}
                    {invoiceData.deliveryTimeWindow && (
                      <p><span className="text-gray-500">مدة التوصيل:</span> <strong className="text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded-sm">{invoiceData.deliveryTimeWindow}</strong></p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-1.5">
                  <h5 className="text-xs font-black text-gray-900">الأصناف المطلوبة في الأوردر:</h5>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900 text-white font-bold">
                        <tr>
                          <th className="p-2">الصنف</th>
                          <th className="p-2">كود الصنف</th>
                          <th className="p-2">المواصفة</th>
                          <th className="p-2 text-center">الكمية</th>
                          <th className="p-2 text-left">التسعير</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoiceData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-2 font-bold text-gray-900">{item.nameAr}</td>
                            <td className="p-2 font-mono text-[11px] text-blue-900 font-bold">{item.unifiedCode || item.itemNumber || '-'}</td>
                            <td className="p-2 text-gray-600">{[item.size, item.color].filter(Boolean).join(' - ') || 'قياسي'}</td>
                            <td className="p-2 text-center font-black text-blue-950 bg-blue-50/50">{item.quantity}</td>
                            <td className="p-2 text-left text-gray-500 text-[11px] font-bold">يرد به الموظف</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pricing Instruction Note */}
                <div className="mt-3.5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 space-y-1">
                  <p className="font-black">📌 إشعار التسعير الرسمي لطنطاوي جروب:</p>
                  <p className="text-amber-900 leading-relaxed">
                    سيقوم موظف المبيعات والتوزيع بالرد فوراً على رسالة الواتساب بأسعار الأصناف المعتمدة وإجمالي قيمة الفاتورة وفقاً للكمية (جملة أو قطاعي) وتأكيد وصول المندوب.
                  </p>
                </div>

                {/* Hotline Bar */}
                <div className="mt-3 pt-2.5 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-500 font-bold">
                  <span>دفع عند الاستلام بعد التجربة التامة</span>
                  <span className="text-blue-950 font-black">الخط الساخن: 15218</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 print:hidden">
                <button
                  onClick={handleSendWhatsApp}
                  className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  <span>إرسال كارت الفاتورة لواتساب المبيعات فوراً 📲</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                  title="تحميل وطباعة كارت الفاتورة كملف PDF"
                >
                  <Printer size={15} />
                  <span>تحميل PDF 📄</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Copy size={15} />
                  <span>{copied ? 'تم النسخ ✅' : 'نسخ'}</span>
                </button>
              </div>

              <div className="pt-2 text-center print:hidden">
                <button
                  onClick={handleFinish}
                  className="text-xs text-blue-900 font-bold hover:underline"
                >
                  العودة للكتالوج ومتابعة التسوق
                </button>
              </div>

            </div>
          ) : (
            /* ========================================================
               Screen 1: Order Data Input Form (Customer Details)
               ======================================================== */
            <form onSubmit={handleConfirmOrder} className="space-y-4">
              
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 space-y-1">
                <p className="font-black flex items-center gap-1.5">
                  <Sparkles size={15} className="text-yellow-600" />
                  <span>طلب شراء فوري واستخراج كارت الفاتورة:</span>
                </p>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  أدخل بيانات الاستلام أدناه؛ سيتم استخراج كارت فاتورة أنيق بالأصناف وعدد قطعتين أو أكثر للتواصل المباشر مع موظف المبيعات عبر واتساب للرد بالأسعار وقيمة الفاتورة وميعاد التوصيل.
                </p>
              </div>

              {/* 1. Customer Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">
                  اسم العميل المستلم بالكامل <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله الشريف"
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 font-bold outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              {/* 2. Two Mobile Numbers (Primary & Secondary) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    رقم الموبايل الأساسي <span className="text-red-500">*</span>:
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
                    <span className="text-[10px] text-gray-500 block">رقم للتواصل وتأكيد الأوردر (11 رقم)</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    رقم موبايل إضافي (بديل) <span className="text-gray-400 font-normal">(اختياري)</span>:
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
                  <span className="text-[10px] text-gray-500 block">في حال كان الهاتف الأول غير متاح</span>
                </div>
              </div>

              {/* 2.5 Contact Preference Selector */}
              <div className="space-y-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-800">
                  كيف تفضل أن نتواصل معك لتأكيد الأسعار وتفاصيل الطلب؟ <span className="text-red-500">*</span>:
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
                    <span>🟢 عبر واتساب</span>
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
                    <span>📞 مكالمة هاتفية</span>
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
                    <span>💬 كلاهما متاح</span>
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 block">
                  سيقوم موظف المبيعات بمراسلتك أو الاتصال بك وفق رغبتك لإفادتك بالأسعار وحساب الفاتورة
                </span>
              </div>

              {/* 3. Delivery Location & City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    المحافظة / النطاق:
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 transition"
                  >
                    <option value="القاهرة والجيزة">القاهرة والجيزة</option>
                    <option value="الإسكندرية والساحل">الإسكندرية والساحل</option>
                    <option value="محافظات الدلتا">محافظات الدلتا</option>
                    <option value="محافظات القناة">محافظات القناة</option>
                    <option value="محافظات الصعيد">محافظات الصعيد</option>
                    <option value="كافة محافظات مصر">محافظة أخرى</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    مكان وعنوان التوصيل بالتفصيل <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="المنطقة، اسم الشارع، رقم العقار، رقم الشقة"
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              {/* 4. Landmark (علامة مميزة) & Delivery Time Window (مدة التوصيل من - إلى) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    علامة مميزة لمكان التوصيل:
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="مثال: بجوار مسجد النور / أمام صيدلية العزبي"
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    مدة ومواعيد التوصيل المفضلة (من - إلى):
                  </label>
                  <input
                    type="text"
                    value={deliveryTimeWindow}
                    onChange={(e) => setDeliveryTimeWindow(e.target.value)}
                    placeholder="مثال: خلال 24 إلى 48 ساعة / من الأحد إلى الثلاثاء"
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              {/* 5. Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">
                  ملاحظات إضافية للمندوب أو المبيعات (اختياري):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: الاتصال قبل التحرك بساعة / تسليم في الفترة المسائية"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              {/* Items Summary in Cart */}
              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between items-center text-gray-700 font-bold border-b border-gray-200 pb-1.5">
                  <span>الأصناف في الطلب الحالي:</span>
                  <span className="text-blue-900 font-black">{cart.length} أصناف</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-[11px] text-gray-600">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate max-w-[260px] font-medium">{i + 1}. {item.product.nameAr}</span>
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
                  <span>تأكيد الطلب وتوليد كارت الفاتورة الرسمية 📄</span>
                </button>
              </div>

              <div className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-2 pt-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>دفع موحد عند الاستلام بعد فحص الشحنة والتأكد منها</span>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
