import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { orderService } from '../supabase/orders.service';
import { 
  X, 
  Search, 
  Truck, 
  CheckCircle, 
  Clock, 
  PhoneCall, 
  MessageCircle, 
  ShieldCheck, 
  AlertCircle,
} from 'lucide-react';
import { TANTAWY_HOTLINE, getStoredWhatsAppNumber } from '../services/whatsapp-order';
import { OrderTimeline } from './OrderTimeline';
import type { FirebaseOrder, OrderStatusEvent } from '../types/firebase';
import { offlineStoreService } from '../services/offline-store.service';
import { STOREFRONT_TEXT, getNumberLocale } from '../i18n/translations';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
}

interface TrackedOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  quantity: number;
  totalPrice?: number;
  status: string;
  statusLabel: string;
  currentStep: number;
  expectedTime: string;
  representativeName?: string;
  representativePhone?: string;
  createdAt: string;
  address?: string;
  statusHistory?: OrderStatusEvent[];
  respondedAt?: string | null;
  assignedTo?: string | null;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialPhone = ''
}) => {
  const { orders: localAppOrders, user, language } = useApp();
  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].tracking;
  const numLocale = getNumberLocale(language);

  const [phoneNumber, setPhoneNumber] = useState(initialPhone || user.phone || '');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([]);

  useEffect(() => {
    if (initialPhone) {
      setPhoneNumber(initialPhone);
      handleSearch(initialPhone);
    } else if (user.phone) {
      setPhoneNumber(user.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPhone, user.phone]);

  if (!isOpen) return null;

  const getStatusText = (st: string): { step: number; label: string } => {
    if (st === 'cancelled') {
      return {
        step: 1,
        label: isRtl ? 'تم إلغاء هذا الطلب' : 'Order Cancelled',
      };
    }
    if (st === 'delivered' || st === 'completed') {
      return {
        step: 4,
        label: isRtl ? 'تم التسليم وسداد الفاتورة بنجاح' : 'Delivered & Settled Successfully',
      };
    }
    if (st === 'confirmed' || st === 'dispatched' || st === 'shipped') {
      return {
        step: 3,
        label: isRtl ? 'الشحنة في الطريق للتسليم والفحص' : 'Shipment Out for Delivery & Inspection',
      };
    }
    if (st === 'priced') {
      return {
        step: 2,
        label: isRtl ? 'تم تسعير الأصناف وإصدار كارت الفاتورة' : 'Items Quoted & Invoice Card Issued',
      };
    }
    if (st === 'pending_sync') {
      return {
        step: 1,
        label: isRtl
          ? 'محفوظ محلياً (أوفلاين) — بانتظار المزامنة فور عودة الإنترنت'
          : 'Saved Locally (Offline) — Waiting to Sync',
      };
    }
    return {
      step: 1,
      label: isRtl ? 'تم استلام الطلب وبانتظار التسعير والتواصل' : 'Order Received — Awaiting Quote & Contact',
    };
  };

  const handleSearch = async (overridePhone?: string) => {
    const searchTarget = (overridePhone ?? phoneNumber).trim();
    if (!searchTarget) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      let serverOrders: FirebaseOrder[] = [];
      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          serverOrders = await orderService.trackOrderByPhone(searchTarget);
        } catch {
          serverOrders = [];
        }
      }

      const localSavedOrders = await offlineStoreService.getLocalOrdersByPhone(searchTarget);
      const combined: TrackedOrder[] = [];

      const expectedDefault = isRtl
        ? 'من يومين إلى 7 أيام عمل (وفقاً للمحافظة وتأكيد الاتصال)'
        : '2–7 business days (based on governorate & phone confirmation)';
      const repDefault = isRtl ? 'فريق توصيل طنطاوي جروب' : 'Tantawy Group Delivery Team';

      serverOrders.forEach((so) => {
        const st = String(so.status).toLowerCase();
        const { step, label } = getStatusText(st);

        combined.push({
          orderId: so.orderId,
          customerName: so.customerName,
          customerPhone: so.customerPhone,
          productName: so.productNameAr,
          quantity: so.quantity,
          totalPrice: so.totalPrice,
          status: so.status as string,
          statusLabel: label,
          currentStep: step,
          expectedTime: expectedDefault,
          representativeName: so.assignedTo || repDefault,
          representativePhone: TANTAWY_HOTLINE,
          createdAt: so.createdAt || new Date().toISOString(),
          address: (so as any).customerAddress || '',
          statusHistory: so.statusHistory || (so.items?.statusHistory as OrderStatusEvent[] | undefined),
          respondedAt: so.respondedAt || null,
          assignedTo: so.assignedTo || null,
        });
      });

      localSavedOrders.forEach((so) => {
        if (!combined.some((c) => c.orderId === so.orderId)) {
          const statusKey = so.pendingSync ? 'pending_sync' : so.status || 'pending';
          const { step, label } = getStatusText(statusKey);
          combined.push({
            orderId: so.orderId,
            customerName: so.customerName || STOREFRONT_TEXT[language].brandName,
            customerPhone: so.customerPhone || searchTarget,
            productName: so.productName,
            quantity: so.quantity || 1,
            totalPrice: so.totalPrice,
            status: statusKey,
            statusLabel: label,
            currentStep: step,
            expectedTime: expectedDefault,
            representativeName: repDefault,
            representativePhone: TANTAWY_HOTLINE,
            createdAt: so.createdAt || new Date().toISOString(),
            address: so.customerAddress,
          });
        }
      });

      localAppOrders.forEach((lo) => {
        if (!combined.some((c) => c.orderId === lo.orderid)) {
          combined.push({
            orderId: lo.orderid,
            customerName: user.name || STOREFRONT_TEXT[language].brandName,
            customerPhone: searchTarget,
            productName: lo.nameAr,
            quantity: 1,
            totalPrice: lo.price,
            status: 'processing',
            statusLabel: isRtl ? 'قيد المراجعة والتجهيز' : 'Under Review & Preparation',
            currentStep: 2,
            expectedTime: expectedDefault,
            representativeName: repDefault,
            representativePhone: TANTAWY_HOTLINE,
            createdAt: lo.date || new Date().toISOString(),
            address: lo.descriptionAr,
          });
        }
      });

      setTrackedOrders(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const steps = isRtl
    ? [
        { step: 1, title: 'استلام طلب الشراء', desc: 'تم استلام وتأكيد بيانات الطلب ورقم الهاتف' },
        { step: 2, title: 'التجهيز وكارت الفاتورة', desc: 'تجهيز الجهاز بكرتونة المصنع وإصدار كارت الفاتورة' },
        { step: 3, title: 'الشحنة في الطريق', desc: 'سيصلك مندوب طنطاوي جروب بالعنوان والعلامة المميزة' },
        { step: 4, title: 'الفحص والاستلام', desc: 'فحص الجهاز واستلام الفاتورة ثم سداد القيمة' },
      ]
    : [
        { step: 1, title: 'Order Received', desc: 'Order details & phone confirmed' },
        { step: 2, title: 'Prep & Invoice Card', desc: 'Packaging & issuing official invoice' },
        { step: 3, title: 'On the Way', desc: 'Courier en route to your address' },
        { step: 4, title: 'Inspect & Pay', desc: 'Full inspection before payment' },
      ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 p-5 sm:p-7 space-y-6"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center shadow-xs">
              <Truck size={22} className="text-blue-900" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-blue-950 flex items-center gap-2 flex-wrap">
                <span>{t.title}</span>
                <span className="text-[10px] bg-yellow-400 text-blue-950 px-2 py-0.5 rounded-full font-bold">
                  {STOREFRONT_TEXT[language].brandName}
                </span>
              </h2>
              <p className="text-xs text-gray-500">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition"
            title={STOREFRONT_TEXT[language].about.close}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="space-y-2">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }} 
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t.placeholder}
                className={`w-full py-3 px-4 ${isRtl ? 'pr-11 text-right' : 'pl-11 text-left'} border border-gray-300 rounded-2xl text-sm focus:ring-2 focus:ring-blue-600 outline-none font-medium`}
                dir={isRtl ? 'rtl' : 'ltr'}
              />
              <PhoneCall size={18} className={`absolute top-3.5 ${isRtl ? 'right-3.5' : 'left-3.5'} text-gray-400`} />
            </div>

            <button
              type="submit"
              disabled={isSearching || !phoneNumber.trim()}
              className="bg-blue-900 hover:bg-blue-950 active:scale-98 text-white px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm transition disabled:opacity-50 flex items-center gap-1.5 shadow-md shrink-0"
            >
              {isSearching ? (
                <>
                  <Truck size={16} className="animate-spin" />
                  <span>{t.searching}</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>{t.trackBtn}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-5">
            {trackedOrders.length === 0 ? (
              <div className="bg-gray-50 rounded-3xl p-8 text-center space-y-3 border border-gray-200">
                <AlertCircle size={40} className="text-amber-500 mx-auto" />
                <h3 className="font-bold text-gray-800 text-sm">{t.notFoundTitle}</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">{t.notFoundSub}</p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href="tel:15218"
                    className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <PhoneCall size={14} />
                    <span>{STOREFRONT_TEXT[language].footer.hotlineFull}</span>
                  </a>
                  <a
                    href={`https://wa.me/${getStoredWhatsAppNumber()}?text=${encodeURIComponent(
                      isRtl
                        ? `السلام عليكم، أود الاستفسار عن موعد تسليم طلبي لدى طنطاوي جروب برقم هاتف: ${phoneNumber}`
                        : `Hello, I'd like to check the delivery status of my Tantawy Group order for phone: ${phoneNumber}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle size={14} />
                    <span>{t.whatsappSupportBtn}</span>
                  </a>
                </div>
              </div>
            ) : (
              trackedOrders.map((order, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-3xl border border-blue-100 shadow-md p-5 sm:p-6 space-y-5"
                >
                  {/* Order Top Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md inline-block">
                        {t.orderNoPrefix} #{order.orderId}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-gray-900 mt-1">
                        {order.productName}
                      </h3>
                    </div>
                    <div className={isRtl ? 'text-left' : 'text-right'}>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200 inline-block">
                        {order.statusLabel}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {t.orderDatePrefix} {new Date(order.createdAt).toLocaleDateString(numLocale)}
                      </p>
                    </div>
                  </div>

                  {/* 4-Step Interactive Progress Tracker */}
                  <div className="py-2">
                    <div className="relative">
                      <div className="absolute top-5 right-6 left-6 h-1 bg-gray-200 z-0">
                        <div 
                          className="h-full bg-blue-900 transition-all duration-700"
                          style={{ width: `${((order.currentStep - 1) / 3) * 100}%` }}
                        />
                      </div>

                      <div className="relative z-10 flex justify-between">
                        {steps.map((st) => {
                          const isDone = st.step <= order.currentStep;
                          const isCurrent = st.step === order.currentStep;

                          return (
                            <div key={st.step} className="flex flex-col items-center text-center max-w-[70px] sm:max-w-[90px]">
                              <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm ${
                                  isDone
                                    ? 'bg-blue-900 text-white'
                                    : 'bg-white text-gray-400 border-2 border-gray-200'
                                } ${isCurrent ? 'ring-4 ring-blue-100 scale-110' : ''}`}
                              >
                                {isDone ? <CheckCircle size={18} /> : st.step}
                              </div>
                              <span className={`text-[11px] font-black mt-2 leading-tight ${isDone ? 'text-blue-950' : 'text-gray-400'}`}>
                                {st.title}
                              </span>
                              <span className="text-[9px] text-gray-400 mt-0.5 hidden sm:block">
                                {st.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Delivery & Inspector Details Card */}
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-600 font-bold flex items-center gap-1.5">
                        <Clock size={14} className="text-blue-900" />
                        <span>{t.expectedEtaLabel}</span>
                      </span>
                      <strong className="text-blue-950">{order.expectedTime}</strong>
                    </div>

                    {order.representativeName && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-600 font-bold flex items-center gap-1.5">
                          <Truck size={14} className="text-blue-900" />
                          <span>{t.repLabel}</span>
                        </span>
                        <strong className="text-gray-800">{order.representativeName}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-gray-600 font-bold flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-700" />
                        <span>{t.codPolicyLabel}</span>
                      </span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {t.codPolicyVal}
                      </span>
                    </div>

                    {Number(order.totalPrice) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-bold">{t.invoiceTotalLabel}</span>
                        <strong className="font-mono text-sm font-black text-blue-950 tabular-nums">
                          {Number(order.totalPrice).toLocaleString(numLocale)} {STOREFRONT_TEXT[language].bundles.egp}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Timestamped Milestones Timeline */}
                  <OrderTimeline
                    compact
                    order={
                      {
                        orderId: order.orderId,
                        customerName: order.customerName,
                        customerPhone: order.customerPhone,
                        productId: '',
                        productNameAr: order.productName,
                        selectedColor: '',
                        selectedSize: '',
                        quantity: order.quantity,
                        totalPrice: order.totalPrice || 0,
                        status: (order.status as FirebaseOrder['status']) || 'pending',
                        createdAt: order.createdAt,
                        respondedAt: order.respondedAt || null,
                        assignedTo: order.assignedTo || null,
                        statusHistory: order.statusHistory,
                      } as FirebaseOrder
                    }
                  />

                  {/* Direct Contact Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <a
                      href="tel:15218"
                      className="bg-blue-900 hover:bg-blue-950 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <PhoneCall size={15} className="text-yellow-400" />
                      <span>{t.callHotlineBtn}</span>
                    </a>

                    <a
                      href={`https://wa.me/${getStoredWhatsAppNumber()}?text=${encodeURIComponent(
                        isRtl
                          ? `السلام عليكم، أود متابعة طلبي رقم #${order.orderId} (${order.productName}) - موعد خروج الشحنة`
                          : `Hello, I want to follow up on Order #${order.orderId} (${order.productName}) delivery status`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <MessageCircle size={15} />
                      <span>{t.whatsappSupportBtn}</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-600 font-medium">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>{t.footerGuarantee}</span>
        </div>
      </div>
    </div>
  );
};
