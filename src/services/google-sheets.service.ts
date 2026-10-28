import type { FirebaseProduct } from '../types/firebase';

/**
 * خدمة قراءة المنتجات من جوجل شيت عبر رابط CSV عام
 * الطريقة:
 * 1. افتح جوجل شيت
 * 2. File > Share > Publish to web
 * 3. اختر ورقة العمل وصيغة CSV
 * 4. انسخ الرابط واحفظه في متغير SHEET_CSV_URL أدناه
 */

export const SHEET_CSV_URL = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL || '';

export async function fetchProductsFromGoogleSheets(): Promise<FirebaseProduct[]> {
  if (!SHEET_CSV_URL) {
    console.warn('Google Sheet CSV URL not configured. Set VITE_GOOGLE_SHEET_CSV_URL env var.');
    return [];
  }

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`Failed to fetch sheet: ${response.status}`);
    const csvText = await response.text();
    return parseCsvToProducts(csvText);
  } catch (err) {
    console.error('Error fetching Google Sheet:', err);
    return [];
  }
}

function parseCsvToProducts(csv: string): FirebaseProduct[] {
  const lines = csv.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const products: FirebaseProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (!values || values.length === 0) continue;

    const get = (colName: string, fallbackIndex: number): string => {
      const idx = headers.indexOf(colName);
      const val = idx !== -1 ? values[idx] : values[fallbackIndex];
      return val ? val.trim().replace(/"/g, '') : '';
    };

    const nameAr = get('name_ar', 0);
    if (!nameAr) continue;

    const priceStr = get('price', 3);
    const discountedStr = get('discounted_price', 4);
    const price = parseFloat(priceStr.replace(/,/g, '')) || 0;
    const discountedPrice = discountedStr ? parseFloat(discountedStr.replace(/,/g, '')) || undefined : undefined;

    const colorsStr = get('colors', 6);
    const sizesStr = get('sizes', 7);

    products.push({
      id: `sheet-${i}`,
      nameAr,
      nameEn: get('name_en', 1),
      categoryAr: get('category_ar', 2) || get('category', 2) || 'عام',
      category: get('category', 2) || 'عام',
      price,
      discountedPrice,
      imageUrl: get('image_url', 5),
      colors: colorsStr ? colorsStr.split(',').map((c) => c.trim()).filter(Boolean) : [],
      sizes: sizesStr ? sizesStr.split(',').map((s) => s.trim()).filter(Boolean) : [],
      inStock: get('in_stock', 8).toLowerCase() !== 'false',
      brand: get('brand', 9) || '',
      createdAt: new Date().toISOString(),
    });
  }

  return products;
}

/**
 *parse simple CSV line handling quoted fields with commas inside
 */
function parseCsvLine(line: string): string[] | null {
  const result: string[] = [];
  let i = 0;
  let current = '';
  let inQuotes = false;

  while (i < line.length) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      current += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }
  result.push(current);
  return result;
}