import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  TrendingUp,
  Users,
  Timer,
  DollarSign,
  CheckCircle2,
  FileSpreadsheet,
  FileDown,
  Loader2,
  Calendar,
  Award,
  Receipt,
  Filter,
} from 'lucide-react';
import type { FirebaseOrder } from '../types/firebase';

interface SalesKPIsAndAccountingTabProps {
  orders: FirebaseOrder[];
}

interface StaffKPI {
  staffName: string;
  totalAssigned: number;
  pendingCount: number;
  pricedCount: number;
  confirmedOrDispatched: number;
  deliveredCount: number;
  cancelledCount: number;
  conversionRate: number;
  avgResponseMinutes: number;
  respondedSamples: number;
  totalRevenue: number;
  closedRevenue: number;
}

const formatMinutesAr = (minutes: number): string => {
  if (!isFinite(minutes) || minutes <= 0) return '—';
  if (minutes < 60) return `${Math.round(minutes)} دقيقة`;
  const h = minutes / 60;
  if (h < 24) return `${h.toFixed(1)} ساعة`;
  return `${(h / 24).toFixed(1)} يوم`;
};

const statusLabelAr = (st: FirebaseOrder['status']): string => {
  switch (st) {
    case 'pending':
      return 'بانتظار التسعير';
    case 'priced':
      return 'تم التسعير';
    case 'confirmed':
      return 'مؤكد';
    case 'dispatched':
      return 'مع المندوب';
    case 'delivered':
      return 'تم التسليم';
    case 'cancelled':
      return 'ملغي';
    default:
      return st;
  }
};

export const SalesKPIsAndAccountingTab: React.FC<SalesKPIsAndAccountingTabProps> = ({ orders }) => {
  const [subView, setSubView] = useState<'kpis' | 'accounting'>('kpis');

  // Accounting filter state
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>(thirtyDaysAgoStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [accStatusFilter, setAccStatusFilter] = useState<'all' | 'delivered' | 'confirmed_plus' | 'active_non_cancelled'>('active_non_cancelled');
  const [accStaffFilter, setAccStaffFilter] = useState<string>('all');
  const [exportingPdf, setExportingPdf] = useState(false);

  const reportPdfRef = useRef<HTMLDivElement>(null);

  // Build Per-Staff KPIs
  const staffKPIs = useMemo<StaffKPI[]>(() => {
    const groups = new Map<string, FirebaseOrder[]>();
    orders.forEach((o) => {
      const name = (o.assignedTo || '').trim() || 'غير معيّن';
      const arr = groups.get(name) || [];
      arr.push(o);
      groups.set(name, arr);
    });

    const rows: StaffKPI[] = [];
    groups.forEach((list, staffName) => {
      const pendingCount = list.filter((o) => !o.status || o.status === 'pending').length;
      const pricedCount = list.filter((o) => o.status === 'priced').length;
      const confirmedOrDispatched = list.filter((o) => o.status === 'confirmed' || o.status === 'dispatched').length;
      const deliveredCount = list.filter((o) => o.status === 'delivered').length;
      const cancelledCount = list.filter((o) => o.status === 'cancelled').length;

      const totalAssigned = list.length;
      const nonCancelled = Math.max(1, totalAssigned - cancelledCount);
      const conversionRate = Math.round(((deliveredCount + confirmedOrDispatched) / nonCancelled) * 100);

      const responded = list.filter((o) => o.respondedAt && o.createdAt);
      const avgResponseMinutes =
        responded.length > 0
          ? responded.reduce((sum, o) => {
              const t1 = new Date(o.createdAt as string).getTime();
              const t2 = new Date(o.respondedAt as string).getTime();
              return sum + Math.max(0, t2 - t1) / 60000;
            }, 0) / responded.length
          : 0;

      const totalRevenue = list
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
      const closedRevenue = list
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

      rows.push({
        staffName,
        totalAssigned,
        pendingCount,
        pricedCount,
        confirmedOrDispatched,
        deliveredCount,
        cancelledCount,
        conversionRate,
        avgResponseMinutes,
        respondedSamples: responded.length,
        totalRevenue,
        closedRevenue,
      });
    });

    return rows.sort((a, b) => {
      if (a.staffName === 'غير معيّن') return 1;
      if (b.staffName === 'غير معيّن') return -1;
      return b.totalRevenue - a.totalRevenue || b.deliveredCount - a.deliveredCount;
    });
  }, [orders]);

  const allStaffOptions = useMemo(() => {
    const s = new Set<string>();
    orders.forEach((o) => {
      if (o.assignedTo) s.add(o.assignedTo);
    });
    return Array.from(s);
  }, [orders]);

  // Global KPI Totals
  const totalGrossRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalDeliveredRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalDelivered = orders.filter((o) => o.status === 'delivered').length;
  const totalPhoneOrders = orders.filter(
    (o) => o.orderSource === 'phone_15218' || o.items?.orderSource === 'phone_15218' || o.items?.orderSource === 'whatsapp_direct'
  ).length;

  // Accounting Filtered Ledger
  const accountingOrders = useMemo(() => {
    const startMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : 0;
    const endMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Infinity;

    return orders.filter((o) => {
      const createdMs = o.createdAt ? new Date(o.createdAt as string).getTime() : 0;
      if (createdMs && (createdMs < startMs || createdMs > endMs)) return false;

      if (accStaffFilter !== 'all') {
        const rep = (o.assignedTo || '').trim() || 'غير معيّن';
        if (rep !== accStaffFilter) return false;
      }

      if (accStatusFilter === 'delivered') return o.status === 'delivered';
      if (accStatusFilter === 'confirmed_plus') {
        return o.status === 'confirmed' || o.status === 'dispatched' || o.status === 'delivered';
      }
      if (accStatusFilter === 'active_non_cancelled') {
        return o.status !== 'cancelled';
      }
      return true;
    });
  }, [orders, fromDate, toDate, accStatusFilter, accStaffFilter]);

  const accTotals = useMemo(() => {
    let itemsSubtotalSum = 0;
    let shippingSum = 0;
    let discountSum = 0;
    let netTotalSum = 0;

    accountingOrders.forEach((o) => {
      const payload = o.items || {};
      const total = Number(o.totalPrice) || 0;
      const shipping = Number(payload.deliveryFee) || 0;
      const disc = Number(payload.discount) || 0;
      const sub =
        Number(payload.itemsSubtotal) ||
        Math.max(0, total - shipping + disc);

      itemsSubtotalSum += sub;
      shippingSum += shipping;
      discountSum += disc;
      netTotalSum += total;
    });

    return { itemsSubtotalSum, shippingSum, discountSum, netTotalSum };
  }, [accountingOrders]);

  const handleExportAccountingExcel = () => {
    const ledgerRows = accountingOrders.map((o, idx) => {
      const payload = o.items || {};
      const total = Number(o.totalPrice) || 0;
      const shipping = Number(payload.deliveryFee) || 0;
      const discount = Number(payload.discount) || 0;
      const subtotal = Number(payload.itemsSubtotal) || Math.max(0, total - shipping + discount);

      return {
        '#': idx + 1,
        'رقم الفاتورة': `#${o.orderId}`,
        'التاريخ': o.createdAt ? new Date(o.createdAt as string).toLocaleDateString('ar-EG') : '-',
        'العميل': o.customerName,
        'الهاتف': o.customerPhone,
        'المصدر':
          (o.orderSource || payload.orderSource) === 'phone_15218'
            ? 'الخط الساخن 15218'
            : (o.orderSource || payload.orderSource) === 'whatsapp_direct'
            ? 'واتساب مباشر'
            : 'المتجر الإلكتروني',
        'المسؤول': o.assignedTo || 'غير معيّن',
        'الأصناف': o.productNameAr,
        'الكمية': o.quantity || 1,
        'قيمة الأصناف (ج.م)': subtotal,
        'الشحن (ج.م)': shipping,
        'الخصم (ج.م)': discount,
        'الصافي النهائي (ج.م)': total,
        'الحالة': statusLabelAr(o.status),
      };
    });

    ledgerRows.push({
      '#': '' as any,
      'رقم الفاتورة': 'الإجماليات',
      'التاريخ': `${fromDate} → ${toDate}`,
      'العميل': `${accountingOrders.length} فاتورة`,
      'الهاتف': '',
      'المصدر': '',
      'المسؤول': '',
      'الأصناف': '',
      'الكمية': accountingOrders.reduce((s, o) => s + (Number(o.quantity) || 1), 0),
      'قيمة الأصناف (ج.م)': accTotals.itemsSubtotalSum,
      'الشحن (ج.م)': accTotals.shippingSum,
      'الخصم (ج.م)': accTotals.discountSum,
      'الصافي النهائي (ج.م)': accTotals.netTotalSum,
      'الحالة': '',
    });

    const kpiRows = staffKPIs.map((k) => ({
      'الموظف': k.staffName,
      'إجمالي الطلبات': k.totalAssigned,
      'بانتظار التسعير': k.pendingCount,
      'تم التسعير': k.pricedCount,
      'قيد الشحن والتأكيد': k.confirmedOrDispatched,
      'مسلّم ومغلق': k.deliveredCount,
      'ملغي': k.cancelledCount,
      'نسبة الإغلاق %': `${k.conversionRate}%`,
      'متوسط سرعة الرد': formatMinutesAr(k.avgResponseMinutes),
      'إجمالي قيمة المبيعات (ج.م)': k.totalRevenue,
      'التحصيل الفعلي للمسلّم (ج.م)': k.closedRevenue,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ledgerRows), 'تقرير_المحاسبة_الفواتير');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiRows), 'أداء_الموظفين_KPIs');
    XLSX.writeFile(wb, `تقرير_محاسبة_طنطاوي_${fromDate}_الى_${toDate}.xlsx`);
  };

  const handleExportAccountingPDF = async () => {
    if (!reportPdfRef.current) return;
    setExportingPdf(true);
    try {
      await new Promise((r) => setTimeout(r, 120));
      const canvas = await html2canvas(reportPdfRef.current, {
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

      pdf.save(`التقرير_المحاسبي_طنطاوي_${fromDate}_الى_${toDate}.pdf`);
    } catch (e) {
      console.error('Accounting PDF error:', e);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-view Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <TrendingUp size={22} className="text-blue-900" />
            <span>تقارير أداء المبيعات والموظفين وتصدير المحاسبة</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            متابعة مؤشرات الإغلاق وسرعة الرد لكل موظف واستخراج دفاتر الفواتير المعتمدة للمحاسبة والجرد
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setSubView('kpis')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              subView === 'kpis' ? 'bg-white text-blue-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            أداء الموظفين (Sales KPIs)
          </button>
          <button
            type="button"
            onClick={() => setSubView('accounting')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              subView === 'accounting' ? 'bg-white text-blue-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            تقارير المحاسبة (Excel / PDF)
          </button>
        </div>
      </div>

      {/* Top Executive KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">إجمالي المبيعات النشطة</span>
            <DollarSign size={16} className="text-blue-900" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-950 tabular-nums">
            {totalGrossRevenue.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
          </div>
          <p className="text-[11px] text-gray-500">كل الطلبات عدا الملغاة</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">المبيعات المحصّلة (المسلّمة)</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700 tabular-nums">
            {totalDeliveredRevenue.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
          </div>
          <p className="text-[11px] text-gray-500">إجمالي {totalDelivered} فاتورة مغلقة</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">الموظفون النشطون بالتقارير</span>
            <Users size={16} className="text-indigo-700" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-950 tabular-nums">
            {staffKPIs.filter((s) => s.staffName !== 'غير معيّن').length}
          </div>
          <p className="text-[11px] text-gray-500">طلبات بدون تعيين: {staffKPIs.find((s) => s.staffName === 'غير معيّن')?.totalAssigned || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">طلبات الهاتف 15218 والواتساب</span>
            <Receipt size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700 tabular-nums">
            {totalPhoneOrders}
          </div>
          <p className="text-[11px] text-gray-500">مسجلة مباشرة من الإدارة</p>
        </div>
      </div>

      {subView === 'kpis' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-gray-900">جدول أداء فريق المبيعات والتوصيل</h4>
              <p className="text-xs text-gray-500">
                يُحسب تلقائياً من تعيين الطلبات وسرعة التسعير ونسب الإغلاق الفعلي
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportAccountingExcel}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <FileSpreadsheet size={14} />
              <span>تصدير التقرير Excel</span>
            </button>
          </div>

          {staffKPIs.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-500 font-bold">
              لا توجد طلبات مسجلة بعد لحساب مؤشرات أداء الموظفين.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold">
                  <tr>
                    <th className="p-3">الموظف / المسؤول</th>
                    <th className="p-3 text-center">إجمالي الطلبات</th>
                    <th className="p-3 text-center">معلّق</th>
                    <th className="p-3 text-center">تم التسعير</th>
                    <th className="p-3 text-center">قيد الشحن</th>
                    <th className="p-3 text-center">تم التسليم</th>
                    <th className="p-3 text-center">نسبة الإغلاق</th>
                    <th className="p-3 text-center">متوسط سرعة الرد</th>
                    <th className="p-3 text-left">إجمالي المبيعات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staffKPIs.map((row, idx) => {
                    const isTop = idx === 0 && row.staffName !== 'غير معيّن' && row.totalRevenue > 0;
                    return (
                      <tr key={row.staffName} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900">{row.staffName}</span>
                            {isTop && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                <Award size={11} />
                                الأعلى مبيعاً
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold tabular-nums">{row.totalAssigned}</td>
                        <td className="p-3 text-center font-mono tabular-nums text-amber-700 font-bold">
                          {row.pendingCount}
                        </td>
                        <td className="p-3 text-center font-mono tabular-nums text-blue-800 font-bold">
                          {row.pricedCount}
                        </td>
                        <td className="p-3 text-center font-mono tabular-nums text-indigo-800 font-bold">
                          {row.confirmedOrDispatched}
                        </td>
                        <td className="p-3 text-center font-mono tabular-nums text-emerald-700 font-black">
                          {row.deliveredCount}
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-900 rounded-full"
                                style={{ width: `${Math.min(100, row.conversionRate)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold tabular-nums">{row.conversionRate}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono text-gray-700 tabular-nums">
                          {row.respondedSamples > 0 ? formatMinutesAr(row.avgResponseMinutes) : '—'}
                        </td>
                        <td className="p-3 text-left font-mono font-black text-blue-950 tabular-nums">
                          {row.totalRevenue.toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Accounting Filters */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>من تاريخ:</span>
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>إلى تاريخ:</span>
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1 flex items-center gap-1">
                    <Filter size={12} />
                    <span>نطاق الفواتير:</span>
                  </label>
                  <select
                    value={accStatusFilter}
                    onChange={(e) => setAccStatusFilter(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="active_non_cancelled">كافة الفواتير (عدا الملغي)</option>
                    <option value="delivered">المسلّمة والمحصّلة فقط</option>
                    <option value="confirmed_plus">المؤكدة + الجارية + المسلّمة</option>
                    <option value="all">جميع الطلبات شاملة الملغي</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">الموظف المسؤول:</label>
                  <select
                    value={accStaffFilter}
                    onChange={(e) => setAccStaffFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="all">جميع الموظفين</option>
                    {allStaffOptions.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                    <option value="غير معيّن">غير معيّن</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportAccountingExcel}
                  disabled={accountingOrders.length === 0}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FileSpreadsheet size={15} />
                  <span>تصدير Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportAccountingPDF}
                  disabled={accountingOrders.length === 0 || exportingPdf}
                  className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
                >
                  {exportingPdf ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                  <span>تصدير PDF</span>
                </button>
              </div>
            </div>

            {/* Financial Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-gray-500 block">عدد الفواتير المطابقة</span>
                <strong className="text-base font-mono font-black text-gray-900 tabular-nums">
                  {accountingOrders.length}
                </strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-gray-500 block">إجمالي قيمة الأصناف</span>
                <strong className="text-base font-mono font-black text-gray-900 tabular-nums">
                  {accTotals.itemsSubtotalSum.toLocaleString('ar-EG')} ج.م
                </strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-gray-500 block">إجمالي الشحن / الخصم</span>
                <strong className="text-sm font-mono font-bold text-gray-800 tabular-nums">
                  +{accTotals.shippingSum.toLocaleString('ar-EG')} / -{accTotals.discountSum.toLocaleString('ar-EG')}
                </strong>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 font-bold block">الصافي المحاسبي المعتمد</span>
                <strong className="text-base font-mono font-black text-emerald-800 tabular-nums">
                  {accTotals.netTotalSum.toLocaleString('ar-EG')} ج.م
                </strong>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {accountingOrders.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-500 font-bold">
                لا توجد فواتير في هذه الفترة الزمنية المطابقة للفلتر المحدد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold">
                    <tr>
                      <th className="p-3">رقم الفاتورة</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">العميل</th>
                      <th className="p-3">المسؤول</th>
                      <th className="p-3">الأصناف</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-left">الصافي (ج.م)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {accountingOrders.map((o) => (
                      <tr key={o.id || o.orderId} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono font-black text-blue-950">#{o.orderId}</td>
                        <td className="p-3 font-mono text-gray-600 tabular-nums">
                          {o.createdAt ? new Date(o.createdAt as string).toLocaleDateString('ar-EG') : '—'}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-gray-900 block">{o.customerName}</span>
                          <span className="text-[10px] font-mono text-gray-500" dir="ltr">
                            {o.customerPhone}
                          </span>
                        </td>
                        <td className="p-3 text-gray-700 font-medium">{o.assignedTo || 'غير معيّن'}</td>
                        <td className="p-3 max-w-[220px] truncate text-gray-700">{o.productNameAr}</td>
                        <td className="p-3 text-center font-bold">{statusLabelAr(o.status)}</td>
                        <td className="p-3 text-left font-mono font-black text-blue-950 tabular-nums">
                          {Number(o.totalPrice || 0).toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offscreen RTL Printable Accounting Report for PDF Export */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <div
          ref={reportPdfRef}
          dir="rtl"
          className="w-[1060px] bg-white p-6 text-right font-['Cairo',sans-serif] text-gray-900 space-y-4"
        >
          <div className="flex items-center justify-between border-b-2 border-blue-950 pb-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Dream Tantawy" className="h-12 w-auto object-contain" />
              <div>
                <h2 className="text-lg font-black text-blue-950">
                  التقرير المحاسبي ودفتر الفواتير — شركة دريم طنطاوي جروب
                </h2>
                <p className="text-xs text-gray-600 font-bold">
                  الفترة: من {fromDate} إلى {toDate} · تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>
            <div className="text-left bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
              <span className="text-[11px] text-emerald-800 block font-bold">الصافي المحاسبي المعتمد:</span>
              <strong className="text-lg font-mono font-black text-emerald-800 tabular-nums">
                {accTotals.netTotalSum.toLocaleString('ar-EG')} ج.م
              </strong>
            </div>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-2 border border-blue-900 text-center w-8">م</th>
                <th className="p-2 border border-blue-900">رقم الفاتورة</th>
                <th className="p-2 border border-blue-900">التاريخ</th>
                <th className="p-2 border border-blue-900">العميل</th>
                <th className="p-2 border border-blue-900">المسؤول</th>
                <th className="p-2 border border-blue-900">الأصناف</th>
                <th className="p-2 border border-blue-900 text-center">الحالة</th>
                <th className="p-2 border border-blue-900 text-center">الصافي (ج.م)</th>
              </tr>
            </thead>
            <tbody>
              {accountingOrders.map((o, idx) => (
                <tr key={o.id || o.orderId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-2 border border-gray-200 text-center font-mono">{idx + 1}</td>
                  <td className="p-2 border border-gray-200 font-mono font-bold">#{o.orderId}</td>
                  <td className="p-2 border border-gray-200 font-mono tabular-nums">
                    {o.createdAt ? new Date(o.createdAt as string).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td className="p-2 border border-gray-200">
                    {o.customerName} ({o.customerPhone})
                  </td>
                  <td className="p-2 border border-gray-200">{o.assignedTo || 'غير معيّن'}</td>
                  <td className="p-2 border border-gray-200 max-w-[260px]">{o.productNameAr}</td>
                  <td className="p-2 border border-gray-200 text-center">{statusLabelAr(o.status)}</td>
                  <td className="p-2 border border-gray-200 text-center font-mono font-bold tabular-nums">
                    {Number(o.totalPrice || 0).toLocaleString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between pt-3 text-xs font-bold text-gray-700 border-t border-gray-200">
            <span>عدد الفواتير: {accountingOrders.length}</span>
            <span>قيمة الأصناف: {accTotals.itemsSubtotalSum.toLocaleString('ar-EG')} ج.م</span>
            <span>الشحن: {accTotals.shippingSum.toLocaleString('ar-EG')} ج.م</span>
            <span>الخصم: {accTotals.discountSum.toLocaleString('ar-EG')} ج.م</span>
            <span className="text-blue-950 font-black">الإجمالي النهائي: {accTotals.netTotalSum.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>
      </div>
    </div>
  );
};
