import React, { useState } from 'react';
import type { FirebaseProduct } from '../types/firebase';
import { orderService } from '../supabase/order.service';
import { sendInvoiceToWhatsApp } from '../services/invoice-to-whatsapp';
import { PhoneCall, MapPin, User, ShoppingCart, Send, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CustomerOrderFormProps {
  product: FirebaseProduct;
  onOrderComplete?: () => void;
}

export const CustomerOrderForm: React.FC<CustomerOrderFormProps> = ({
  product,
  onOrderComplete,
}) => {
  const { setIsOrderTrackingOpen, setTrackingPhone } = useApp();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    quantity: '1',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const estimatedPrice = (product.discountedPrice ?? product.price) * Number(form.quantity);
      const orderId = `TG-${Date.now().toString().slice(-6)}`;

      await orderService.create({
        orderId,
        customerPhone: form.phone,
        customerName: form.name,
        productId: product.id || '',
        productNameAr: product.nameAr,
        selectedColor: '',
        selectedSize: '',
        quantity: Number(form.quantity),
        totalPrice: estimatedPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
        whatsappMessageId: '',
      });

      const orderData: any = {
        orderId,
        customerName: form.name,
        customerPhone: form.phone,
        customerAddress: form.address,
        items: [
          {
            nameAr: product.nameAr,
            quantity: Number(form.quantity),
            image: product.imageUrl || (product as any).previewimage,
          },
        ],
        totalPrice: estimatedPrice,
        createdAt: new Date().toISOString(),
      };
      sendInvoiceToWhatsApp(orderData);

      setSuccess(true);
      onOrderComplete?.();
    } catch (err: any) {
      alert('فشل في إرسال الطلب: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <PhoneCall size={48} className="text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-green-800 mb-2">تم إرسال طلبك بنجاح ✅</h2>
        <p className="text-green-700 text-sm mb-6">
          سيقوم فريق المبيعات بالتواصل معك عبر رقم التليفون لتأكيد السعر وموعد التوصيل.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setTrackingPhone(form.phone);
              setIsOrderTrackingOpen(true);
            }}
            className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-black py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Truck size={18} />
            <span>تتبع موعد وصول المندوب الآن 🚚</span>
          </button>
          <button
            onClick={() => {
              setForm({ name: '', phone: '', address: '', quantity: '1' });
              setSuccess(false);
              onOrderComplete?.();
            }}
            className="bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 px-6 rounded-xl transition"
          >
            طلب منتج آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-200 max-w-lg mx-auto">
      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <ShoppingCart size={20} />
        </div>
        <h2 className="text-xl font-black text-blue-900 ml-3">طلب منتج</h2>
      </div>

      <p className="text-sm text-gray-600 text-center mb-6">
        منتج: <span className="font-bold text-blue-700">{product.nameAr}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">اسمك الكامل</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="الاسم بالكامل أو اسم المستلم"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">رقم التليفون</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="مثال: 01012345678"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">العنوان للتوصيل</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="مثال: القاهرة، مصر الجديدة، شبرا، عمارة 5"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">الكمية المطلوبة</label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
            placeholder="1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right"
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <PhoneCall size={16} className="mr-2" />
          ملاحظة: الأسعار غير معروضة على الموقع لأنها للتجارة بالجملة.
          سيتم التواصل معك لتأكيد السعر النهائي قبل التوصيل، والدفع يكون عند الاستلام بعد المعاينة.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <PhoneCall size={18} className="animate-spin" />
              جاري إرسال الطلب...
            </>
          ) : (
            <>
              <Send size={18} />
              إرسال الطلب لفريق المبيعات
            </>
          )}
        </button>
      </form>
    </div>
  );
};