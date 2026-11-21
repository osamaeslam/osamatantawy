import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

interface CatalogAnalyzeItemInput {
  rowIndex: number;
  name: string;
  description?: string;
  familyName?: string;
  itemGroup?: string;
  sector?: string;
  imageUrl?: string;
}

interface CatalogAnalyzeResultItem {
  rowIndex: number;
  category: string;
  subCategory: string;
  brand: string;
  confidence: string;
  reason: string;
  usedImage: boolean;
}

const MAX_BATCH_SIZE = 15;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 4500;

function normalizeDriveImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (/drive\.google\.com|docs\.google\.com/.test(trimmed)) {
    const match =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}=w400`;
    }
  }
  return trimmed;
}

function isBlockedPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }
  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) {
    return true;
  }
  const m172 = host.match(/^172\.(\d+)\./);
  if (m172 && Number(m172[1]) >= 16 && Number(m172[1]) <= 31) {
    return true;
  }
  return false;
}

async function fetchImageInlineData(
  rawUrl?: string
): Promise<{ inlineData: { mimeType: string; data: string } } | null> {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === '/logo.png' || trimmed === 'logo.png') return null;

  const targetUrl = normalizeDriveImageUrl(trimmed);
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (isBlockedPrivateHost(parsed.hostname)) return null;

  try {
    const res = await fetch(parsed.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
      headers: {
        Accept: 'image/*',
      },
    });
    if (!res.ok) return null;

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) return null;

    const contentLength = Number(res.headers.get('content-length') || 0);
    if (contentLength > MAX_IMAGE_BYTES) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) return null;

    return {
      inlineData: {
        mimeType: contentType,
        data: buf.toString('base64'),
      },
    };
  } catch {
    return null;
  }
}

async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.status || err?.code;
      const retryable = status === 429 || status === 503 || status === 500;
      if (!retryable || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * Math.pow(2, attempt)));
    }
  }
  throw lastErr;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/catalog/analyze', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          'مفتاح GEMINI_API_KEY غير متوفر على الخادم. يرجى ضبطه من لوحة Settings > Secrets لتفعيل التصنيف التلقائي بالصور والوصف.',
      });
    }

    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const availableCategories: string[] = Array.isArray(req.body?.availableCategories)
      ? req.body.availableCategories.filter((c: unknown) => typeof c === 'string' && c.trim())
      : ['أجهزة منزلية', 'أجهزة كهربيه'];

    if (rawItems.length === 0) {
      return res.status(400).json({ error: 'لا توجد منتجات لتحليلها في الطلب.' });
    }

    const items: CatalogAnalyzeItemInput[] = rawItems.slice(0, MAX_BATCH_SIZE).map((item: any) => ({
      rowIndex: Number(item?.rowIndex ?? 0),
      name: String(item?.name || '').trim(),
      description: String(item?.description || '').trim(),
      familyName: String(item?.familyName || '').trim(),
      itemGroup: String(item?.itemGroup || '').trim(),
      sector: String(item?.sector || '').trim(),
      imageUrl: String(item?.imageUrl || '').trim(),
    }));

    try {
      const imageResults = await Promise.all(items.map((item) => fetchImageInlineData(item.imageUrl)));

      const parts: Array<
        { text: string } | { inlineData: { mimeType: string; data: string } }
      > = [
        {
          text:
            `أنت خبير تصنيف منتجات تجارية لمتجر "طنطاوي جروب / كتالوج دريم".\n` +
            `الأقسام الرئيسية المتاحة في المتجر هي: ${availableCategories.join(' | ')}\n` +
            `المطلوب: لكل منتج أدناه، حلّل الصورة المرفقة له (إن وجدت) مع اسم المنتج والوصف والمجموعة، ثم صنّفه بدقة إلى:\n` +
            `1. category: اسم أنسب قسم رئيسي من القائمة المتاحة أعلاه (يفضل "أجهزة منزلية" للأجهزة المنزلية والمطبخ وأدوات السفرة والحلل، أو "أجهزة كهربيه" للشاشات والتكييفات والإلكترونيات والأجهزة الكهربائية، أو أقرب قسم متاح).\n` +
            `2. subCategory: التصنيف الفرعي الدقيق بالعربية (مثل: ثلاجات، غسالات، بوتاجازات، شاشات، تكييفات، خلاطات، أدوات مطبخ، أطقم حلل، مكانس...).\n` +
            `3. brand: الماركة المستنتجة من الصورة أو الاسم (أو فارغ "" إن لم تظهر).\n` +
            `4. confidence: "high" أو "medium" أو "low".\n` +
            `5. usedImage: true إذا اعتمدت على صورة مرفقة وواضحة، false إذا اعتمدت على النص فقط.\n` +
            `6. reason: جملة عربية قصيرة توضح ما تم رصده في الصورة والوصف.\n\n` +
            `المنتجات المطلوب تحليلها:`,
        },
      ];

      items.forEach((item, idx) => {
        const imgPart = imageResults[idx];
        parts.push({
          text:
            `\n[Product #${item.rowIndex}]\n` +
            `الاسم: ${item.name || 'غير محدد'}\n` +
            `الوصف: ${item.description || 'لا يوجد وصف'}\n` +
            `المجموعة/العائلة: ${[item.itemGroup, item.familyName].filter(Boolean).join(' / ') || 'غير محدد'}\n` +
            `القسم الأولي: ${item.sector || 'غير محدد'}\n` +
            `حالة الصورة: ${imgPart ? 'مرفقة في الجزء التالي لتحليلها بصرياً' : 'غير متاحة — اعتمد على الاسم والوصف'}`,
        });
        if (imgPart) {
          parts.push(imgPart);
        }
      });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rowIndex: {
                    type: Type.INTEGER,
                    description: 'Same rowIndex from [Product #rowIndex]',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Matched main store category in Arabic',
                  },
                  subCategory: {
                    type: Type.STRING,
                    description: 'Specific Arabic product sub-category',
                  },
                  brand: {
                    type: Type.STRING,
                    description: 'Detected brand name or empty string',
                  },
                  confidence: {
                    type: Type.STRING,
                    description: 'high, medium, or low',
                  },
                  usedImage: {
                    type: Type.BOOLEAN,
                    description: 'True if product image was attached and analyzed visually',
                  },
                  reason: {
                    type: Type.STRING,
                    description: 'Short Arabic justification referencing image and description cues',
                  },
                },
                required: ['rowIndex', 'category', 'subCategory', 'brand', 'confidence', 'usedImage', 'reason'],
              },
            },
          },
        })
      );

      const rawJson = (response.text ?? '[]').trim();
      const parsed: CatalogAnalyzeResultItem[] = JSON.parse(rawJson);

      return res.json({
        results: parsed,
        imagesAnalyzedCount: imageResults.filter(Boolean).length,
      });
    } catch (err: any) {
      console.error('Catalog AI classification error:', err);
      const status = typeof err?.status === 'number' && err.status >= 400 ? err.status : 500;
      return res.status(status).json({
        error: err?.message || 'حدث خطأ أثناء تحليل الصور والوصف عبر خادم الذكاء الاصطناعي.',
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(process.cwd(), 'dist');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    if (process.env.DISABLE_HMR === 'true') {
      app.use('/@vite/client', (req, res, next) => {
        delete req.headers['if-none-match'];
        const chunks: Buffer[] = [];
        const origWrite = res.write.bind(res);
        const origEnd = res.end.bind(res);

        res.write = ((chunk: any, ...args: any[]) => {
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          return true;
        }) as typeof res.write;

        res.end = ((chunk?: any, ...args: any[]) => {
          if (chunk && typeof chunk !== 'function') {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const body = Buffer.concat(chunks).toString('utf8');
          if (body.includes('transport.connect(createHMRHandler(handleMessage))')) {
            const patched = body.replace(
              'transport.connect(createHMRHandler(handleMessage));',
              'transport.send = async () => {}; transport.invoke = async () => undefined; /* HMR WebSocket disabled (DISABLE_HMR=true) */'
            );
            res.removeHeader('etag');
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Content-Length', Buffer.byteLength(patched));
            res.write = origWrite;
            res.end = origEnd;
            return origEnd(patched);
          }
          res.write = origWrite;
          res.end = origEnd;
          return origEnd(body);
        }) as typeof res.end;

        next();
      });
    }

    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Tantawy Dream Catalog server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
