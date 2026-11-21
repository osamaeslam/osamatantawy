import { Product } from '../types';

/**
 * تطبيع النص العربي والأرقام لتطابق ذكي حتى مع اختلاف الهمزات أو التاء المربوطة أو التشكيل
 */
export const normalizeSearchArabic = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[\-_/\\,.()[\]]/g, ' ')
    .replace(/\s+/g, ' ');
};

/**
 * فحص تطابق الحروف بالترتيب (Subsequence) لتحمل اختصار الكلمات أو نقص حرف
 */
const isOrderedSubsequence = (needle: string, haystack: string): boolean => {
  if (!needle || !haystack || needle.length > haystack.length) return false;
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (needle[i] === haystack[j]) i++;
  }
  return i === needle.length;
};

/**
 * حساب مسافة التعديل المحدودة (Levenshtein) لتصحيح الأخطاء الإملائية البسيطة
 */
const boundedEditDistance = (a: string, b: string, maxDist: number): number => {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const lenA = a.length;
  const lenB = b.length;
  let prev = Array.from({ length: lenB + 1 }, (_, j) => j);

  for (let i = 1; i <= lenA; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr.push(val);
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDist) return maxDist + 1;
    prev = curr;
  }
  return prev[lenB];
};

export interface SmartSearchResult {
  allMatches: Product[];
  topFive: Product[];
  matchingGroups: string[];
  totalCount: number;
}

/**
 * محرك البحث الذكي الفوري:
 * - يعمل من أول حرف واحد أو اسم جزئي أو كود أو ماركة
 * - يرتب النتائج بالأقرب دقة ويعيد أقرب 5 منتجات فوراً
 */
export const smartSearchProducts = (
  products: Product[],
  rawQuery: string,
  topLimit = 5
): SmartSearchResult => {
  const trimmed = (rawQuery || '').trim();
  if (!trimmed) {
    return {
      allMatches: products,
      topFive: [],
      matchingGroups: [],
      totalCount: products.length,
    };
  }

  const normQuery = normalizeSearchArabic(trimmed);
  const compactQuery = trimmed.toLowerCase().replace(/[\s\-_]/g, '');
  const queryWords = normQuery.split(' ').filter(Boolean);

  // 1. الأقسام الفرعية المطابقة
  const groupsSet = new Set<string>();
  products.forEach((p) => {
    if (p.itemGroup && normalizeSearchArabic(p.itemGroup).includes(normQuery)) {
      groupsSet.add(p.itemGroup.trim());
    }
    if (p.familyName && normalizeSearchArabic(p.familyName).includes(normQuery)) {
      groupsSet.add(p.familyName.trim());
    }
  });
  const matchingGroups = Array.from(groupsSet).slice(0, 4);

  // 2. حساب درجة المطابقة الذكية لكل منتج
  const scored: { product: Product; score: number }[] = [];

  for (const p of products) {
    const nameAr = normalizeSearchArabic(p.nameAr || '');
    const nameEn = (p.name || '').toLowerCase();
    const brand = normalizeSearchArabic(p.brand || '');
    const categoryAr = normalizeSearchArabic(p.categoryAr || '');
    const categoryEn = (p.category || '').toLowerCase();
    const sector = normalizeSearchArabic(p.sector || '');
    const itemGroup = normalizeSearchArabic(p.itemGroup || '');
    const familyName = normalizeSearchArabic(p.familyName || '');
    const code = (p.unifiedCode || '').toLowerCase();
    const itemNum = (p.itemNumber || '').toLowerCase();
    const importKey = (p.importKey || '').toLowerCase();
    const compactCode = `${code}${itemNum}${importKey}`.replace(/[\s\-_]/g, '');

    let score = 0;

    // أولوية قصوى للأكواد الموحدة وأرقام الأصناف
    if (code === trimmed.toLowerCase() || itemNum === trimmed.toLowerCase()) {
      score += 320;
    } else if (compactCode && compactQuery.length >= 2 && compactCode.startsWith(compactQuery)) {
      score += 240;
    } else if (
      (compactCode && compactQuery.length >= 2 && compactCode.includes(compactQuery)) ||
      code.includes(trimmed.toLowerCase()) ||
      itemNum.includes(trimmed.toLowerCase())
    ) {
      score += 170;
    }

    // تطابق بداية اسم الصنف أو بداية أي كلمة فيه (ممتاز عند كتابة حرف واحد أو اسم جزئي)
    if (nameAr.startsWith(normQuery)) {
      score += 210;
    } else if (nameAr.includes(' ' + normQuery)) {
      score += 160;
    } else if (nameAr.includes(normQuery)) {
      score += 105;
    }

    // الماركة والأقسام
    if (brand.startsWith(normQuery)) score += 145;
    else if (brand.includes(' ' + normQuery)) score += 110;
    else if (brand.includes(normQuery)) score += 75;

    if (itemGroup.startsWith(normQuery) || familyName.startsWith(normQuery)) score += 125;
    else if (itemGroup.includes(normQuery) || familyName.includes(normQuery)) score += 70;

    if (sector.includes(normQuery) || categoryAr.includes(normQuery) || categoryEn.includes(normQuery)) {
      score += 45;
    }
    if (nameEn.includes(trimmed.toLowerCase())) {
      score += 55;
    }

    // تطابق متعدد الكلمات في أي موضع
    if (queryWords.length > 1) {
      const haystack = `${nameAr} ${nameEn} ${brand} ${itemGroup} ${familyName} ${sector} ${code} ${itemNum}`;
      if (queryWords.every((w) => haystack.includes(w))) {
        score += 130;
      }
    }

    // البحث الضبابي (Fuzzy) لتحمل الأخطاء الإملائية البسيطة لو مفيش تطابق حرفي (للكلمات >= 2 حرف)
    if (score === 0 && normQuery.length >= 2) {
      const tokens = `${nameAr} ${brand} ${itemGroup} ${familyName}`.split(' ').filter((t) => t.length >= 2);
      const maxEdits = normQuery.length >= 5 ? 2 : 1;

      if (queryWords.length === 1) {
        const qToken = queryWords[0];
        let bestDist = maxEdits + 1;
        for (const tok of tokens) {
          if (tok.startsWith(qToken)) {
            score = Math.max(score, 90);
            break;
          }
          if (qToken.length >= 3 && isOrderedSubsequence(qToken, tok)) {
            score = Math.max(score, 55);
          }
          if (qToken.length >= 3) {
            const d = boundedEditDistance(qToken, tok, maxEdits);
            if (d < bestDist) bestDist = d;
          }
        }
        if (bestDist <= maxEdits) {
          score = Math.max(score, bestDist === 1 ? 65 : 40);
        }
      } else {
        // كل كلمة مطابقة ولو جزئياً أو بفارق حرف
        const fuzzyAll = queryWords.every((qw) =>
          tokens.some(
            (tok) =>
              tok.includes(qw) ||
              (qw.length >= 3 && boundedEditDistance(qw, tok, 1) <= 1)
          )
        );
        if (fuzzyAll) score = 60;
      }
    }

    if (score > 0) {
      scored.push({ product: p, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.product.nameAr || '').localeCompare(b.product.nameAr || '', 'ar');
  });

  const allMatches = scored.map((s) => s.product);
  return {
    allMatches,
    topFive: allMatches.slice(0, topLimit),
    matchingGroups,
    totalCount: allMatches.length,
  };
};
