import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Printer, 
  Copy, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Clock, 
  Calendar, 
  FileText, 
  ShieldCheck,
  Building2,
  Package
} from 'lucide-react';
import { OrderInvoiceData, sendQuoteToCustomerWhatsApp, generateQuoteMessage } from '../services/invoice-to-whatsapp';
import { getSafeImageSrc } from '../utils/imageHelper';

interface InvoiceCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderInvoiceData | null;
}

export const InvoiceCardModal: React.FC<InvoiceCardModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyText = () => {
    const text = generateQuoteMessage(order);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    sendQuoteToCustomerWhatsApp(order);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="text-yellow-400" size={20} />
                <span className="font-black text-sm md:text-base">عرض سعر طلب العميل - طنطاوي جروب</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition text-gray-300 hover:text-white"
            title="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Invoice Card Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 print:overflow-visible print:p-4 text-right font-['Cairo',sans-serif]">
          
          {/* Card Frame Header */}
          <div className="border-4 border-double border-blue-900/40 rounded-2xl p-5 bg-gradient-to-b from-blue-50/40 to-white relative overflow-hidden">
            
            {/* Watermark Logo */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
              <Building2 size={240} className="text-blue-900" />
            </div>

            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-blue-900/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-auto bg-white p-1 rounded-xl shadow-xs border border-gray-200 flex items-center justify-center">
                  <img src="/logo.png" alt="Tantawy Group Logo" className="h-full w-auto object-contain" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-blue-950 flex items-center gap-1.5">
                    <span>طنطاوي جروب</span>
                    <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-sm">مصر</span>
                  </h2>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                    TANTAWY GROUP - الأجهزة المنزلية والكهربية
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <div className="bg-blue-950 text-white px-3 py-1 rounded-lg text-xs font-mono font-black inline-block">
                  عرض سعر رقم: #{order.orderId}
                </div>
                <div className="text-[11px] text-gray-500 font-bold flex items-center justify-center sm:justify-start gap-1">
                  <Calendar size={12} />
                  <span>تاريخ الطلب: {order.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Customer & Delivery Card Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-4 pt-2">
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                <h4 className="text-xs font-black text-blue-900 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                  <Building2 size={14} className="text-blue-700" />
                  <span>بيانات العميل والتواصل</span>
                </h4>
                <div className="space-y-1.5 text-xs text-gray-800 font-medium">
                  <div>
                    <span className="text-gray-500 text-[11px]">اسم العميل المستلم: </span>
                    <strong className="font-bold text-gray-900">{order.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px]">رقم الموبايل الأساسي: </span>
                    <strong className="font-mono font-bold text-blue-900" dir="ltr">{order.phonePrimary}</strong>
                  </div>
                  {order.phoneSecondary && (
                    <div>
                      <span className="text-gray-500 text-[11px]">رقم الموبايل الإضافي (بديل): </span>
                      <strong className="font-mono font-bold text-emerald-800" dir="ltr">{order.phoneSecondary}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                <h4 className="text-xs font-black text-blue-900 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                  <MapPin size={14} className="text-red-600" />
                  <span>مكان ومواعيد التوصيل</span>
                </h4>
                <div className="space-y-1.5 text-xs text-gray-800 font-medium">
                  <div>
                    <span className="text-gray-500 text-[11px]">عنوان التوصيل: </span>
                    <span className="font-bold">{order.city ? `${order.city} - ` : ''}{order.deliveryAddress}</span>
                  </div>
                  {order.landmark && (
                    <div>
                      <span className="text-gray-500 text-[11px]">علامة مميزة للعنوان: </span>
                      <strong className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded-sm">
                        {order.landmark}
                      </strong>
                    </div>
                  )}
                  {order.deliveryTimeWindow && (
                    <div>
                      <span className="text-gray-500 text-[11px]">مدة التوصيل المطلوبة: </span>
                      <strong className="text-emerald-900 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                        {order.deliveryTimeWindow}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <Package size={15} className="text-blue-900" />
                <span>قائمة الأجهزة والأصناف المطلوبة ({order.items.length} صنف)</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-right text-xs">
                  <thead className="bg-blue-950 text-white font-bold">
                    <tr>
                      <th className="p-2.5">م</th>
                      <th className="p-2.5">اسم الصنف والجهاز</th>
                      <th className="p-2.5">المقاس / المواصفة</th>
                      <th className="p-2.5 text-center">الكمية</th>
                      <th className="p-2.5 text-left">سعر الوحدة</th>
                      <th className="p-2.5 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="p-2.5 font-bold text-gray-400">{idx + 1}</td>
                        <td className="p-2.5 font-black text-gray-900">{item.nameAr}</td>
                        <td className="p-2.5 text-gray-600">
                          {[item.size, item.color].filter(Boolean).join(' / ') || 'قياسي'}
                        </td>
                        <td className="p-2.5 text-center font-bold text-blue-950 bg-blue-50/50">
                          {item.quantity}
                        </td>
                        <td className="p-2.5 text-left font-bold text-blue-950">
                          {item.unitPrice !== undefined ? `${item.unitPrice} ج.م` : 'بانتظار التسعير'}
                        </td>
                        <td className="p-2.5 text-left font-black text-blue-950">
                          {item.unitPrice !== undefined ? `${item.unitPrice * item.quantity} ج.م` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 font-black text-sm text-blue-950">
              <span>إجمالي عرض السعر</span>
              <span>{order.totalPrice || 0} جنيه</span>
            </div>

            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-900">
              عرض السعر في انتظار تأكيد العميل. لتعديل أو استبدال أي صنف، يرجى التواصل مع فريق المبيعات.
            </p>

            {/* Footer of Card */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500 font-bold">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>ضمان طنطاوي جروب الرسمي المعتمد لجميع محافظات مصر</span>
              </div>
              <div className="text-blue-950 font-black">
                الخط الساخن المباشر: 15218
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
              title="طباعة كارت الفاتورة أو حفظها كملف PDF"
            >
              <Printer size={15} />
              <span>تحميل وطباعة الفاتورة (PDF) 📄</span>
            </button>
            <button
              onClick={handleCopyText}
              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold text-xs px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
              title="نسخ نص الفاتورة"
            >
              <Copy size={15} />
              <span>{copied ? 'تم النسخ ✅' : 'نسخ النص'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md"
            >
              <Send size={16} />
              <span>فتح واتساب لإرسال عرض السعر للعميل 📲</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
