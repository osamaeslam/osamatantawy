import type { Product } from '../types';
import type { FirebaseProduct } from '../types/firebase';

export interface ConflictDetail {
  type: 'code_overlap' | 'name_similarity';
  source: 'file' | 'database';
  severity: 'high' | 'medium';
  message: string;
  matchedName?: string;
  matchedCode?: string;
  similarityPercent?: number;
}

export interface RowConflictSummary {
  hasCodeOverlap: boolean;
  hasNameSimilarity: boolean;
  conflicts: ConflictDetail[];
}

export interface CatalogConflictAnalysis {
  byRowIndex: Record<number, RowConflictSummary>;
  overlappingCodeRows: number;
  similarNameRows: number;
  cleanRows: number;
  totalConflictRows: number;
}

export function normalizeArabicName(input?: string | null): string {
  if (!input) return '';
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // إزالة التشكيل
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCodeValue(input?: string | null): string {
  if (!input) return '';
  const trimmed = String(input).trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.replace(/\s+/g, '');
}

function getBigrams(str: string): string[] {
  const compact = str.replace(/\s+/g, '');
  if (compact.length < 2) return compact ? [compact] : [];
  const res: string[] = [];
  for (let i = 0; i < compact.length - 1; i++) {
    res.push(compact.slice(i, i + 2));
  }
  return res;
}

export function computeNameSimilarity(rawA: string, rawB: string): number {
  const a = normalizeArabicName(rawA);
  const b = normalizeArabicName(rawB);
  if (!a || !b) return 0;
  if (a === b) return 1;

  // 1) Dice bigram similarity
  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);
  const mapA = new Map<string, number>();
  for (const bg of bigramsA) {
    mapA.set(bg, (mapA.get(bg) || 0) + 1);
  }
  let intersection = 0;
  for (const bg of bigramsB) {
    const count = mapA.get(bg) || 0;
    if (count > 0) {
      intersection += 1;
      mapA.set(bg, count - 1);
    }
  }
  const dice =
    bigramsA.length + bigramsB.length > 0
      ? (2 * intersection) / (bigramsA.length + bigramsB.length)
      : 0;

  // 2) Token Jaccard similarity
  const tokensA = new Set(a.split(' ').filter((t) => t.length > 1));
  const tokensB = new Set(b.split(' ').filter((t) => t.length > 1));
  let tokenOverlap = 0;
  tokensA.forEach((t) => {
    if (tokensB.has(t)) tokenOverlap += 1;
  });
  const unionSize = tokensA.size + tokensB.size - tokenOverlap;
  const jaccard = unionSize > 0 ? tokenOverlap / unionSize : 0;

  return Math.max(dice, dice * 0.55 + jaccard * 0.45);
}

const SIMILARITY_THRESHOLD = 0.78;

export function analyzeCatalogConflicts(
  uploadedRows: Product[],
  existingDbProducts: FirebaseProduct[]
): CatalogConflictAnalysis {
  const byRowIndex: Record<number, RowConflictSummary> = {};

  // فهارس الملف المرفوع لاكتشاف التكرار الداخلي بسرعة
  const fileItemNumMap = new Map<string, number[]>();
  const fileUnifiedCodeMap = new Map<string, number[]>();
  const fileNormNames: Array<{ idx: number; normName: string; rawName: string; rowNumber: number }> = [];

  uploadedRows.forEach((row, idx) => {
    byRowIndex[idx] = {
      hasCodeOverlap: false,
      hasNameSimilarity: false,
      conflicts: [],
    };

    const itemNum = normalizeCodeValue(row.itemNumber);
    const unified = normalizeCodeValue(row.unifiedCode);
    if (itemNum) {
      const list = fileItemNumMap.get(itemNum) || [];
      list.push(idx);
      fileItemNumMap.set(itemNum, list);
    }
    if (unified) {
      const list = fileUnifiedCodeMap.get(unified) || [];
      list.push(idx);
      fileUnifiedCodeMap.set(unified, list);
    }

    const normName = normalizeArabicName(row.nameAr || row.name);
    if (normName) {
      fileNormNames.push({
        idx,
        normName,
        rawName: row.nameAr || row.name || '',
        rowNumber: idx + 1,
      });
    }
  });

  // فهارس قاعدة البيانات
  const dbItemNumMap = new Map<string, FirebaseProduct[]>();
  const dbImportKeyMap = new Map<string, FirebaseProduct[]>();
  const dbEntries: Array<{
    product: FirebaseProduct;
    normName: string;
    codeLabel: string;
  }> = [];

  for (const dbp of existingDbProducts) {
    const dbItemNum = normalizeCodeValue(dbp.itemNumber);
    const dbImpKey = normalizeCodeValue(dbp.importKey);
    if (dbItemNum) {
      const arr = dbItemNumMap.get(dbItemNum) || [];
      arr.push(dbp);
      dbItemNumMap.set(dbItemNum, arr);
    }
    if (dbImpKey) {
      const arr = dbImportKeyMap.get(dbImpKey) || [];
      arr.push(dbp);
      dbImportKeyMap.set(dbImpKey, arr);
    }
    const normName = normalizeArabicName(dbp.nameAr || dbp.nameEn);
    if (normName) {
      dbEntries.push({
        product: dbp,
        normName,
        codeLabel: dbp.itemNumber || dbp.importKey || '',
      });
    }
  }

  // فحص كل صف في الكتالوج المرفوع
  uploadedRows.forEach((row, idx) => {
    const entry = byRowIndex[idx];
    const rowNum = idx + 1;
    const itemNum = normalizeCodeValue(row.itemNumber);
    const unified = normalizeCodeValue(row.unifiedCode);
    const impKey = normalizeCodeValue(row.importKey);
    const rowNormName = normalizeArabicName(row.nameAr || row.name);
    const rowRawName = row.nameAr || row.name || '';

    // 1. تداخل الأكواد داخل الملف نفسه
    if (itemNum) {
      const dupes = (fileItemNumMap.get(itemNum) || []).filter((otherIdx) => otherIdx !== idx);
      if (dupes.length > 0) {
        entry.hasCodeOverlap = true;
        entry.conflicts.push({
          type: 'code_overlap',
          source: 'file',
          severity: 'high',
          matchedCode: row.itemNumber,
          message: `رقم الصنف (${row.itemNumber}) مكرر داخل الشيت في الصفوف: ${dupes
            .slice(0, 4)
            .map((d) => `#${d + 1}`)
            .join('، ')}`,
        });
      }

      // تداخل رقم الصنف مع كود موحد لصف آخر
      const crossUnified = (fileUnifiedCodeMap.get(itemNum) || []).filter((otherIdx) => otherIdx !== idx);
      if (crossUnified.length > 0) {
        entry.hasCodeOverlap = true;
        entry.conflicts.push({
          type: 'code_overlap',
          source: 'file',
          severity: 'high',
          matchedCode: row.itemNumber,
          message: `رقم الصنف (${row.itemNumber}) يتداخل مع "كود موحد" في الصف #${crossUnified[0] + 1}`,
        });
      }
    }

    if (unified) {
      const dupes = (fileUnifiedCodeMap.get(unified) || []).filter((otherIdx) => otherIdx !== idx);
      if (dupes.length > 0) {
        entry.hasCodeOverlap = true;
        entry.conflicts.push({
          type: 'code_overlap',
          source: 'file',
          severity: 'high',
          matchedCode: row.unifiedCode,
          message: `الكود الموحد (${row.unifiedCode}) مكرر داخل الشيت في الصفوف: ${dupes
            .slice(0, 4)
            .map((d) => `#${d + 1}`)
            .join('، ')}`,
        });
      }
    }

    // 2. تداخل الأكواد مع قاعدة البيانات الحالية
    if (itemNum) {
      const dbHits = dbItemNumMap.get(itemNum) || [];
      for (const hit of dbHits) {
        const hitNormName = normalizeArabicName(hit.nameAr);
        const sameName = hitNormName && rowNormName && hitNormName === rowNormName;
        if (!sameName) {
          entry.hasCodeOverlap = true;
          entry.conflicts.push({
            type: 'code_overlap',
            source: 'database',
            severity: 'high',
            matchedCode: row.itemNumber,
            matchedName: hit.nameAr,
            message: `رقم الصنف (${row.itemNumber}) مسجل مسبقاً في قاعدة البيانات لمنتج مختلف: "${hit.nameAr}"`,
          });
          break;
        }
      }
    }

    if (unified) {
      const dbCodeHits = [
        ...(dbItemNumMap.get(unified) || []),
        ...(dbImportKeyMap.get(unified) || []),
      ];
      for (const hit of dbCodeHits) {
        const hitNormName = normalizeArabicName(hit.nameAr);
        if (hitNormName !== rowNormName) {
          entry.hasCodeOverlap = true;
          entry.conflicts.push({
            type: 'code_overlap',
            source: 'database',
            severity: 'high',
            matchedCode: row.unifiedCode,
            matchedName: hit.nameAr,
            message: `الكود الموحد (${row.unifiedCode}) متداخل في القاعدة مع: "${hit.nameAr}"`,
          });
          break;
        }
      }
    }

    // 3. تشابه وتطابق المسميات داخل الملف نفسه
    if (rowNormName) {
      let bestFileMatch: { idx: number; rawName: string; sim: number } | null = null;
      for (const other of fileNormNames) {
        if (other.idx === idx) continue;
        // استبعاد الصفوف البعيدة جداً في الطول لتسريع الفحص في ملفات 5000 صف
        if (Math.abs(other.normName.length - rowNormName.length) > Math.max(12, rowNormName.length * 0.45)) {
          continue;
        }
        const sim =
          other.normName === rowNormName ? 1 : computeNameSimilarity(rowNormName, other.normName);
        if (sim >= SIMILARITY_THRESHOLD) {
          if (!bestFileMatch || sim > bestFileMatch.sim) {
            bestFileMatch = { idx: other.idx, rawName: other.rawName, sim };
          }
          if (sim === 1) break;
        }
      }

      if (bestFileMatch) {
        const pct = Math.round(bestFileMatch.sim * 100);
        entry.hasNameSimilarity = true;
        entry.conflicts.push({
          type: 'name_similarity',
          source: 'file',
          severity: pct === 100 ? 'high' : 'medium',
          matchedName: bestFileMatch.rawName,
          similarityPercent: pct,
          message:
            pct === 100
              ? `مسمى مطابق تماماً داخل الشيت مع الصف #${bestFileMatch.idx + 1} ("${bestFileMatch.rawName}")`
              : `تشابه مسمى بنسبة ${pct}% داخل الشيت مع الصف #${bestFileMatch.idx + 1} ("${bestFileMatch.rawName}")`,
        });
      }

      // 4. تشابه المسميات مع قاعدة البيانات الحالية
      let bestDbMatch: { name: string; code: string; sim: number; sameImportKey: boolean } | null =
        null;
      for (const dbEntry of dbEntries) {
        if (
          Math.abs(dbEntry.normName.length - rowNormName.length) >
          Math.max(12, rowNormName.length * 0.45)
        ) {
          continue;
        }
        const sim =
          dbEntry.normName === rowNormName ? 1 : computeNameSimilarity(rowNormName, dbEntry.normName);
        if (sim >= SIMILARITY_THRESHOLD) {
          const sameKey =
            (Boolean(impKey) && normalizeCodeValue(dbEntry.product.importKey) === impKey) ||
            (Boolean(itemNum) && normalizeCodeValue(dbEntry.product.itemNumber) === itemNum);
          if (!bestDbMatch || sim > bestDbMatch.sim) {
            bestDbMatch = {
              name: dbEntry.product.nameAr || dbEntry.normName,
              code: dbEntry.codeLabel,
              sim,
              sameImportKey: sameKey,
            };
          }
          if (sim === 1) break;
        }
      }

      if (bestDbMatch && !bestDbMatch.sameImportKey) {
        const pct = Math.round(bestDbMatch.sim * 100);
        entry.hasNameSimilarity = true;
        entry.conflicts.push({
          type: 'name_similarity',
          source: 'database',
          severity: pct >= 95 ? 'high' : 'medium',
          matchedName: bestDbMatch.name,
          matchedCode: bestDbMatch.code,
          similarityPercent: pct,
          message: `تشابه بنسبة ${pct}% مع منتج موجود بقاعدة البيانات: "${bestDbMatch.name}"${
            bestDbMatch.code ? ` (كود: ${bestDbMatch.code})` : ''
          }`,
        });
      }
    }

    void rowNum;
  });

  let overlappingCodeRows = 0;
  let similarNameRows = 0;
  let cleanRows = 0;
  let totalConflictRows = 0;

  for (let i = 0; i < uploadedRows.length; i++) {
    const c = byRowIndex[i];
    if (c.hasCodeOverlap) overlappingCodeRows += 1;
    if (c.hasNameSimilarity) similarNameRows += 1;
    if (c.hasCodeOverlap || c.hasNameSimilarity) totalConflictRows += 1;
    else cleanRows += 1;
  }

  return {
    byRowIndex,
    overlappingCodeRows,
    similarNameRows,
    cleanRows,
    totalConflictRows,
  };
}
