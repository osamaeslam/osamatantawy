import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  Sparkles, 
  ShieldCheck,
  Building2,
  Package,
  FileDown,
  Loader2
} from 'lucide-react';
import { OrderInvoiceData, sendInvoiceToWhatsApp, generateInvoiceMessage } from '../services/invoice-to-whatsapp';
import { useApp } from '../context/AppContext';
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
  const { whatsappNumber } = useApp();
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handleCopyText = () => {
    const text = generateInvoiceMessage(order);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!cardRef.current) return;
    try {
      setIsExportingPDF(true);
      await new Promise((r) => setTimeout(r, 100));

      const element = cardRef.current;
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
      const printableWidth = pdfWidth - margin * 2;
      const printableHeight = (canvas.height * printableWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, printableWidth, Math.min(printableHeight, pdfHeight - margin * 2));
      const orderNumber = order.orderId || 'فاتورة';
      pdf.save(`كارت_فاتورة_طنطاوي_جروب_${orderNumber}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleSendWhatsApp = () => {
    sendInvoiceToWhatsApp(order, whatsappNumber);
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
            <span className="font-black text-sm md:text-base">كارت فاتورة طلب الشراء - طنطاوي جروب</span>
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
          <div 
            ref={cardRef}
            className="border-4 border-double border-blue-900/40 rounded-2xl p-5 bg-gradient-to-b from-blue-50/40 to-white relative overflow-hidden shadow-xs"
          >
            
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
                  رقم الفاتورة: #{order.orderId}
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
                      <th className="p-2.5">كود الصنف</th>
                      <th className="p-2.5">المقاس / المواصفة</th>
                      <th className="p-2.5 text-center">الكمية</th>
                      <th className="p-2.5 text-left">تسعير الفاتورة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="p-2.5 font-bold text-gray-400">{idx + 1}</td>
                        <td className="p-2.5 font-black text-gray-900">{item.nameAr}</td>
                        <td className="p-2.5 font-mono text-blue-900 font-bold text-[11px]">
                          {item.unifiedCode || item.itemNumber || '-'}
                        </td>
                        <td className="p-2.5 text-gray-600">
                          {[item.size, item.color].filter(Boolean).join(' / ') || 'قياسي'}
                        </td>
                        <td className="p-2.5 text-center font-bold text-blue-950 bg-blue-50/50">
                          {item.quantity}
                        </td>
                        <td className="p-2.5 text-left font-mono font-bold text-xs">
                          {item.unitPrice && item.unitPrice > 0 ? (
                            <span className="text-blue-950 font-black">
                              {((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString('ar-EG')} ج.م
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">بانتظار رد الموظف</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing note box or Grand Total */}
            {order.totalPrice && order.totalPrice > 0 ? (
              <div className="mt-4 bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-700" />
                  <div>
                    <span className="font-black text-emerald-950 block">تم اعتماد تسعير الفاتورة رسمياً:</span>
                    <span className="text-[11px] text-emerald-800">الدفع عند الاستلام بعد الفحص والمعاينة</span>
                  </div>
                </div>
                <div className="text-left font-mono font-black text-emerald-900 text-sm sm:text-base bg-white px-3 py-1 rounded-lg border border-emerald-200">
                  الإجمالي: {order.totalPrice.toLocaleString('ar-EG')} ج.م
                </div>
              </div>
            ) : (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-1">
                  <p className="font-black">نظام تسعير الفاتورة الرسمي لدى طنطاوي جروب:</p>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    يتم إرسال هذا الكارت لمسؤول المبيعات عبر واتساب للرد الفوري بأسعار كل صنف وحساب إجمالي قيمة الفاتورة حسب كمية الطلب (سعر جملة أو قطاعي) مع تأكيد التوصيل السريع.
                  </p>
                </div>
              </div>
            )}

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
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="bg-indigo-900 hover:bg-indigo-950 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
              title="تصدير كارت الفاتورة كملف PDF عالي الجودة"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 size={16} className="animate-spin text-yellow-400" />
                  <span>جارٍ تجهيز الـ PDF...</span>
                </>
              ) : (
                <>
                  <FileDown size={16} className="text-yellow-400" />
                  <span>تصدير كارت الفاتورة PDF 📄</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
              title="طباعة كارت الفاتورة"
            >
              <Printer size={15} />
              <span>طباعة 🖨️</span>
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
              <span>إرسال كارت الفاتورة لواتساب المبيعات فوراً 📲</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
