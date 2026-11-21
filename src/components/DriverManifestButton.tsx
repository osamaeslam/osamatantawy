import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Truck, FileSpreadsheet, FileDown, Loader2 } from 'lucide-react';
import type { FirebaseOrder } from '../types/firebase';

interface DriverManifestButtonProps {
  orders: FirebaseOrder[];
}

export const DriverManifestButton: React.FC<DriverManifestButtonProps> = ({ orders }) => {
  const manifestRef = useRef<HTMLDivElement>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Pick orders ready for dispatch or currently out for delivery (fallback to all non-cancelled if user filtered)
  const dispatchOrders = orders.filter(
    (o) => o.status === 'confirmed' || o.status === 'dispatched'
  );
  const targetOrders = dispatchOrders.length > 0 ? dispatchOrders : orders.filter((o) => o.status !== 'cancelled');

  const totalCOD = targetOrders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);

  const handleExportExcel = () => {
    if (targetOrders.length === 0) return;

    const rows = targetOrders.map((o, idx) => {
      const p = (o as any).items || {};
      return {
        '#': idx + 1,
        'رقم الطلب': `#${o.orderId}`,
        'اسم العميل': o.customerName,
        'موبايل أساسي': o.customerPhone,
        'موبايل بديل': p.phoneSecondary || '-',
        'المحافظة': p.city || '-',
        'عنوان التوصيل': p.deliveryAddress || o.customerAddress || '-',
        'علامة مميزة': p.landmark || '-',
        'الأصناف': o.productNameAr,
        'الكمية': o.quantity || 1,
        'المبلغ المطلوب تحصيله (ج.م)': Number(o.totalPrice) || 0,
        'المندوب / المسؤول': o.assignedTo || 'غير محدد',
        'حالة الطلب':
          o.status === 'dispatched'
            ? 'مع المندوب'
            : o.status === 'confirmed'
            ? 'مؤكد للشحن'
            : o.status === 'delivered'
            ? 'تم التسليم'
            : o.status,
      };
    });

    rows.push({
      '#': '' as any,
      'رقم الطلب': 'الإجمالي',
      'اسم العميل': `${targetOrders.length} طلب`,
      'موبايل أساسي': '',
      'موبايل بديل': '',
      'المحافظة': '',
      'عنوان التوصيل': '',
      'علامة مميزة': '',
      'الأصناف': '',
      'الكمية': targetOrders.reduce((s, o) => s + (Number(o.quantity) || 1), 0),
      'المبلغ المطلوب تحصيله (ج.م)': totalCOD,
      'المندوب / المسؤول': '',
      'حالة الطلب': '',
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'كشف_خط_السير_للمندوب');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `كشف_شحن_المندوب_${dateStr}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (targetOrders.length === 0 || !manifestRef.current) return;
    setExportingPdf(true);
    try {
      await new Promise((r) => setTimeout(r, 120));
      const canvas = await html2canvas(manifestRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgW = pdfW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (imgH <= pdfH - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
      } else {
        let heightLeft = imgH;
        let position = margin;
        pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
        heightLeft -= pdfH - margin * 2;
        while (heightLeft > 0) {
          position = heightLeft - imgH + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
          heightLeft -= pdfH - margin * 2;
        }
      }

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`كشف_تسليمات_المندوب_${dateStr}.pdf`);
    } catch (e) {
      console.error('Driver manifest PDF export error:', e);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={targetOrders.length === 0 || exportingPdf}
          className="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          title="تصدير كشف الشحن وتحصيل المبالغ للمندوب كـ PDF"
        >
          {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
          <span>كشف المندوب PDF ({targetOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={targetOrders.length === 0}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          title="تصدير كشف خط السير للمندوب كـ Excel"
        >
          <FileSpreadsheet size={14} />
          <span>كشف المندوب Excel</span>
        </button>
      </div>

      {/* Offscreen RTL Printable Container for Driver Dispatch PDF */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <div
          ref={manifestRef}
          dir="rtl"
          className="w-[1060px] bg-white p-6 text-right font-['Cairo',sans-serif] text-gray-900 space-y-4"
        >
          <div className="flex items-center justify-between border-b-2 border-blue-950 pb-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Dream Tantawy" className="h-12 w-auto object-contain" />
              <div>
                <h2 className="text-lg font-black text-blue-950">
                  كشف خط سير المندوب وتحصيل المبالغ — شركة دريم طنطاوي جروب
                </h2>
                <p className="text-xs text-gray-600 font-bold">
                  التاريخ: {new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' })} · الخط الساخن: 15218
                </p>
              </div>
            </div>
            <div className="text-left bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
              <span className="text-[11px] text-gray-600 block font-bold">إجمالي التحصيل المتوقع:</span>
              <strong className="text-lg font-mono font-black text-blue-950 tabular-nums">
                {totalCOD.toLocaleString('ar-EG')} ج.م
              </strong>
            </div>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-2 border border-blue-900 text-center w-8">م</th>
                <th className="p-2 border border-blue-900">رقم الطلب</th>
                <th className="p-2 border border-blue-900">العميل والموبايل</th>
                <th className="p-2 border border-blue-900">العنوان والعلامة المميزة</th>
                <th className="p-2 border border-blue-900">الأصناف</th>
                <th className="p-2 border border-blue-900 text-center">التحصيل (ج.م)</th>
                <th className="p-2 border border-blue-900 text-center">توقيع العميل</th>
              </tr>
            </thead>
            <tbody>
              {targetOrders.map((o, idx) => {
                const p = (o as any).items || {};
                const fullAddr = [p.city, p.deliveryAddress || o.customerAddress, p.landmark ? `(${p.landmark})` : '']
                  .filter(Boolean)
                  .join(' - ');
                return (
                  <tr key={o.id || o.orderId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 border border-gray-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border border-gray-200 font-mono font-black text-blue-950">
                      #{o.orderId}
                    </td>
                    <td className="p-2 border border-gray-200">
                      <strong className="block">{o.customerName}</strong>
                      <span className="font-mono text-[11px] text-gray-700" dir="ltr">
                        {o.customerPhone}
                        {p.phoneSecondary ? ` / ${p.phoneSecondary}` : ''}
                      </span>
                    </td>
                    <td className="p-2 border border-gray-200 max-w-[240px]">{fullAddr || '—'}</td>
                    <td className="p-2 border border-gray-200 max-w-[220px]">
                      {o.productNameAr} ({o.quantity || 1})
                    </td>
                    <td className="p-2 border border-gray-200 text-center font-mono font-black text-emerald-800 tabular-nums">
                      {Number(o.totalPrice || 0).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-2 border border-gray-200 text-center text-gray-400">
                      ....................
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between pt-3 text-[11px] text-gray-600 font-bold border-t border-gray-200">
            <span>عدد الشحنات بالكشف: {targetOrders.length}</span>
            <span>توقيع مسؤول المخزن: __________________</span>
            <span>توقيع المندوب المستلم: __________________</span>
          </div>
        </div>
      </div>
    </>
  );
};
