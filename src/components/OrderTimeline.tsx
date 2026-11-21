import React from 'react';
import type { FirebaseOrder, OrderStatusEvent } from '../types/firebase';
import { Clock, DollarSign, CheckCircle2, Truck, PackageCheck, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getNumberLocale, type AppLanguage } from '../i18n/translations';

interface OrderTimelineProps {
  order: FirebaseOrder;
  compact?: boolean;
}

const STATUS_META: Record<
  FirebaseOrder['status'],
  { labelAr: string; labelEn: string; icon: React.ReactNode; activeBg: string; activeText: string; border: string }
> = {
  pending: {
    labelAr: 'استلام الطلب',
    labelEn: 'Order Received',
    icon: <Clock size={12} />,
    activeBg: 'bg-amber-50',
    activeText: 'text-amber-800',
    border: 'border-amber-200',
  },
  priced: {
    labelAr: 'تم التسعير',
    labelEn: 'Quoted',
    icon: <DollarSign size={12} />,
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-900',
    border: 'border-blue-200',
  },
  confirmed: {
    labelAr: 'تأكيد الشراء',
    labelEn: 'Confirmed',
    icon: <CheckCircle2 size={12} />,
    activeBg: 'bg-purple-50',
    activeText: 'text-purple-900',
    border: 'border-purple-200',
  },
  dispatched: {
    labelAr: 'مع المندوب',
    labelEn: 'Out for Delivery',
    icon: <Truck size={12} />,
    activeBg: 'bg-indigo-50',
    activeText: 'text-indigo-900',
    border: 'border-indigo-200',
  },
  delivered: {
    labelAr: 'تم التسليم',
    labelEn: 'Delivered',
    icon: <PackageCheck size={12} />,
    activeBg: 'bg-emerald-50',
    activeText: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  cancelled: {
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    icon: <XCircle size={12} />,
    activeBg: 'bg-red-50',
    activeText: 'text-red-800',
    border: 'border-red-200',
  },
};

export const formatEventTime = (iso?: string | null, lang: AppLanguage = 'ar'): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(getNumberLocale(lang), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const extractOrderHistory = (order: FirebaseOrder, lang: AppLanguage = 'ar'): OrderStatusEvent[] => {
  const fromField = Array.isArray(order.statusHistory) ? order.statusHistory : null;
  const fromItems = Array.isArray(order.items?.statusHistory) ? order.items.statusHistory : null;
  const base = fromField || fromItems;

  if (base && base.length > 0) return base;

  const fallback: OrderStatusEvent[] = [
    {
      status: 'pending',
      timestamp: order.createdAt || new Date().toISOString(),
      note: lang === 'en' ? 'Order received' : 'استلام الطلب',
    },
  ];
  if (order.respondedAt && order.status !== 'pending') {
    fallback.push({
      status: order.status,
      timestamp: order.respondedAt,
      note: lang === 'en' ? 'Status update' : 'تحديث الحالة',
    });
  } else if (order.status && order.status !== 'pending') {
    fallback.push({
      status: order.status,
      timestamp: order.assignedAt || order.createdAt || new Date().toISOString(),
    });
  }
  return fallback;
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order, compact = false }) => {
  const { language } = useApp();
  const isRtl = language === 'ar';
  const history = extractOrderHistory(order, language);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-[11px]">
        <span className="text-gray-500 font-bold shrink-0">
          {isRtl ? 'السجل الزمني:' : 'Timeline:'}
        </span>
        {history.map((ev, idx) => {
          const meta = STATUS_META[ev.status] || STATUS_META.pending;
          const label = isRtl ? meta.labelAr : meta.labelEn;
          return (
            <React.Fragment key={`${ev.status}-${idx}`}>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-bold ${meta.activeBg} ${meta.activeText} ${meta.border}`}
                title={ev.note || label}
              >
                {meta.icon}
                <span>{label}</span>
                <span className="font-mono text-[10px] opacity-80 tabular-nums">
                  ({formatEventTime(ev.timestamp, language)})
                </span>
              </span>
              {idx < history.length - 1 && (
                <span className="text-gray-300 font-bold" aria-hidden="true">
                  {isRtl ? '←' : '→'}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 text-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <span className="font-black text-slate-900 flex items-center gap-1.5">
          <Clock size={14} className="text-blue-900" />
          <span>{isRtl ? 'السجل الزمني الكامل لتتبع مراحل الطلب' : 'Full Order Tracking Timeline'}</span>
        </span>
        {order.assignedTo && (
          <span className="text-[11px] font-bold text-indigo-900">
            {isRtl ? 'المسؤول:' : 'Assigned:'} {order.assignedTo}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {history.map((ev, idx) => {
          const meta = STATUS_META[ev.status] || STATUS_META.pending;
          const label = isRtl ? meta.labelAr : meta.labelEn;
          return (
            <div
              key={`${ev.status}-${idx}`}
              className="flex items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-xl px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold shrink-0 ${meta.activeBg} ${meta.activeText} ${meta.border}`}
                >
                  {meta.icon}
                  <span>{label}</span>
                </span>
                {ev.note && (
                  <span className="text-[11px] text-gray-600 truncate">{ev.note}</span>
                )}
                {ev.actor && (
                  <span className="text-[10px] text-gray-400 shrink-0">· {ev.actor}</span>
                )}
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-700 tabular-nums shrink-0" dir="ltr">
                {formatEventTime(ev.timestamp, language)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
