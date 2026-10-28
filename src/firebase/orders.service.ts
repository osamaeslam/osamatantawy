import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import type { FirebaseOrder } from "../types/firebase";

const ORDERS_COLLECTION = "orders";

export const orderService = {
  /** جلب كل الطلبات */
  async getAll(): Promise<FirebaseOrder[]> {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as FirebaseOrder),
    }));
  },

  /** جلب طلبات رقم تليفون معين */
  async getByPhone(phone: string): Promise<FirebaseOrder[]> {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where("customerPhone", "==", phone),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as FirebaseOrder),
    }));
  },

  /** إضافة طلب جديد */
  async create(data: Omit<FirebaseOrder, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  },

  /** تعديل حالة طلب */
  async updateStatus(id: string, status: FirebaseOrder["status"]): Promise<void> {
    await updateDoc(doc(db, ORDERS_COLLECTION, id), { status });
  },
};