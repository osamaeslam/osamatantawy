import React, { useState } from 'react';
import { MessageCircle, ChevronDown, Sparkles } from 'lucide-react';
import type { FirebaseOrder } from '../types/firebase';
import {
  ORDER_MESSAGE_TEMPLATES,
  buildOrderMessageContext,
  suggestTemplateForStatus,
  sendTemplateToCustomer,
} from '../services/customer-messages';

interface Props {
  order: FirebaseOrder;
  /** رقم العميل اللي الرسالة هتتبعت له */
  phone: string;
  label?: string;
  hotline?: string;
  className?: string;
}

/**
 * قائمة "رسائل جاهزة" لخدمة العملاء.
 * بتفتح قائمة القوالب وتبعت القالب المختار على واتساب العميل مباشرة —
 * بدون أي API، والموظف بيراجع الرسالة قبل الإرسال.
 */
export const CustomerMessageMenu: React.FC<Props> = ({
  order,
  phone,
  label = 'رسائل جاهزة',
  hotline,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const ctx = buildOrderMessageContext(order, hotline);
  const suggested = suggestTemplateForStatus(order.status);

  const handlePick = (templateId: string) => {
    const template = ORDER_MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    sendTemplateToCustomer(phone, template, ctx);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-2xs ${className}`}
        title="إرسال رسالة جاهزة للعميل على واتساب"
      >
        <MessageCircle size={13} />
        <span>{label}</span>
        <ChevronDown size={13} className={isOpen ? 'rotate-180 transition' : 'transition'} />
      </button>

      {isOpen && (
        <>
          {/* طبقة للإغلاق بالضغط خارج القائمة */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute z-50 mt-2 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[11px] font-black text-gray-700 block">اختر الرسالة المطلوبة</span>
              <span className="text-[10px] text-gray-400 font-bold">
                الرسالة بتفتح في واتساب على رقم {phone}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {ORDER_MESSAGE_TEMPLATES.map((template) => {
                const isSuggested = template.id === suggested.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handlePick(template.id)}
                    className={`w-full text-right px-3.5 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b border-gray-50 last:border-0 ${
                      isSuggested
                        ? 'bg-emerald-50/70 text-emerald-950 hover:bg-emerald-100'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base leading-none">{template.emoji}</span>
                    <span className="flex-1">{template.label}</span>
                    {isSuggested && (
                      <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                        <Sparkles size={8} />
                        مقترح
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
