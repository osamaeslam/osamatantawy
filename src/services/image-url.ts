/**
 * يرجع لينك صورة قابل للعرض مباشرة داخل <img>.
 * يحوّل روابط Google Drive العادية (file/d/ID/view وأمثالها) إلى الصيغة المباشرة،
 * لأن روابط المشاركة العادية لا تُعرض كصورة في المتصفح وتُسبب خطأ تحميل.
 * أي رابط آخر يرجعه كما هو بدون تغيير.
 */
import { DEFAULT_PRODUCT_FALLBACK } from '../utils/imageHelper';

export function normalizeImageUrl(url?: string | null, fallback = DEFAULT_PRODUCT_FALLBACK): string {
  if (!url || typeof url !== 'string' || !url.trim()) return fallback;
  const trimmed = url.trim();

  // نتعامل فقط مع روابط جوجل درايف
  if (/drive\.google\.com|docs\.google\.com/.test(trimmed)) {
    const match =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (match && match[1]) {
      // الصيغة المباشرة الأكثر استقرارًا لعرض صور درايف
      return `https://lh3.googleusercontent.com/d/${match[1]}=w1600`;
    }
  }

  return trimmed;
}
