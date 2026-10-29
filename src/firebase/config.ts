import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ═════════════════════════════════════════════════════════════════════
// ⚠️  استبدل القيم دي بمشروعك الحقيقي من Firebase Console
// 1. ادخل على https://console.firebase.google.com
// 2. أنشئ مشروع جديد أو اختر مشروع موجود
// 3. من إعدادات المشروع (Project Settings) انسخ ال config values
// 4. لصقها مكان القيم الحالية أدناه
// ═════════════════════════════════════════════════════════════════════

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// دالة آمنة لت inicialize Firebase فقط لو القيم حقيقية
let dbInstance: ReturnType<typeof getFirestore> | null = null;

export function initFirebase() {
  if (
    firebaseConfig.apiKey === "YOUR_API_KEY" ||
    firebaseConfig.projectId === "YOUR_PROJECT_ID"
  ) {
    console.warn(
      "Firebase not configured. Please set your Firebase config in src/firebase/config.ts"
    );
    return null;
  }

  if (!dbInstance) {
    const app = initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}

export const db = initFirebase();