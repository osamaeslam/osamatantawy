import React from 'react';
import { AlertTriangle, Clock, Timer, CheckCircle2, MessageCircle, Inbox } from 'lucide-react';
import type { FirebaseOrder } from '../types/firebase';
import { buildCustomerWhatsAppUrl } from '../services/customer-messages';

interface Props {
  orders: FirebaseOrder[];
}

const hoursSince = (date?: string | null): number => {
  if (!date) return 0;
  const diff = Date.now() - new Date(date).getTime();
  return diff > 0 ? diff / 36e5 : 0;
};

const formatDuration = (minutes: number): string => {
  if (!isFinite(minutes) || minutes <= 0) return '—';
  if (minutes < 60) return `${Math.round(minutes)} دقيقة`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)} ساعة`;
  return `${(hours / 24).toFixed(1)} يوم`;
};

const formatWaiting = (hours: number): string => {
  if (hours < 1) return 'أقل من ساعة';
  if (hours < 24) return `${Math.round(hours)} ساعة`;
  return `${Math.round(hours / 24)} يوم`;
};

/**
 * مؤشرات خدمة العملاء:
 *  • طلبات بانتظار المتابعة (والمتأخرة أكتر من 24 ساعة)
 *  • متوسط زمن أول رد (من responded_at اللي بيتسجل بترايجر في الداتابيز)
 */
export const ServiceMetrics: React.FC<Props> = ({ orders }) => {
  const pending = orders.filter((o) => !o.status || o.status === 'pending');
  const late = pending.filter((o) => hoursSince(o.createdAt) > 24);

  const respondedOrders = orders.filter((o) => o.respondedAt && o.createdAt);
  const avgResponseMinutes = respondedOrders.length
    ? respondedOrders.reduce((sum, o) => {
        const created = new Date(o.createdAt as any).getTime();
        const responded = new Date(o.respondedAt as string).getTime();
        return sum + Math.max(0, responded - created) / 60000;
      }, 0) / respondedOrders.length
    : 0;

  const oldestHours = pending.reduce((max, o) => Math.max(max, hoursSince(o.createdAt)), 0);
  const lateSorted = [...late]
    .sort((a, b) => hoursSince(b.createdAt) - hoursSince(a.createdAt))
    .slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* بانتظار المتابعة */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-black">بانتظار المتابعة</span>
            <Inbox size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">{pending.length}</div>
          <p className="text-[10px] text-gray-400 font-bold">طلبات لسه محتاجة تسعير/تواصل</p>
        </div>

        {/* متأخرة +24 ساعة */}
        <div
          className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
            late.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-black">متأخرة أكتر من 24 ساعة</span>
            <AlertTriangle size={16} className={late.length > 0 ? 'text-red-500' : 'text-gray-300'} />
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              late.length > 0 ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            {late.length}
          </div>
          <p className={`text-[10px] font-bold ${late.length > 0 ? 'text-red-700' : 'text-gray-400'}`}>
            {late.length > 0 ? 'محتاجة متابعة فورية' : 'مفيش تأخير 👌'}
          </p>
        </div>

        {/* متوسط أول رد */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-black">متوسط زمن أول رد</span>
            <Timer size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-900">
            {respondedOrders.length ? formatDuration(avgResponseMinutes) : '—'}
          </div>
          <p className="text-[10px] text-gray-400 font-bold">محسوب على {respondedOrders.length} طلب</p>
        </div>

        {/* أقدم طلب بانتظار */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-black">أقدم طلب بانتظار</span>
            <Clock size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-900">
            {pending.length ? formatWaiting(oldestHours) : '—'}
          </div>
          <p className="text-[10px] text-gray-400 font-bold">من تاريخ وصول الطلب</p>
        </div>
      </div>

      {/* تنبيه + أسرع 3 طلبات متأخرة للتواصل */}
      {lateSorted.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-red-900">
            <AlertTriangle size={14} />
            <span className="text-[11px] font-black">
              طلبات عدّى عليها أكتر من 24 ساعة بدون متابعة
            </span>
          </div>
          <div className="space-y-1.5">
            {lateSorted.map((order) => (
              <div
                key={order.id || order.orderId}
                className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-red-100"
              >
                <div className="flex items-center gap-2 text-[11px] min-w-0">
                  <span className="font-mono font-black text-blue-950 bg-blue-50 px-2 py-0.5 rounded">
                    #{order.orderId}
                  </span>
                  <span className="font-bold text-gray-800 truncate">{order.customerName}</span>
                  <span className="text-red-700 font-black shrink-0">
                    {formatWaiting(hoursSince(order.createdAt))}
                  </span>
                </div>
                <a
                  href={buildCustomerWhatsAppUrl(
                    order.customerPhone,
                    `السلام عليكم أ/ة ${order.customerName}، مع حضرتك فريق دريم طنطاوي جروب بخصوص طلبك رقم #${order.orderId} — حبينا نطمن على الطلب ونبعتلك التفاصيل.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
                >
                  <MessageCircle size={11} />
                  تواصل الآن
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {late.length === 0 && pending.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 flex items-center gap-2 text-emerald-900">
          <CheckCircle2 size={14} />
          <span className="text-[11px] font-bold">
            كل الطلبات المعلّقة أقل من 24 ساعة — مفيش تأخير في المتابعة 👌
          </span>
        </div>
      )}
    </div>
  );
};

