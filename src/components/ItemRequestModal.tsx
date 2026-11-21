import React, { useState } from 'react';
import { X, Search, Upload, CheckCircle2, AlertCircle, MessageCircle, Loader2, ImageIcon } from 'lucide-react';
import { itemRequestService } from '../services/item-requests.service';
import { normalizeWhatsAppNumber, TANTAWY_DEFAULT_SALES_PHONE } from '../services/whatsapp-order';
import { offlineStoreService, isLikelyOfflineError } from '../services/offline-store.service';
import { useApp } from '../context/AppContext';
import { STOREFRONT_TEXT } from '../i18n/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
  initialItemName?: string;
}

const EMPTY = { name: '', phone: '', itemName: '', details: '', imageLink: '' };

export const ItemRequestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  whatsappNumber,
  initialItemName = '',
}) => {
  const { language } = useApp();
  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].itemRequest;
  const to = STOREFRONT_TEXT[language].outOfStock;

  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  React.useEffect(() => {
    if (isOpen && initialItemName) {
      setForm((prev) => ({ ...prev, itemName: initialItemName }));
    }
  }, [isOpen, initialItemName]);

  if (!isOpen) return null;

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = (picked?: File | null) => {
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError(isRtl ? 'الملف لازم يكون صورة (JPG / PNG).' : 'File must be an image (JPG / PNG).');
      return;
    }
    if (picked.size > 5 * 1024 * 1024) {
      setError(isRtl ? 'حجم الصورة كبير — الحد الأقصى 5 ميجا.' : 'Image is too large — max size is 5MB.');
      return;
    }
    setError('');
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const whatsappFallback = () => {
    const phone = normalizeWhatsAppNumber(whatsappNumber || TANTAWY_DEFAULT_SALES_PHONE);
    const text = isRtl
      ? `السلام عليكم، بندور على صنف مش موجود في الكتالوج:\n• الصنف: ${form.itemName}\n• تفاصيل: ${form.details || '-'}\n• الاسم: ${form.name}\n• الموبايل: ${form.phone}`
      : `Hello, looking for an unlisted item:\n• Item: ${form.itemName}\n• Details: ${form.details || '-'}\n• Name: ${form.name}\n• Mobile: ${form.phone}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const close = () => {
    setForm(EMPTY);
    setFile(null);
    setPreview(null);
    setError('');
    setPhoneError('');
    setDone(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = form.phone.replace(/[^0-9]/g, '');
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      setPhoneError(to.invalidPhone);
      return;
    }
    setPhoneError('');

    if (!form.name.trim() || !form.itemName.trim()) {
      setError(isRtl ? 'من فضلك اكتب اسمك واسم الصنف المطلوب.' : 'Please enter your name and requested item.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = form.imageLink.trim() || undefined;
      const isOfflineNow = typeof navigator !== 'undefined' && !navigator.onLine;

      if (file && !isOfflineNow) {
        try {
          imageUrl = await itemRequestService.uploadImage(file);
        } catch (uploadErr: any) {
          console.warn(uploadErr);
        }
      }

      const payload = {
        customerName: form.name,
        customerPhone: cleanPhone,
        itemName: form.itemName,
        details: form.details,
        imageUrl,
      };

      if (isOfflineNow) {
        await offlineStoreService.enqueueAction('item_request', payload);
      } else {
        try {
          await itemRequestService.create(payload);
        } catch (err) {
          if (!isLikelyOfflineError(err)) throw err;
          await offlineStoreService.enqueueAction('item_request', payload);
        }
      }

      setDone(true);
    } catch (err: any) {
      setError(err.message || (isRtl ? 'تعذر إرسال الطلب. جرّب مرة أخرى.' : 'Failed to submit request. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={close}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="bg-gradient-to-l from-blue-950 to-blue-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Search size={20} className="text-yellow-400" />
            <div>
              <h3 className="text-sm font-black">{t.title}</h3>
              <p className="text-[11px] text-blue-200">{t.subtitle}</p>
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-full hover:bg-white/10 transition" aria-label={STOREFRONT_TEXT[language].about.close}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-7 text-center space-y-3">
            <CheckCircle2 size={46} className="text-emerald-600 mx-auto" />
            <h4 className="text-lg font-black text-gray-900">{t.doneTitle}</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {isRtl ? (
                <>
                  سجّلنا الصنف اللي بتدور عليه. فريق المشتريات بيراجعه، وهنبلغك على{' '}
                  <strong className="font-mono" dir="ltr">{form.phone}</strong> أول ما يتوفر.
                </>
              ) : (
                <>
                  We logged your request. Our sourcing team will check and notify you on{' '}
                  <strong className="font-mono" dir="ltr">{form.phone}</strong> as soon as available.
                </>
              )}
            </p>
            <button
              onClick={close}
              className="w-full bg-blue-900 hover:bg-blue-950 text-white font-black py-3 rounded-xl text-sm transition"
            >
              {t.doneBtn}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-[11px] font-bold p-3 rounded-xl flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t.yourName}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder={isRtl ? 'الاسم بالكامل' : 'Full Name'}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t.yourPhone}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-mono font-bold text-left focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
                {phoneError && <p className="text-[10px] text-red-600 font-bold mt-1">{phoneError}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.itemName}</label>
              <input
                type="text"
                value={form.itemName}
                onChange={(e) => set('itemName', e.target.value)}
                placeholder={isRtl ? 'مثال: طقم صيني 60 قطعة موديل معين' : 'e.g., Specific air fryer or cookware set model'}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.details}</label>
              <textarea
                value={form.details}
                onChange={(e) => set('details', e.target.value)}
                rows={2}
                placeholder={isRtl ? 'الكمية المطلوبة، اللون، الماركة، أو أي وصف يساعدنا نجيبه' : 'Quantity needed, color, brand, or specs to help us source it'}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none resize-none"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-black text-gray-700 block">
                {t.photoLabel}
              </span>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition">
                  <Upload size={13} />
                  <span>{file ? (isRtl ? 'تغيير الصورة' : 'Change Photo') : (isRtl ? 'اختار صورة' : 'Choose Photo')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </label>
                {preview && (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-11 h-11 rounded-lg object-cover border border-gray-200"
                  />
                )}
                {!preview && <ImageIcon size={16} className="text-gray-300" />}
              </div>
              <input
                type="url"
                value={form.imageLink}
                onChange={(e) => set('imageLink', e.target.value)}
                placeholder={isRtl ? 'أو الصق رابط صورة من النت' : 'Or paste an image URL'}
                dir="ltr"
                className="w-full p-2 border border-gray-300 rounded-lg text-[11px] font-mono text-left focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-900 hover:bg-blue-950 text-white font-black py-3 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span>{submitting ? t.sending : t.submitBtn}</span>
            </button>

            <button
              type="button"
              onClick={whatsappFallback}
              className="w-full text-emerald-800 hover:underline text-[11px] font-bold flex items-center justify-center gap-1"
            >
              <MessageCircle size={12} />
              {t.whatsappAlt}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

