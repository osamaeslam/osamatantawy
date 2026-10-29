import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { excelUploadService } from '../supabase/excel-upload.service';
import { productService } from '../supabase/products.service';
import type { FirebaseProduct } from '../types/firebase';

export const ExcelUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    success: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length < 2) {
        setResult({ total: 0, success: 0, errors: ['الملف فارغ أو لا يحتوي على بيانات'] });
        return;
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      let success = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        try {
          const productData: Omit<FirebaseProduct, 'id'> = {
            nameAr: String(row[headers.indexOf('name_ar')] || row[0] || ''),
            nameEn: String(row[headers.indexOf('name_en')] || row[1] || ''),
            categoryAr: String(row[headers.indexOf('category_ar')] || row[2] || 'عام'),
            category: String(row[headers.indexOf('category')] || row[2] || 'عام'),
            price: Number(row[headers.indexOf('price')] || row[3] || 0) || 0,
            discountedPrice:
              row[headers.indexOf('discounted_price')] || row[4]
                ? Number(row[headers.indexOf('discounted_price')] || row[4])
                : undefined,
            imageUrl: String(row[headers.indexOf('image_url')] || row[5] || ''),
            colors: String(row[headers.indexOf('colors')] || row[6] || '')
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean),
            sizes: String(row[headers.indexOf('sizes')] || row[7] || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            inStock: String(row[headers.indexOf('in_stock')] || row[8] || 'true').toLowerCase() === 'true',
            brand: String(row[headers.indexOf('brand')] || row[9] || ''),
            createdAt: new Date(),
          };

          if (!productData.nameAr) {
            errors.push(`الصف ${rowNum}: اسم المنتج غير موجود`);
            continue;
          }

          await productService.create(productData);
          success++;
        } catch (err: any) {
          errors.push(`الصف ${rowNum}: ${err.message}`);
        }
      }

      await excelUploadService.createRecord(
        file.name,
        rows.length,
        success,
        errors.length,
        'admin'
      );

      setResult({ total: rows.length, success, errors });
    } catch (err: any) {
      setResult({ total: 0, success: 0, errors: [err.message] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-6">رفع منتجات من ملف Excel</h2>

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">اختر ملف Excel</label>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {file && (
          <p className="text-sm text-gray-500 mt-2">الملف المحدد: {file.name}</p>
        )}
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-bold text-blue-800 mb-2">تنسيق الملف المطلوب:</p>
        <ul className="list-disc list-inside text-blue-700 text-xs space-y-1">
          <li>الصف الأول يجب أن يحتوي على عناوين الأعمدة</li>
          <li>الأعمدة: name_ar, name_en, category_ar, price, discounted_price, image_url, colors, sizes, in_stock, brand</li>
          <li>رابط الصورة يجب أن يكون رابط مباشر من Google Drive</li>
        </ul>
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50"
      >
        {uploading ? 'جاري الرفع والمعالجة...' : 'رفع وتخزين المنتجات'}
      </button>

      {result && (
        <div className="mt-6 p-4 rounded-lg border">
          {result.errors.length > 0 ? (
            <div className="bg-red-50 border border-red-200">
              <h3 className="text-red-800 font-bold mb-2">نتائج الرفع (بأخطاء)</h3>
              <p className="text-sm text-red-700 mb-2">
                성공: {result.success} من {result.total} منتج
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200">
              <h3 className="text-green-800 font-bold mb-2">تم الرفع بنجاح</h3>
              <p className="text-sm text-green-700">
                تم إضافة {result.success} منتج بنجاح إلى قاعدة البيانات.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};