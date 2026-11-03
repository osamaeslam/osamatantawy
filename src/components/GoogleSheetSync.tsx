import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { productService } from '../supabase/products.service';
import { supabase } from '../supabase/config';
import { getSafeImageSrc } from '../utils/imageHelper';
import { 
  FileSpreadsheet, 
  Link2, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  Layers, 
  RotateCcw,
  Sparkles,
  Trash2
} from 'lucide-react';

// الأعمدة الـ 9 المعتمدة حرفياً
export const REQUIRED_COLUMNS = [
  'Item number',
  'كود موحد',
  'اسم المنتج',
  'Size',
  'Color',
  'Item group',
  'Family Name',
  'لينك الصور',
  'القطاع'
];

export const GoogleSheetSync: React.FC = () => {
  const { products, importProducts, resetProductsToDefault } = useApp();

  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [previewProducts, setPreviewProducts] = useState<Product[] | null>(null);
  const [activeView, setActiveView] = useState<'sheet' | 'file'>('sheet');

  // تحويل رابط جوجل شيت العادي إلى رابط تصدير CSV مباشر
  const convertGoogleSheetUrlToCsv = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return '';

    // إذا كان الرابط بالفعل رابط CSV
    if (trimmed.includes('export?format=csv') || trimmed.includes('output=csv')) {
      return trimmed;
    }

    // استخراج Sheet ID من رابط docs.google.com/spreadsheets/d/{ID}/...
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      // استخراج gid إن وجد
      const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }

    return trimmed;
  };

  // تطبيع وتعيين الأعمدة التسعة من أي تسميات محتملة
  const mapRowToProduct = (row: Record<string, any>, index: number): Product | null => {
    // Helper to get case-insensitive and trimmed key
    const getValue = (targetNames: string[]): string => {
      for (const key of Object.keys(row)) {
        const cleanKey = key.trim().toLowerCase();
        for (const target of targetNames) {
          if (cleanKey === target.trim().toLowerCase()) {
            return String(row[key] ?? '').trim();
          }
        }
      }
      return '';
    };

    const itemNumber = getValue(['Item number', 'item_number', 'item number', 'رقم الصنف', 'رقم المنتج', 'item no']);
    const unifiedCode = getValue(['كود موحد', 'unified_code', 'unified code', 'كود', 'code', 'باركود']);
    const nameAr = getValue(['اسم المنتج', 'اسم الصنف', 'product_name', 'name', 'product name', 'الاسم']);
    const size = getValue(['Size', 'size', 'مقاس', 'المقاس', 'الحجم']);
    const color = getValue(['Color', 'color', 'اللون', 'لون']);
    const itemGroup = getValue(['Item group', 'item_group', 'item group', 'مجموعة الصنف', 'المجموعة']);
    const familyName = getValue(['Family Name', 'family_name', 'family name', 'العائلة', 'اسم العائلة']);
    const imageLink = getValue(['لينك الصور', 'رابط الصورة', 'لينك الصورة', 'image_link', 'image', 'photo', 'url']);
    const rawSector = getValue(['القطاع', 'قطاع', 'sector', 'القسم', 'category']);

    if (!nameAr && !unifiedCode && !itemNumber) {
      return null;
    }

    // تصنيف القطاع المعتمد
    let sector = 'أجهزة منزلية';
    if (rawSector.includes('كهرب') || rawSector.toLowerCase().includes('electric')) {
      sector = 'أجهزة كهربيه';
    } else if (rawSector.includes('منزل') || rawSector.toLowerCase().includes('home')) {
      sector = 'أجهزة منزلية';
    } else if (rawSector.trim()) {
      sector = rawSector.trim();
    }

    const fallbackImage = sector === 'أجهزة كهربيه'
      ? 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80';

    const finalImage = imageLink && imageLink.startsWith('http') ? imageLink : fallbackImage;
    const finalName = nameAr || `منتج كود ${unifiedCode || itemNumber || index + 1}`;

    return {
      id: `custom-${unifiedCode || itemNumber || index + 1}-${Date.now().toString(36)}`,
      name: finalName,
      nameAr: finalName,
      category: sector === 'أجهزة كهربيه' ? 'Electrical Appliances' : 'Home Appliances',
      categoryAr: sector,
      summary: `${familyName || itemGroup || sector} - كود: ${unifiedCode || 'موحد'}`,
      summaryAr: `${familyName || itemGroup || sector} - كود: ${unifiedCode || 'موحد'}`,
      description: `منتج عالي الجودة من طنطاوي جروب. المقاس: ${size || 'قياسي'} - اللون: ${color || 'متعدد'} - العائلة: ${familyName || 'عام'}. معاينة مجانية قبل الدفع.`,
      descriptionAr: `منتج عالي الجودة من طنطاوي جروب. المقاس: ${size || 'قياسي'} - اللون: ${color || 'متعدد'} - العائلة: ${familyName || 'عام'}. معاينة مجانية قبل الدفع.`,
      actualprice: 0,
      discountpercent: 0,
      overallrating: 4.8,
      previewimage: finalImage,
      previewimages: [finalImage],
      reviews: [],
      quantities: ['1', '2', '3', '5'],
      sizevariants: size ? [size] : ['قياسي'],
      isDeal: index % 4 === 0,
      inStock: true,
      brand: 'طنطاوي جروب',
      itemNumber: itemNumber || `ITM-${index + 1}`,
      unifiedCode: unifiedCode || `TG-${index + 100}`,
      size: size || 'قياسي',
      color: color || 'أصلي',
      itemGroup: itemGroup || 'عام',
      familyName: familyName || (sector === 'أجهزة كهربيه' ? 'أجهزة كهربائية' : 'أجهزة منزلية'),
      imageLink: finalImage,
      sector: sector
    };
  };

  // مزامنة فورية من رابط جوجل شيت
  const handleSyncGoogleSheet = async () => {
    if (!sheetUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'يرجى إدخال رابط جوجل شيت أولاً' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const csvUrl = convertGoogleSheetUrlToCsv(sheetUrl);
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`تعذر جلب البيانات من الرابط (كود: ${response.status}). يرجى التأكد من أن ملف الشيت متاح للجميع عبر الرابط (Anyone with the link can view)`);
      }

      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        throw new Error('ملف الشيت فارغ أو لا يحتوي على صفوف صالحة');
      }

      const mapped: Product[] = [];
      rawRows.forEach((row, i) => {
        const p = mapRowToProduct(row, i);
        if (p) mapped.push(p);
      });

      if (mapped.length === 0) {
        throw new Error('لم يتم العثور على منتجات صالحة. يرجى التحقق من وجود الأعمدة الـ 9 المطلوبة');
      }

      setPreviewProducts(mapped);
      setStatusMessage({
        type: 'success',
        text: `تم استيراد ${mapped.length} منتج بنجاح من جوجل شيت! يمكنك مراجعة المعاينة أدناه ثم النقر على "تطبيق وتحديث الكتالوج فوراً".`
      });
    } catch (err: any) {
      console.error('Google Sheet Sync Error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء مزامنة جوجل شيت'
      });
    } finally {
      setLoading(false);
    }
  };

  // رفع ملف إكسل من الجهاز
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('الملف فارغ أو لا يحتوي على صفوف بيانات');
        }

        const mapped: Product[] = [];
        rawRows.forEach((row, i) => {
          const p = mapRowToProduct(row, i);
          if (p) mapped.push(p);
        });

        if (mapped.length === 0) {
          throw new Error('لم يتم التعرف على أي أصناف مطابقة للأعمدة');
        }

        setPreviewProducts(mapped);
        setStatusMessage({
          type: 'success',
          text: `تمت قراءة ${mapped.length} صنف من ملف الإكسل بنجاح!`
        });
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err.message || 'خطأ في معالجة ملف الإكسل' });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // تطبيق المنتجات في الكتالوج
  const applyImportedProducts = async () => {
    if (!previewProducts || previewProducts.length === 0) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Save to local state and localStorage (existing behavior)
      importProducts(previewProducts);

      // 2. Also save to Supabase database using batch insert
      // Prepare products for Supabase - map from Product type to FirebaseProduct fields
      const supabaseItems = previewProducts.map((p) => ({
        nameAr: p.nameAr,
        nameEn: p.name || p.nameAr,
        category: p.categoryAr || p.category || 'Home Appliances',
        categoryAr: p.categoryAr || p.categoryAr || 'أجهزة منزلية',
        price: typeof p.actualprice === 'number' ? p.actualprice : 0,
        discountedPrice: typeof p.discountpercent === 'number' && p.discountpercent > 0 ? Math.round(p.actualprice * (p.discountpercent / 100)) : 0,
        imageUrl: p.imageLink || p.previewimage || '',
        colors: p.color ? [p.color] : [],
        sizes: p.sizevariants || [p.size || 'قياسي'],
        inStock: p.inStock !== undefined ? p.inStock : true,
        brand: p.brand || '',
        createdAt: new Date().toISOString(),
      }));

      // Batch insert into Supabase (limit to avoid timeout, split if too many)
      const BATCH_SIZE = 500;
      const totalItems = supabaseItems.length;
      let successCount = 0;

      for (let i = 0; i < totalItems; i += BATCH_SIZE) {
        const batch = supabaseItems.slice(i, i + BATCH_SIZE);
        try {
          await productService.batchCreate(batch);
          successCount += batch.length;
        } catch (batchError) {
          console.error(`Batch insert error at index ${i}:`, batchError);
          // Continue with remaining batches even if one fails
        }
      }

      // 3. Force refresh products from Supabase so all users see the update
      // We need to update the app context products from the database
      try {
        const { data: serverProducts, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (!error && serverProducts) {
          // Update localStorage with fresh data from server
          const normalizedProducts = serverProducts.map((item: any) => ({
            id: item.id,
            name: item.name_ar || item.name_en || 'منتج جديد',
            nameAr: item.name_ar,
            nameEn: item.name_en,
            category: item.category || 'Home Appliances',
            categoryAr: item.category_ar || 'أجهزة منزلية',
            summary: '',
            summaryAr: '',
            description: '',
            descriptionAr: '',
            actualprice: item.price || 0,
            discountpercent: item.discounted_price ? Math.round((1 - (item.discounted_price / item.price)) * 100) : 0,
            overallrating: 0,
            previewimage: item.image_url || '',
            previewimages: item.image_url ? [item.image_url] : [],
            reviews: [],
            quantities: ['1'],
            sizevariants: ['قياسي'],
            isDeal: false,
            dealEndsIn: '',
            inStock: item.in_stock !== false,
            brand: item.brand || '',
            itemNumber: '',
            unifiedCode: '',
            size: 'قياسي',
            color: 'أصلي',
            itemGroup: '',
            familyName: '',
            sector: item.category_ar || 'أجهزة منزلية',
          } as Product));
          localStorage.setItem('tantawy_custom_products', JSON.stringify(normalizedProducts));
          // Update the products state immediately
          importProducts(normalizedProducts);
          console.log('✅ Products refreshed from Supabase after import');
        }
      } catch (refreshError) {
        console.warn('Could not refresh products from server, using local data:', refreshError);
      }

      setStatusMessage({
        type: 'success',
        text: `🎉 تم تحديث كتالوج طنطاوي جروب بنجاح! تم اعتماد ${previewProducts.length} صنف (${successCount} تم حفظها في قاعدة البيانات).`
      });
    } catch (err: any) {
      console.error('Error applying imported products:', err);
      setStatusMessage({
        type: 'error',
        text: `❌ خطأ في تطبيق الاستيراد: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // تنزيل نموذج إكسل جاهز يحتوي على الأعمدة الـ 9 والأصناف الحالية
  const handleDownloadTemplate = () => {
    const rows = products.map((p, idx) => ({
      'Item number': p.itemNumber || `ITM-${idx + 1}`,
      'كود موحد': p.unifiedCode || `TG-${idx + 100}`,
      'اسم المنتج': p.nameAr,
      'Size': p.size || 'قياسي',
      'Color': p.color || 'أصلي',
      'Item group': p.itemGroup || (p.sector === 'أجهزة كهربيه' ? 'كهرباء' : 'منزلي'),
      'Family Name': p.familyName || p.categoryAr,
      'لينك الصور': p.imageLink || p.previewimage,
      'القطاع': p.sector || p.categoryAr
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: REQUIRED_COLUMNS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'منتجات طنطاوي جروب');
    XLSX.writeFile(workbook, 'Tantawy_Group_Products_Template.xlsx');
  };

  const homeAppliancesCount = products.filter(p => p.sector === 'أجهزة منزلية' || p.categoryAr === 'أجهزة منزلية').length;
  const electricAppliancesCount = products.filter(p => p.sector === 'أجهزة كهربيه' || p.categoryAr === 'أجهزة كهربيه').length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">إجمالي أصناف الكتالوج</span>
            <Layers className="text-blue-700" size={20} />
          </div>
          <div className="text-2xl font-black text-blue-950">{products.length} صنف</div>
          <div className="text-[11px] text-gray-500 mt-1">يتم تحديثها فورياً مع حفظ دائم</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900">أجهزة منزلية</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">القطاع 1</span>
          </div>
          <div className="text-2xl font-black text-blue-900">{homeAppliancesCount} صنف</div>
          <div className="text-[11px] text-gray-500 mt-1">ثلاجات، غسالات، بوتاجازات، فريزر...</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900">أجهزة كهربيه</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">القطاع 2</span>
          </div>
          <div className="text-2xl font-black text-amber-900">{electricAppliancesCount} صنف</div>
          <div className="text-[11px] text-gray-500 mt-1">شاشات، تكييفات، مكانس، أجهزة خفيفة...</div>
        </div>
      </div>

      {/* Main Import Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" size={22} />
              <span>مزامنة شيت جوجل ورفع ملفات الإكسل (9 أعمدة معتمدة)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              الربط المباشر مع شيت الإدارة عبر الأعمدة: Item number • كود موحد • اسم المنتج • Size • Color • Item group • Family Name • لينك الصور • القطاع
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              title="تنزيل شيت إكسل جاهز بنفس الأعمدة التسعة والبيانات الحالية"
            >
              <Download size={15} />
              <span>تنزيل نموذج إكسل جاهز 📥</span>
            </button>
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من مسح وتفريغ كافة الأصناف التجريبية الحالية؟ سيمكنك بعد ذلك مزامنة شيت جوجل الخاص بك ليعرض المتجر أصنافك فقط.')) {
                  importProducts([]);
                  setPreviewProducts(null);
                  setStatusMessage({
                    type: 'info',
                    text: 'تم تفريغ كافة المنتجات التجريبية بنجاح! المتجر الآن فارغ وجاهز لمزامنة شيت جوجل الخاص بك بالكامل.'
                  });
                }
              }}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5"
              title="تفريغ الكتالوج من البيانات التجريبية للبدء بشيت جوجل"
            >
              <Trash2 size={14} />
              <span>مسح الأصناف التجريبية 🗑️</span>
            </button>
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من استعادة الكتالوج الأساسي الافتراضي؟')) {
                  resetProductsToDefault();
                  setPreviewProducts(null);
                  setStatusMessage({ type: 'info', text: 'تمت استعادة الأصناف الأساسية المعتمدة بنجاح.' });
                }
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5"
              title="استعادة الـ 36 صنف الأساسيين المعتمدين"
            >
              <RotateCcw size={14} />
              <span>استعادة الأساسي</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('sheet')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeView === 'sheet'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Link2 size={15} />
            <span>رابط جوجل شيت المباشر (Google Sheets URL)</span>
          </button>
          <button
            onClick={() => setActiveView('file')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeView === 'file'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Upload size={15} />
            <span>رفع ملف إكسل من جهازك (.xlsx / .csv)</span>
          </button>
        </div>

        {/* View 1: Google Sheet URL Input */}
        {activeView === 'sheet' && (
          <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-blue-950">
                الصق رابط شيت جوجل (Google Sheet URL) هنا:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit..."
                  className="flex-1 bg-white border border-blue-300 rounded-xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  dir="ltr"
                />
                <button
                  onClick={handleSyncGoogleSheet}
                  disabled={loading}
                  className="bg-blue-900 hover:bg-blue-950 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 shadow-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>جاري المزامنة...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={15} />
                      <span>مزامنة فورية الآن ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white/80 rounded-xl p-3 border border-blue-200/60 text-[11px] text-blue-900 space-y-1">
              <p className="font-bold">💡 كيفية تفعيل رابط جوجل شيت للمزامنة:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-gray-600 pr-2">
                <li>افتح شيت جوجل الخاص بك واضغط على زر <b>مشاركة (Share)</b> في الأعلى.</li>
                <li>اجعل الإذن: <b>أي شخص لديه الرابط يمكنه المشاهدة (Anyone with the link can view)</b>.</li>
                <li>انسخ رابط الشيت والصقه هنا واضغط <b>مزامنة فورية</b> وسيقوم النظام بتحديث كل الأصناف مباشرة.</li>
              </ol>
            </div>
          </div>
        )}

        {/* View 2: Local File Upload */}
        {activeView === 'file' && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-3">
            <Upload size={36} className="mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-bold text-gray-800">اختر ملف إكسل من جهازك</p>
              <p className="text-xs text-gray-500 mt-0.5">يدعم صيغ .xlsx أو .xls أو .csv</p>
            </div>
            <label className="inline-block bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition shadow-xs">
              <span>تصفح الملفات من الجهاز</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 text-xs font-bold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-red-50 text-red-900 border border-red-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Required Columns Info Badges */}
        <div className="pt-2">
          <span className="text-xs font-bold text-gray-600 block mb-2">الأعمدة الـ 9 المعتمدة في الشيت:</span>
          <div className="flex flex-wrap gap-1.5">
            {REQUIRED_COLUMNS.map((col, idx) => (
              <span
                key={col}
                className="bg-gray-100 text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-blue-900 text-white text-[9px] flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                <span>{col}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Preview of Imported Products if Available */}
        {previewProducts && (
          <div className="border border-emerald-200 bg-emerald-50/30 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>معاينة الأصناف المستوردة ({previewProducts.length} صنف جاهز للاعتماد)</span>
                </h4>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  أجهزة منزلية: {previewProducts.filter(p => p.sector === 'أجهزة منزلية').length} | أجهزة كهربيه: {previewProducts.filter(p => p.sector === 'أجهزة كهربيه').length}
                </p>
              </div>

              <button
                onClick={applyImportedProducts}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-6 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 justify-center"
              >
                <Sparkles size={15} />
                <span>تطبيق وتحديث الكتالوج فوراً للعملاء ✅</span>
              </button>
            </div>

            {/* Preview Table */}
            <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 sticky top-0">
                  <tr>
                    <th className="p-2.5">الصورة</th>
                    <th className="p-2.5">Item number</th>
                    <th className="p-2.5">كود موحد</th>
                    <th className="p-2.5">اسم المنتج</th>
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">Color</th>
                    <th className="p-2.5">Item group</th>
                    <th className="p-2.5">Family Name</th>
                    <th className="p-2.5">القطاع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewProducts.slice(0, 15).map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2">
                        <img
                          src={getSafeImageSrc(p.previewimage)} referrerPolicy="no-referrer"
                          alt=""
                          className="w-10 h-10 object-contain rounded-lg border border-gray-200 bg-white"
                          onError={(e: any) => {
                            e.target.src = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=200';
                          }}
                        />
                      </td>
                      <td className="p-2.5 font-mono text-[11px] font-bold text-gray-600">{p.itemNumber || '-'}</td>
                      <td className="p-2.5 font-mono text-[11px] font-bold text-blue-900">{p.unifiedCode || '-'}</td>
                      <td className="p-2.5 font-bold text-gray-900 max-w-xs truncate">{p.nameAr}</td>
                      <td className="p-2.5 text-gray-600">{p.size || '-'}</td>
                      <td className="p-2.5 text-gray-600">{p.color || '-'}</td>
                      <td className="p-2.5 text-gray-600">{p.itemGroup || '-'}</td>
                      <td className="p-2.5 font-semibold text-gray-700">{p.familyName || '-'}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.sector === 'أجهزة كهربيه' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                        }`}>
                          {p.sector}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewProducts.length > 15 && (
              <p className="text-[11px] text-gray-500 text-center font-medium">
                معروض أول 15 صنف من إجمالي {previewProducts.length} صنف...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
