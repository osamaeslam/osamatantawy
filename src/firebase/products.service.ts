import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import type { FirebaseProduct } from "../types/firebase";

const PRODUCTS_COLLECTION = "products";

export const productService = {
  /** جلب كل المنتجات */
  async getAll(): Promise<FirebaseProduct[]> {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as FirebaseProduct),
    }));
  },

  /** جلب منتج by ID */
  async getById(id: string): Promise<FirebaseProduct | null> {
    const docSnap = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...(docSnap.data() as FirebaseProduct) };
  },

  /** إضافة منتج جديد */
  async create(data: Omit<FirebaseProduct, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  },

  /** تعديل منتج */
  async update(id: string, data: Partial<FirebaseProduct>): Promise<void> {
    await updateDoc(doc(db, PRODUCTS_COLLECTION, id), data);
  },

  /** حذف منتج */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  },
};