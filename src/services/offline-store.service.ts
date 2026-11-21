import type { Product } from '../types';
import { normalizeImageUrl } from './image-url';
import { productService } from '../supabase/products.service';
import { orderService } from '../supabase/orders.service';
import { itemRequestService } from './item-requests.service';
import { stockAlertsService } from './stock-alerts.service';

const DB_NAME = 'tantawy_offline_db_v1';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products';
const STORE_QUEUE = 'pending_actions';
const STORE_ORDERS = 'local_orders';
const LOCAL_QUEUE_FALLBACK_KEY = 'tantawy_offline_queue_v1';
const LOCAL_ORDERS_FALLBACK_KEY = 'tantawy_saved_orders';

export type OfflineActionType =
  | 'invoice_order'
  | 'customer_order'
  | 'item_request'
  | 'stock_alert';

export interface OfflinePendingAction {
  id: string;
  type: OfflineActionType;
  payload: any;
  createdAt: string;
}

export interface LocalSavedOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  pendingSync?: boolean;
}

function withNormalized(p: Product): Product {
  return {
    ...p,
    previewimage: normalizeImageUrl(p.previewimage),
    imageLink: normalizeImageUrl(p.imageLink),
    previewimages: Array.isArray(p.previewimages)
      ? p.previewimages.map((u) => normalizeImageUrl(u))
      : p.previewimages,
  };
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
          db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_ORDERS)) {
          db.createObjectStore(STORE_ORDERS, { keyPath: 'orderId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

function readLocalArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function writeLocalArray<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

export const isLikelyOfflineError = (err: unknown): boolean => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const msg = String((err as any)?.message || err || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('err_internet_disconnected') ||
    msg.includes('timeout')
  );
};

export const offlineStoreService = {
  /** قراءة كل المنتجات المحفوظة محلياً في IndexedDB (بدون حد 5MB وبلا حجب للواجهة) */
  async getAllProducts(): Promise<Product[]> {
    const db = await openDB();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PRODUCTS, 'readonly');
        const store = tx.objectStore(STORE_PRODUCTS);
        const req = store.getAll();
        req.onsuccess = () => {
          const rows = Array.isArray(req.result) ? req.result : [];
          resolve(rows.map(withNormalized));
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  },

  /** عدد الأصناف المحفوظة أوفلاين حالياً */
  async getCachedProductCount(): Promise<number> {
    const db = await openDB();
    if (!db) return 0;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PRODUCTS, 'readonly');
        const req = tx.objectStore(STORE_PRODUCTS).count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  },

  /** دمج دفعة جديدة من المنتجات داخل IndexedDB بدون مسح الدفعات السابقة */
  async mergeProducts(items: Product[]): Promise<void> {
    if (!items || items.length === 0) return;
    const db = await openDB();
    if (!db) return;

    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
        const store = tx.objectStore(STORE_PRODUCTS);
        for (const item of items) {
          if (item && item.id) {
            store.put(withNormalized(item));
          }
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  /** مسح كاش المنتجات في IndexedDB عند إعادة ضبط المصنع */
  async clearProducts(): Promise<void> {
    const db = await openDB();
    if (!db) return;

    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
        tx.objectStore(STORE_PRODUCTS).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  /**
   * تحميل الكتالوج على دفعات خفيفة (Progressive Chunking) وحفظه في IndexedDB + كاش الصور
   * فقط عند طلب المستخدم لتجنب سحب الداتا كلها عند الفتح لأول مرة
   */
  async downloadCatalogInChunks(options: {
    pageSize?: number;
    maxItems?: number;
    signal?: AbortSignal;
    onBatch?: (batch: Product[], downloaded: number, total: number) => void;
  } = {}): Promise<{ downloaded: number; total: number; aborted: boolean }> {
    const pageSize = Math.min(200, Math.max(24, options.pageSize || 120));
    const maxItems = options.maxItems || 10000;
    let page = 1;
    let downloaded = 0;
    let total = 0;

    while (downloaded < maxItems) {
      if (options.signal?.aborted) {
        return { downloaded, total, aborted: true };
      }

      const res = await productService.getMappedPaged({ page, pageSize });
      total = res.totalCount || downloaded + res.products.length;

      if (!res.products || res.products.length === 0) {
        break;
      }

      await this.mergeProducts(res.products);
      downloaded += res.products.length;
      options.onBatch?.(res.products, downloaded, total);

      // تهيئة صور هذه الدفعة في كاش المتصفح بصمت حتى تظهر أوفلاين
      if (typeof window !== 'undefined' && typeof fetch === 'function') {
        const urls = res.products
          .map((p) => normalizeImageUrl(p.previewimage, undefined, 400))
          .filter((u) => u && u.startsWith('http') && !u.includes('logo.png'))
          .slice(0, 24);
        Promise.allSettled(
          urls.map((u) => fetch(u, { mode: 'no-cors', cache: 'force-cache' }))
        ).catch(() => {});
      }

      if (res.products.length < pageSize || downloaded >= total) {
        break;
      }

      page += 1;
      await new Promise((r) => setTimeout(r, 120));
    }

    return { downloaded, total, aborted: false };
  },

  /** حفظ طلب محلياً بحيث يظهر فوراً في تتبع الطلبات حتى أثناء انقطاع الإنترنت */
  async saveLocalOrder(order: LocalSavedOrder): Promise<void> {
    const existing = readLocalArray<LocalSavedOrder>(LOCAL_ORDERS_FALLBACK_KEY);
    const next = [order, ...existing.filter((o) => o.orderId !== order.orderId)].slice(0, 60);
    writeLocalArray(LOCAL_ORDERS_FALLBACK_KEY, next);

    const db = await openDB();
    if (!db) return;

    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_ORDERS, 'readwrite');
        tx.objectStore(STORE_ORDERS).put(order);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  async getLocalOrdersByPhone(phone: string): Promise<LocalSavedOrder[]> {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    if (!clean) return [];

    const db = await openDB();
    let list: LocalSavedOrder[] = readLocalArray<LocalSavedOrder>(LOCAL_ORDERS_FALLBACK_KEY);

    if (db) {
      const idbOrders = await new Promise<LocalSavedOrder[]>((resolve) => {
        try {
          const tx = db.transaction(STORE_ORDERS, 'readonly');
          const req = tx.objectStore(STORE_ORDERS).getAll();
          req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
          req.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });
      if (idbOrders.length > 0) {
        const byId = new Map<string, LocalSavedOrder>();
        [...list, ...idbOrders].forEach((o) => {
          if (o?.orderId) byId.set(o.orderId, o);
        });
        list = Array.from(byId.values());
      }
    }

    return list.filter((o) => (o.customerPhone || '').replace(/[^0-9]/g, '').includes(clean));
  },

  async markLocalOrderSynced(orderId: string): Promise<void> {
    const existing = readLocalArray<LocalSavedOrder>(LOCAL_ORDERS_FALLBACK_KEY);
    const updated = existing.map((o) => (o.orderId === orderId ? { ...o, pendingSync: false } : o));
    writeLocalArray(LOCAL_ORDERS_FALLBACK_KEY, updated);

    const db = await openDB();
    if (!db) return;

    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_ORDERS, 'readwrite');
        const store = tx.objectStore(STORE_ORDERS);
        const getReq = store.get(orderId);
        getReq.onsuccess = () => {
          if (getReq.result) {
            store.put({ ...getReq.result, pendingSync: false });
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  /** إضافة عملية (طلب / تنبيه توفر / طلب صنف خاص) إلى طابور المزامنة عند عودة الإنترنت */
  async enqueueAction(type: OfflineActionType, payload: any): Promise<OfflinePendingAction> {
    const action: OfflinePendingAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
    };

    const existing = readLocalArray<OfflinePendingAction>(LOCAL_QUEUE_FALLBACK_KEY);
    writeLocalArray(LOCAL_QUEUE_FALLBACK_KEY, [...existing, action]);

    const db = await openDB();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_QUEUE, 'readwrite');
          tx.objectStore(STORE_QUEUE).put(action);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }

    window.dispatchEvent(new CustomEvent('tantawy-offline-queue-changed'));
    return action;
  },

  async getPendingActions(): Promise<OfflinePendingAction[]> {
    const fallback = readLocalArray<OfflinePendingAction>(LOCAL_QUEUE_FALLBACK_KEY);
    const db = await openDB();
    if (!db) return fallback;

    const idbItems = await new Promise<OfflinePendingAction[]>((resolve) => {
      try {
        const tx = db.transaction(STORE_QUEUE, 'readonly');
        const req = tx.objectStore(STORE_QUEUE).getAll();
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });

    const byId = new Map<string, OfflinePendingAction>();
    [...fallback, ...idbItems].forEach((a) => {
      if (a?.id) byId.set(a.id, a);
    });
    return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async removePendingAction(id: string): Promise<void> {
    const remaining = readLocalArray<OfflinePendingAction>(LOCAL_QUEUE_FALLBACK_KEY).filter(
      (a) => a.id !== id
    );
    writeLocalArray(LOCAL_QUEUE_FALLBACK_KEY, remaining);

    const db = await openDB();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_QUEUE, 'readwrite');
          tx.objectStore(STORE_QUEUE).delete(id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }

    window.dispatchEvent(new CustomEvent('tantawy-offline-queue-changed'));
  },

  /** مزامنة جميع العمليات المعلقة فور عودة الاتصال بالإنترنت */
  async flushPendingActions(): Promise<{ synced: number; failed: number }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    const actions = await this.getPendingActions();
    if (actions.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const action of actions) {
      try {
        if (action.type === 'invoice_order') {
          await orderService.saveInvoiceOrder(action.payload);
          if (action.payload?.orderId) {
            await this.markLocalOrderSynced(action.payload.orderId);
          }
        } else if (action.type === 'customer_order') {
          await orderService.create(action.payload);
          if (action.payload?.orderId) {
            await this.markLocalOrderSynced(action.payload.orderId);
          }
        } else if (action.type === 'item_request') {
          await itemRequestService.create(action.payload);
        } else if (action.type === 'stock_alert') {
          await stockAlertsService.addAlert(action.payload);
        }

        await this.removePendingAction(action.id);
        synced += 1;
      } catch (err) {
        if (isLikelyOfflineError(err)) {
          failed += 1;
          break;
        }
        // خطأ دائم في السجل لا يمنع استكمال باقي الطابور
        failed += 1;
      }
    }

    return { synced, failed };
  },
};
