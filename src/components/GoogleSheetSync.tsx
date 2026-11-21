import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import type { Product } from '../types';
import type { FirebaseProduct } from '../types/firebase';
import { productService } from '../supabase/products.service';
import { excelUploadService } from '../supabase/excel-upload.service';
import { supabase } from '../supabase/config';
import { normalizeImageUrl } from '../services/image-url';
import { analyzeCatalogConflicts } from '../utils/catalogConflicts';
import {
  FileSpreadsheet,
  Link2,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Layers,
  RotateCcw,
  Sparkles,
  Trash2,
  RefreshCw,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Package,
  Search,
  Eye,
  Ban,
  Check,
} from 'lucide-react';

export const REQUIRED_COLUMNS = [
  'Item number',
  'كود موحد',
  'اسم المنتج',
  'Size',
  'Color',
  'Item group',
  'Family Name',
  'لينك الصور',
  'القطاع',
];

interface ImportedCatalogRow {
  rowIndex: number;
  product: Product;
  excluded: boolean;
  aiStatus: 'idle' | 'analyzing' | 'done' | 'error';
  aiUsedImage?: boolean;
  aiConfidence?: string;
  aiReason?: string;
  aiSubCategory?: string;
  aiError?: string;
}

type PreviewFilter = 'all' | 'code_overlap' | 'name_similarity' | 'ai_done' | 'clean' | 'excluded';

const PREVIEW_PAGE_SIZE = 20;
const AI_BATCH_SIZE = 12;

export interface GoogleSheetSyncProps {
  onCatalogUpdated?: () => void | Promise<void>;
  currentUserName?: string;
}

export const GoogleSheetSync: React.FC<GoogleSheetSyncProps> = ({
  onCatalogUpdated,
  currentUserName,
}) => {
  const { products, categories, importProducts, resetProductsToDefault } = useApp();

  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
  } | null>(null);
  const [activeView, setActiveView] = useState<'file' | 'sheet'>('file');
  const [sourceFileName, setSourceFileName] = useState<string>('ملف كتالوج');

  const [importedRows, setImportedRows] = useState<ImportedCatalogRow[] | null>(null);
  const [dbSnapshot, setDbSnapshot] = useState<FirebaseProduct[]>([]);
  const [loadingDbSnapshot, setLoadingDbSnapshot] = useState(false);

  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>('all');
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewPage, setPreviewPage] = useState(1);

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiProgress, setAiProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });
  const [aiGlobalError, setAiGlobalError] = useState<string | null>(null);
  const aiAbortRef = useRef(false);

  const [acknowledgeConflicts, setAcknowledgeConflicts] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const availableCategoryNames = useMemo(() => {
    const names = categories.map((c) => c.nameAr).filter(Boolean);
    if (!names.includes('أجهزة منزلية')) names.unshift('أجهزة منزلية');
    if (!names.includes('أجهزة كهربيه')) names.push('أجهزة كهربيه');
    return Array.from(new Set(names));
  }, [categories]);

  const convertGoogleSheetUrlToCsv = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.includes('export?format=csv') || trimmed.includes('output=csv')) {
      return trimmed;
    }
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }
    return trimmed;
  };

  const mapRowToProduct = (row: Record<string, any>, index: number): Product | null => {
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

    const itemNumber = getValue([
      'Item number',
      'item_number',
      'item number',
      'رقم الصنف',
      'رقم المنتج',
      'item no',
    ]);
    const unifiedCode = getValue([
      'كود موحد',
      'unified_code',
      'unified code',
      'كود',
      'code',
      'باركود',
      'sku',
    ]);
    const nameAr = getValue([
      'اسم المنتج',
      'اسم الصنف',
      'product_name',
      'name',
      'product name',
      'الاسم',
    ]);
    const descriptionRaw = getValue([
      'الوصف',
      'وصف المنتج',
      'description',
      'details',
      'التفاصيل',
      'مواصفات',
    ]);
    const brandRaw = getValue(['الماركة', 'brand', 'العلامة التجارية']);
    const priceRaw = getValue(['السعر', 'price', 'سعر البيع']);
    const size = getValue(['Size', 'size', 'مقاس', 'المقاس', 'الحجم']);
    const color = getValue(['Color', 'color', 'اللون', 'لون']);
    const itemGroup = getValue(['Item group', 'item_group', 'item group', 'مجموعة الصنف', 'المجموعة']);
    const familyName = getValue(['Family Name', 'family_name', 'family name', 'العائلة', 'اسم العائلة']);
    const imageLink = getValue([
      'لينك الصور',
      'رابط الصورة',
      'لينك الصورة',
      'image_link',
      'image_url',
      'image',
      'photo',
      'url',
    ]);
    const rawSector = getValue(['القطاع', 'قطاع', 'sector', 'القسم', 'category']);

    if (!nameAr && !unifiedCode && !itemNumber) {
      return null;
    }

    let sector = 'أجهزة منزلية';
    if (rawSector.includes('كهرب') || rawSector.toLowerCase().includes('electric')) {
      sector = 'أجهزة كهربيه';
    } else if (rawSector.includes('منزل') || rawSector.toLowerCase().includes('home')) {
      sector = 'أجهزة منزلية';
    } else if (rawSector.trim()) {
      sector = rawSector.trim();
    }

    const finalImage = imageLink && imageLink.length >= 8 ? imageLink : '';
    const finalName = nameAr || `منتج كود ${unifiedCode || itemNumber || index + 1}`;
    const numericPrice = Number(String(priceRaw).replace(/[^\d.]/g, '')) || 0;

    let imageIdentity = finalImage;
    if (finalImage) {
      try {
        const imageUrl = new URL(finalImage);
        imageIdentity = `${imageUrl.origin}${imageUrl.pathname}`;
      } catch {
        imageIdentity = finalImage.split(/[?#]/, 1)[0];
      }
    }

    const importKey = unifiedCode
      ? unifiedCode.trim()
      : [sector, finalName, imageIdentity || `row-${index}`]
          .map((value) => value.trim().normalize('NFKC').toLowerCase())
          .join('|');

    const resolvedDesc =
      descriptionRaw ||
      `منتج ${finalName} — ${[familyName, itemGroup, size, color].filter(Boolean).join(' · ') || sector}`;

    return {
      id: `custom-${unifiedCode || itemNumber || index + 1}-${Date.now().toString(36)}`,
      name: finalName,
      nameAr: finalName,
      category: sector === 'أجهزة كهربيه' ? 'Electrical Appliances' : 'Home Appliances',
      categoryAr: sector,
      summary: `${familyName || itemGroup || sector}${unifiedCode ? ` - كود: ${unifiedCode}` : ''}`,
      summaryAr: `${familyName || itemGroup || sector}${unifiedCode ? ` - كود: ${unifiedCode}` : ''}`,
      description: resolvedDesc,
      descriptionAr: resolvedDesc,
      actualprice: numericPrice,
      discountpercent: 0,
      overallrating: 4.8,
      previewimage: finalImage,
      previewimages: finalImage ? [finalImage] : [],
      reviews: [],
      quantities: ['1', '2', '3', '5'],
      sizevariants: size ? [size] : ['قياسي'],
      isDeal: false,
      inStock: true,
      brand: brandRaw || 'طنطاوي جروب',
      itemNumber: itemNumber || '',
      importKey,
      unifiedCode: unifiedCode || '',
      size: size || 'قياسي',
      color: color || 'أصلي',
      itemGroup: itemGroup || 'عام',
      familyName: familyName || (sector === 'أجهزة كهربيه' ? 'أجهزة كهربائية' : 'أجهزة منزلية'),
      imageLink: finalImage,
      sector,
    };
  };

  // فحص تعارض الأكواد وتشابه المسميات فورياً ضد الشيت وقاعدة البيانات
  const conflictAnalysis = useMemo(() => {
    if (!importedRows || importedRows.length === 0) return null;
    const activeProducts = importedRows.map((r) => r.product);
    return analyzeCatalogConflicts(activeProducts, dbSnapshot);
  }, [importedRows, dbSnapshot]);

  // تشغيل التصنيف الآلي بالصور والوصف عبر الخادم (/api/catalog/analyze)
  const runAiClassification = useCallback(
    async (rowsToClassify: ImportedCatalogRow[]) => {
      if (rowsToClassify.length === 0) return;

      aiAbortRef.current = false;
      setAiAnalyzing(true);
      setAiGlobalError(null);
      setAiProgress({ done: 0, total: rowsToClassify.length });

      let processed = 0;

      for (let i = 0; i < rowsToClassify.length; i += AI_BATCH_SIZE) {
        if (aiAbortRef.current) break;

        const batch = rowsToClassify.slice(i, i + AI_BATCH_SIZE);
        const batchIndices = new Set(batch.map((b) => b.rowIndex));

        setImportedRows((prev) =>
          prev
            ? prev.map((r) =>
                batchIndices.has(r.rowIndex) ? { ...r, aiStatus: 'analyzing', aiError: undefined } : r
              )
            : prev
        );

        try {
          const response = await fetch('/api/catalog/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              availableCategories: availableCategoryNames,
              items: batch.map((r) => ({
                rowIndex: r.rowIndex,
                name: r.product.nameAr,
                description: r.product.descriptionAr,
                familyName: r.product.familyName,
                itemGroup: r.product.itemGroup,
                sector: r.product.sector,
                imageUrl: r.product.imageLink || r.product.previewimage,
              })),
            }),
          });

          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload?.error || `خطأ من خادم التحليل (${response.status})`);
          }

          const resultMap = new Map<number, any>();
          for (const item of payload?.results || []) {
            resultMap.set(Number(item.rowIndex), item);
          }

          setImportedRows((prev) =>
            prev
              ? prev.map((r) => {
                  if (!batchIndices.has(r.rowIndex)) return r;
                  const res = resultMap.get(r.rowIndex);
                  if (!res) {
                    return { ...r, aiStatus: 'error', aiError: 'لم يرجع الخادم نتيجة لهذا الصف' };
                  }
                  const nextSector = res.category?.trim() || r.product.sector || 'أجهزة منزلية';
                  const nextSub = res.subCategory?.trim() || r.product.familyName;
                  const nextBrand =
                    res.brand?.trim() && (!r.product.brand || r.product.brand === 'طنطاوي جروب')
                      ? res.brand.trim()
                      : r.product.brand;

                  return {
                    ...r,
                    aiStatus: 'done',
                    aiUsedImage: Boolean(res.usedImage),
                    aiConfidence: res.confidence || 'medium',
                    aiReason: res.reason || '',
                    aiSubCategory: nextSub,
                    product: {
                      ...r.product,
                      sector: nextSector,
                      categoryAr: nextSector,
                      category: nextSector.includes('كهرب')
                        ? 'Electrical Appliances'
                        : 'Home Appliances',
                      familyName: nextSub,
                      brand: nextBrand,
                    },
                  };
                })
              : prev
          );
        } catch (err: any) {
          const message = err?.message || 'تعذر الاتصال بخدمة التصنيف الذكي';
          setAiGlobalError(message);
          setImportedRows((prev) =>
            prev
              ? prev.map((r) =>
                  batchIndices.has(r.rowIndex)
                    ? { ...r, aiStatus: 'error', aiError: message }
                    : r
                )
              : prev
          );
          break;
        } finally {
          processed += batch.length;
          setAiProgress({
            done: Math.min(rowsToClassify.length, processed),
            total: rowsToClassify.length,
          });
        }
      }

      setAiAnalyzing(false);
    },
    [availableCategoryNames]
  );

  // تجهيز البيانات المستوردة وتشغيل فحص التداخل + التصنيف الآلي
  const initializeImportedCatalog = async (mappedProducts: Product[], fileName: string) => {
    setSourceFileName(fileName);
    setAcknowledgeConflicts(false);
    setPreviewFilter('all');
    setPreviewSearch('');
    setPreviewPage(1);
    setAiGlobalError(null);

    const rows: ImportedCatalogRow[] = mappedProducts.map((p, idx) => ({
      rowIndex: idx,
      product: p,
      excluded: false,
      aiStatus: 'idle',
    }));
    setImportedRows(rows);

    setLoadingDbSnapshot(true);
    try {
      const snapshot = await productService.getAuditSnapshot();
      setDbSnapshot(snapshot);
    } catch {
      // الاحتفاظ بآخر نسخة إن تعذر الجلب
    } finally {
      setLoadingDbSnapshot(false);
    }

    // بدء التصنيف الآلي بالصور والوصف مباشرة
    void runAiClassification(rows);
  };

  useEffect(() => {
    return () => {
      aiAbortRef.current = true;
    };
  }, []);

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
        throw new Error(
          `تعذر جلب البيانات من الرابط (${response.status}). تأكد من أن صلاحية الشيت "Anyone with the link can view".`
        );
      }

      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
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
        throw new Error('لم يتم العثور على منتجات صالحة. تحقق من أسماء الأعمدة في الملف.');
      }

      await initializeImportedCatalog(mapped, 'Google Sheet');
      setStatusMessage({
        type: 'info',
        text: `تم استيراد ${mapped.length} منتج. جارٍ فحص الأكواد والمسميات وتشغيل التصنيف التلقائي بالصور والوصف...`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء مزامنة جوجل شيت',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
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
          throw new Error('لم يتم التعرف على أي أصناف مطابقة للأعمدة المطلوبة');
        }

        await initializeImportedCatalog(mapped, file.name);
        setStatusMessage({
          type: 'info',
          text: `تمت قراءة ${mapped.length} منتج من "${file.name}". جارٍ التصنيف الآلي وفحص التداخلات...`,
        });
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err.message || 'خطأ في معالجة ملف الإكسل' });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const updateRowField = (
    rowIndex: number,
    patch: Partial<{
      nameAr: string;
      itemNumber: string;
      unifiedCode: string;
      sector: string;
      familyName: string;
      brand: string;
      excluded: boolean;
    }>
  ) => {
    setImportedRows((prev) =>
      prev
        ? prev.map((r) => {
            if (r.rowIndex !== rowIndex) return r;
            const nextExcluded = patch.excluded !== undefined ? patch.excluded : r.excluded;
            const nextSector =
              (patch.sector !== undefined ? patch.sector : r.product.sector) ||
              r.product.categoryAr ||
              'أجهزة منزلية';
            const nextUnified =
              patch.unifiedCode !== undefined ? patch.unifiedCode : r.product.unifiedCode || '';
            return {
              ...r,
              excluded: nextExcluded,
              product: {
                ...r.product,
                nameAr: patch.nameAr !== undefined ? patch.nameAr : r.product.nameAr,
                name: patch.nameAr !== undefined ? patch.nameAr : r.product.name,
                itemNumber: patch.itemNumber !== undefined ? patch.itemNumber : r.product.itemNumber,
                unifiedCode: nextUnified,
                importKey: nextUnified ? nextUnified.trim() : r.product.importKey,
                sector: nextSector,
                categoryAr: nextSector,
                familyName: patch.familyName !== undefined ? patch.familyName : r.product.familyName,
                brand: patch.brand !== undefined ? patch.brand : r.product.brand,
              },
            };
          })
        : prev
    );
  };

  const excludeAllConflictingRows = () => {
    if (!conflictAnalysis) return;
    setImportedRows((prev) =>
      prev
        ? prev.map((r) => {
            const c = conflictAnalysis.byRowIndex[r.rowIndex];
            if (c && (c.hasCodeOverlap || c.hasNameSimilarity)) {
              return { ...r, excluded: true };
            }
            return r;
          })
        : prev
    );
  };

  const activeRowsToCommit = useMemo(
    () => (importedRows || []).filter((r) => !r.excluded),
    [importedRows]
  );

  const unresolvedActiveConflicts = useMemo(() => {
    if (!importedRows || !conflictAnalysis) return 0;
    return importedRows.filter((r) => {
      if (r.excluded) return false;
      const c = conflictAnalysis.byRowIndex[r.rowIndex];
      return Boolean(c && (c.hasCodeOverlap || c.hasNameSimilarity));
    }).length;
  }, [importedRows, conflictAnalysis]);

  const applyImportedProducts = async () => {
    if (activeRowsToCommit.length === 0) {
      setStatusMessage({ type: 'error', text: 'لا توجد صفوف معتمدة للحفظ (كل الصفوف مستبعدة).' });
      return;
    }

    if (unresolvedActiveConflicts > 0 && !acknowledgeConflicts) {
      setStatusMessage({
        type: 'warning',
        text: `يوجد ${unresolvedActiveConflicts} صنف عليه تنبيه تداخل أكواد أو تشابه مسميات. راجع التنبيهات أو فعّل مربع الإقرار بالأسفل للمتابعة.`,
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const committedProducts = activeRowsToCommit.map((r) => r.product);
      importProducts(committedProducts);

      const supabaseItems = committedProducts.map((p) => ({
        nameAr: p.nameAr,
        nameEn: p.name || p.nameAr,
        itemNumber: p.itemNumber || undefined,
        importKey: p.importKey || undefined,
        category: p.categoryAr || p.category || 'أجهزة منزلية',
        categoryAr: p.categoryAr || p.sector || 'أجهزة منزلية',
        price: typeof p.actualprice === 'number' ? p.actualprice : 0,
        discountedPrice: 0,
        imageUrl: p.imageLink || p.previewimage || '',
        colors: p.color ? [p.color] : [],
        sizes: p.sizevariants || [p.size || 'قياسي'],
        inStock: p.inStock !== undefined ? p.inStock : true,
        brand: p.brand || '',
        createdAt: new Date().toISOString(),
      }));

      const BATCH_SIZE = 500;
      let successCount = 0;

      for (let i = 0; i < supabaseItems.length; i += BATCH_SIZE) {
        const batch = supabaseItems.slice(i, i + BATCH_SIZE);
        await productService.batchCreate(batch);
        successCount += batch.length;
      }

      try {
        await excelUploadService.createRecord(
          sourceFileName,
          importedRows?.length || committedProducts.length,
          successCount,
          (importedRows?.length || 0) - activeRowsToCommit.length,
          currentUserName || 'admin'
        );
      } catch {
        // تجاهل فشل تسجيل اللوج إن لم يكن جدول السجل مفعلاً
      }

      try {
        const { data: freshPage, error: fetchErr } = await supabase
          .from('products')
          .select('id,name_ar,name_en,category,price,discounted_price,image_url,colors,sizes,in_stock,brand,item_number,import_key')
          .order('id', { ascending: false })
          .limit(200);
        if (!fetchErr && freshPage && freshPage.length > 0) {
          localStorage.removeItem('tantawy_custom_products');
        }
      } catch {
        // ignore cache clear error
      }

      if (onCatalogUpdated) {
        await onCatalogUpdated();
      }

      setStatusMessage({
        type: 'success',
        text: `تم اعتماد وحفظ ${successCount} صنف مصنّف بنجاح في قاعدة البيانات وتحديث الكتالوج للعملاء.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `تعذر حفظ البيانات: ${err.message || 'تحقق من الاتصال بقاعدة البيانات'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const rows = products.map((p, idx) => ({
      'Item number': p.itemNumber || `ITM-${idx + 1}`,
      'كود موحد': p.unifiedCode || `TG-${idx + 100}`,
      'اسم المنتج': p.nameAr,
      Size: p.size || 'قياسي',
      Color: p.color || 'أصلي',
      'Item group': p.itemGroup || (p.sector === 'أجهزة كهربيه' ? 'كهرباء' : 'منزلي'),
      'Family Name': p.familyName || p.categoryAr,
      'لينك الصور': p.imageLink || p.previewimage || '',
      'القطاع': p.sector || p.categoryAr,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: REQUIRED_COLUMNS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'منتجات طنطاوي جروب');
    XLSX.writeFile(workbook, 'Tantawy_Group_Products_Template.xlsx');
  };

  const filteredPreviewRows = useMemo(() => {
    if (!importedRows) return [];
    const q = previewSearch.trim().toLowerCase();

    return importedRows.filter((row) => {
      const c = conflictAnalysis?.byRowIndex[row.rowIndex];
      if (previewFilter === 'code_overlap' && !c?.hasCodeOverlap) return false;
      if (previewFilter === 'name_similarity' && !c?.hasNameSimilarity) return false;
      if (previewFilter === 'ai_done' && row.aiStatus !== 'done') return false;
      if (previewFilter === 'clean' && (c?.hasCodeOverlap || c?.hasNameSimilarity || row.excluded)) {
        return false;
      }
      if (previewFilter === 'excluded' && !row.excluded) return false;

      if (q) {
        const p = row.product;
        const hit =
          (p.nameAr || '').toLowerCase().includes(q) ||
          (p.itemNumber || '').toLowerCase().includes(q) ||
          (p.unifiedCode || '').toLowerCase().includes(q) ||
          (p.sector || '').toLowerCase().includes(q) ||
          (p.familyName || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [importedRows, conflictAnalysis, previewFilter, previewSearch]);

  useEffect(() => {
    setPreviewPage(1);
  }, [previewFilter, previewSearch]);

  const totalPreviewPages = Math.max(1, Math.ceil(filteredPreviewRows.length / PREVIEW_PAGE_SIZE));
  const safePreviewPage = Math.min(previewPage, totalPreviewPages);
  const pagedPreviewRows = useMemo(() => {
    const start = (safePreviewPage - 1) * PREVIEW_PAGE_SIZE;
    return filteredPreviewRows.slice(start, start + PREVIEW_PAGE_SIZE);
  }, [filteredPreviewRows, safePreviewPage]);

  const homeAppliancesCount = products.filter(
    (p) => p.sector === 'أجهزة منزلية' || p.categoryAr === 'أجهزة منزلية'
  ).length;
  const electricAppliancesCount = products.filter(
    (p) => p.sector === 'أجهزة كهربيه' || p.categoryAr === 'أجهزة كهربيه'
  ).length;

  const aiClassifiedCount = useMemo(
    () => (importedRows ? importedRows.filter((r) => r.aiStatus === 'done').length : 0),
    [importedRows]
  );

  return (
    <div className="space-y-5">
      {/* Overview Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-500">إجمالي أصناف الكتالوج الحالي</span>
            <Layers className="text-blue-700" size={18} />
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono tabular-nums">
            {products.length.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">أصناف محملة ومربوطة بقاعدة البيانات</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <span className="text-xs font-bold text-blue-900 block mb-1.5">أجهزة منزلية · القطاع 1</span>
          <div className="text-2xl font-black text-blue-900 font-mono tabular-nums">
            {homeAppliancesCount.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">ثلاجات · غسالات · بوتاجازات · أدوات مطبخ</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <span className="text-xs font-bold text-amber-900 block mb-1.5">أجهزة كهربيه · القطاع 2</span>
          <div className="text-2xl font-black text-amber-900 font-mono tabular-nums">
            {electricAppliancesCount.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">شاشات · تكييفات · مكانس · أجهزة خفيفة</div>
        </div>
      </div>

      {/* Main Upload & AI Classification Workspace */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-700 shrink-0" size={20} />
              <span>رفع ملف الكتالوج والتصنيف الذكي بالصور والوصف</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              عند رفع ملف إكسل أو ربط جوجل شيت يقوم النظام تلقائياً بتحليل صور ووصف المنتجات لتصنيفها، وفحص تداخل الأكواد وتشابه المسميات.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download size={14} />
              <span>تنزيل نموذج إكسل</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmClearOpen((v) => !v)}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Trash2 size={14} />
              <span>تفريغ المعاينة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetProductsToDefault();
                setImportedRows(null);
                setStatusMessage({
                  type: 'info',
                  text: 'تمت إعادة تحميل المنتجات من قاعدة البيانات.',
                });
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RotateCcw size={14} />
              <span>تحديث من القاعدة</span>
            </button>
          </div>
        </div>

        {confirmClearOpen && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="font-bold text-red-900">
              هل تريد تفريغ الكتالوج المحلي والمعاينة الحالية لبدء رفع ملف جديد؟
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  importProducts([]);
                  setImportedRows(null);
                  setConfirmClearOpen(false);
                  setStatusMessage({
                    type: 'info',
                    text: 'تم تفريغ الكتالوج المحلي بنجاح. ارفع ملف الإكسل أو الشيت الآن.',
                  });
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg whitespace-nowrap shrink-0"
              >
                نعم، تفريغ الآن
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg whitespace-nowrap shrink-0"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Mode Segmented Control */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveView('file')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeView === 'file' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload size={14} />
            <span>رفع ملف إكسل من الجهاز (.xlsx / .csv)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('sheet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeView === 'sheet' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 size={14} />
            <span>رابط جوجل شيت المباشر</span>
          </button>
        </div>

        {/* Local File Upload */}
        {activeView === 'file' && (
          <div className="bg-slate-50 border-2 border-dashed border-gray-300 rounded-xl p-7 text-center space-y-3">
            <Upload size={32} className="mx-auto text-blue-900" />
            <div>
              <p className="text-sm font-black text-gray-900">اختر ملف الكتالوج للتحليل والتصنيف التلقائي</p>
              <p className="text-xs text-gray-500 mt-0.5">
                يدعم صيغ .xlsx و .xls و .csv — يبدأ تحليل الصور والوصف وفحص الأكواد والمسميات فور الرفع
              </p>
            </div>
            <label className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs px-5 py-2.5 rounded-lg cursor-pointer transition">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{loading ? 'جاري قراءة الملف...' : 'اختيار ملف الكتالوج'}</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Google Sheet URL */}
        {activeView === 'sheet' && (
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-3">
            <label className="block text-xs font-black text-gray-900">
              رابط شيت جوجل (Google Sheet URL):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-600 font-mono text-left"
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleSyncGoogleSheet}
                disabled={loading}
                className="bg-blue-900 hover:bg-blue-950 text-white font-black text-xs px-5 py-2.5 rounded-lg transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                <span>{loading ? 'جاري الاستيراد...' : 'جلب وتحليل الشيت'}</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              تأكد من ضبط صلاحية المشاركة في جوجل شيت على «أي شخص لديه الرابط يمكنه العرض».
            </p>
          </div>
        )}

        {/* Required columns line (unboxed metadata) */}
        <div className="text-[11px] text-gray-500 leading-relaxed">
          <span className="font-bold text-gray-700">الأعمدة المدعومة: </span>
          <span>{[...REQUIRED_COLUMNS, 'الوصف (اختياري)', 'الماركة (اختياري)', 'السعر (اختياري)'].join(' · ')}</span>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-bold border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-red-50 text-red-900 border-red-200'
                : statusMessage.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* AI Image & Description Classification Progress / Error */}
        {importedRows && (aiAnalyzing || aiGlobalError || aiClassifiedCount > 0) && (
          <div
            className={`rounded-xl border p-4 space-y-2.5 ${
              aiGlobalError
                ? 'bg-red-50 border-red-200'
                : aiAnalyzing
                ? 'bg-blue-50 border-blue-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black">
                {aiAnalyzing ? (
                  <Loader2 size={16} className="animate-spin text-blue-900 shrink-0" />
                ) : aiGlobalError ? (
                  <AlertCircle size={16} className="text-red-700 shrink-0" />
                ) : (
                  <Sparkles size={16} className="text-emerald-700 shrink-0" />
                )}
                <span className={aiGlobalError ? 'text-red-900' : 'text-gray-900'}>
                  {aiAnalyzing
                    ? `جارٍ التصنيف التلقائي بتحليل الصور والوصف (${aiProgress.done}/${aiProgress.total})...`
                    : aiGlobalError
                    ? 'تعذر إكمال التحليل الذكي لبعض الصفوف'
                    : `اكتمل التصنيف التلقائي بالصور والوصف لـ ${aiClassifiedCount} منتج`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {aiAnalyzing ? (
                  <button
                    type="button"
                    onClick={() => {
                      aiAbortRef.current = true;
                      setAiAnalyzing(false);
                    }}
                    className="px-3 py-1 bg-white border border-red-300 text-red-700 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0"
                  >
                    إيقاف التحليل مؤقتاً
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => runAiClassification(importedRows)}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Sparkles size={13} />
                    <span>إعادة تحليل الصور والوصف</span>
                  </button>
                )}
              </div>
            </div>

            {aiAnalyzing && aiProgress.total > 0 && (
              <div className="w-full bg-white/80 h-2 rounded-full overflow-hidden border border-blue-200">
                <div
                  className="bg-blue-900 h-full transition-all duration-200"
                  style={{ width: `${Math.round((aiProgress.done / aiProgress.total) * 100)}%` }}
                />
              </div>
            )}

            {aiGlobalError && (
              <p className="text-[11px] font-bold text-red-800">{aiGlobalError}</p>
            )}
          </div>
        )}

        {/* Manager Conflict Alert Banner (Overlapping Codes + Similar Names) */}
        {importedRows && conflictAnalysis && (
          <div
            className={`rounded-xl border p-4 space-y-3 ${
              conflictAnalysis.totalConflictRows > 0
                ? 'bg-amber-50 border-amber-300'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                  {conflictAnalysis.totalConflictRows > 0 ? (
                    <AlertTriangle size={18} className="text-amber-700 shrink-0" />
                  ) : (
                    <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                  )}
                  <span>
                    {conflictAnalysis.totalConflictRows > 0
                      ? 'تنبيه للمدير: تم اكتشاف تداخل أكواد أو تشابه مسميات في الملف المرفوع'
                      : 'فحص التداخل سليم — لا توجد أكواد متداخلة أو مسميات متشابهة'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 font-mono tabular-nums">
                  <span>
                    تداخل أكواد: <strong className="text-red-700">{conflictAnalysis.overlappingCodeRows}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    تشابه مسميات: <strong className="text-amber-800">{conflictAnalysis.similarNameRows}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    سليم وجاهز: <strong className="text-emerald-800">{conflictAnalysis.cleanRows}</strong>
                  </span>
                  {loadingDbSnapshot && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans text-gray-500">جاري مطابقة قاعدة البيانات...</span>
                    </>
                  )}
                </div>
              </div>

              {conflictAnalysis.totalConflictRows > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {conflictAnalysis.overlappingCodeRows > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('code_overlap')}
                      className="px-3 py-1.5 bg-white border border-red-300 text-red-800 hover:bg-red-50 rounded-lg text-xs font-bold whitespace-nowrap shrink-0"
                    >
                      عرض تداخل الأكواد ({conflictAnalysis.overlappingCodeRows})
                    </button>
                  )}
                  {conflictAnalysis.similarNameRows > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('name_similarity')}
                      className="px-3 py-1.5 bg-white border border-amber-400 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-bold whitespace-nowrap shrink-0"
                    >
                      عرض تشابه المسميات ({conflictAnalysis.similarNameRows})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={excludeAllConflictingRows}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold whitespace-nowrap shrink-0"
                  >
                    استبعاد الصفوف المتعارضة مؤقتاً
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview & Inline Conflict Resolution Table */}
        {importedRows && (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="p-4 bg-slate-50 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                {(
                  [
                    { id: 'all', label: `الكل (${importedRows.length})` },
                    {
                      id: 'code_overlap',
                      label: `تداخل أكواد (${conflictAnalysis?.overlappingCodeRows || 0})`,
                    },
                    {
                      id: 'name_similarity',
                      label: `تشابه مسميات (${conflictAnalysis?.similarNameRows || 0})`,
                    },
                    { id: 'ai_done', label: `مصنّفة آلياً (${aiClassifiedCount})` },
                    { id: 'clean', label: `سليمة (${conflictAnalysis?.cleanRows || 0})` },
                    {
                      id: 'excluded',
                      label: `مستبعدة (${importedRows.filter((r) => r.excluded).length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap shrink-0 tabular-nums ${
                      previewFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-72">
                <Search size={14} className="absolute right-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  placeholder="بحث داخل المعاينة بالاسم أو الكود..."
                  className="w-full pr-9 pl-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 w-16">الصورة</th>
                    <th className="p-3 min-w-[230px]">اسم المنتج والتنبيهات</th>
                    <th className="p-3 min-w-[170px]">الأكواد (رقم الصنف / الموحد)</th>
                    <th className="p-3 min-w-[220px]">التصنيف التلقائي (صورة + وصف)</th>
                    <th className="p-3 w-28 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedPreviewRows.map((row) => {
                    const p = row.product;
                    const conflict = conflictAnalysis?.byRowIndex[row.rowIndex];
                    const hasIssue = Boolean(
                      conflict && (conflict.hasCodeOverlap || conflict.hasNameSimilarity)
                    );

                    return (
                      <tr
                        key={row.rowIndex}
                        className={`${
                          row.excluded
                            ? 'bg-gray-50/80 opacity-60'
                            : hasIssue
                            ? 'bg-amber-50/40'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="p-3 text-center font-mono tabular-nums text-gray-500">
                          {row.rowIndex + 1}
                        </td>

                        <td className="p-3">
                          <div className="w-11 h-11 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                            {p.imageLink || p.previewimage ? (
                              <img
                                src={normalizeImageUrl(p.imageLink || p.previewimage, undefined, 120)}
                                alt={p.nameAr}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package size={16} className="text-gray-400" />
                            )}
                          </div>
                        </td>

                        <td className="p-3 space-y-1.5">
                          <input
                            type="text"
                            value={p.nameAr}
                            onChange={(e) => updateRowField(row.rowIndex, { nameAr: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md font-bold text-gray-900 text-xs outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          {conflict && conflict.conflicts.length > 0 && (
                            <div className="space-y-0.5">
                              {conflict.conflicts.map((c, ci) => (
                                <p
                                  key={ci}
                                  className={`text-[11px] font-bold flex items-start gap-1 ${
                                    c.type === 'code_overlap' ? 'text-red-700' : 'text-amber-800'
                                  }`}
                                >
                                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                                  <span>{c.message}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="p-3 space-y-1.5">
                          <div>
                            <span className="text-[10px] text-gray-500 block">Item number</span>
                            <input
                              type="text"
                              dir="ltr"
                              value={p.itemNumber || ''}
                              onChange={(e) =>
                                updateRowField(row.rowIndex, { itemNumber: e.target.value })
                              }
                              placeholder="رقم الصنف"
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded font-mono text-[11px] text-left outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 block">كود موحد</span>
                            <input
                              type="text"
                              dir="ltr"
                              value={p.unifiedCode || ''}
                              onChange={(e) =>
                                updateRowField(row.rowIndex, { unifiedCode: e.target.value })
                              }
                              placeholder="كود موحد"
                              className="w-full px-2 py-1 bg-white border border-gray-300 rounded font-mono text-[11px] text-left outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                        </td>

                        <td className="p-3 space-y-1.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            <select
                              value={p.sector || p.categoryAr || 'أجهزة منزلية'}
                              onChange={(e) =>
                                updateRowField(row.rowIndex, { sector: e.target.value })
                              }
                              className="px-2 py-1.5 bg-white border border-gray-300 rounded-md text-[11px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                            >
                              {availableCategoryNames.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={p.familyName || ''}
                              onChange={(e) =>
                                updateRowField(row.rowIndex, { familyName: e.target.value })
                              }
                              placeholder="التصنيف الفرعي"
                              className="px-2 py-1.5 bg-white border border-gray-300 rounded-md text-[11px] text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <div className="text-[11px] text-gray-600 leading-snug">
                            {row.aiStatus === 'analyzing' && (
                              <span className="text-blue-800 font-bold inline-flex items-center gap-1">
                                <Loader2 size={11} className="animate-spin" />
                                <span>جاري تحليل الصورة والوصف...</span>
                              </span>
                            )}
                            {row.aiStatus === 'done' && (
                              <span className="text-emerald-800">
                                <strong>
                                  {row.aiUsedImage ? 'تحليل صورة + وصف' : 'تحليل الاسم والوصف'}
                                </strong>
                                {row.aiReason ? ` · ${row.aiReason}` : ''}
                              </span>
                            )}
                            {row.aiStatus === 'error' && (
                              <span className="text-red-700">{row.aiError || 'فشل التحليل التلقائي'}</span>
                            )}
                            {row.aiStatus === 'idle' && (
                              <span className="text-gray-400">في انتظار التحليل...</span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              updateRowField(row.rowIndex, { excluded: !row.excluded })
                            }
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition whitespace-nowrap shrink-0 ${
                              row.excluded
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {row.excluded ? (
                              <>
                                <Ban size={12} />
                                <span>مستبعد</span>
                              </>
                            ) : (
                              <>
                                <Check size={12} />
                                <span>معتمد</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination & Final Commit Bar */}
            <div className="p-4 bg-slate-50 border-t border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                <span className="font-mono tabular-nums">
                  صفحة {safePreviewPage} من {totalPreviewPages} · عرض {pagedPreviewRows.length} من{' '}
                  {filteredPreviewRows.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePreviewPage <= 1}
                    onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 bg-white border border-gray-300 rounded font-bold disabled:opacity-40 inline-flex items-center gap-1"
                  >
                    <ChevronRight size={13} />
                    <span>السابق</span>
                  </button>
                  <button
                    type="button"
                    disabled={safePreviewPage >= totalPreviewPages}
                    onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                    className="px-2.5 py-1 bg-white border border-gray-300 rounded font-bold disabled:opacity-40 inline-flex items-center gap-1"
                  >
                    <span>التالي</span>
                    <ChevronLeft size={13} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {unresolvedActiveConflicts > 0 && (
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acknowledgeConflicts}
                      onChange={(e) => setAcknowledgeConflicts(e.target.checked)}
                      className="w-4 h-4 accent-amber-600"
                    />
                    <span>
                      راجعت تنبيهات التداخل ({unresolvedActiveConflicts}) وأوافق على الحفظ
                    </span>
                  </label>
                )}

                <button
                  type="button"
                  disabled={loading || aiAnalyzing || activeRowsToCommit.length === 0}
                  onClick={applyImportedProducts}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs px-5 py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                  <span>
                    اعتماد وحفظ {activeRowsToCommit.length.toLocaleString('en-US')} منتج في قاعدة البيانات
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
