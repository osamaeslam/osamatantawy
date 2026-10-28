import express from "express";
import { WhatsAppBot } from "../services/whatsapp-bot";
import { productService } from "../supabase/products.service";
import { orderService } from "../supabase/orders.service";
import { whatsappClickService } from "../supabase/whatsapp-click.service";
import { fetchProductsFromGoogleSheets } from "../services/google-sheets.service";
import type { FirebaseProduct, FirebaseOrder } from "../types/firebase";

const router = express.Router();
const bot = new WhatsAppBot();

// قائمة منتجات افتراضية تُستخدم فقط لو Firebase غير مضبوط بعد
const MOCK_PRODUCTS: FirebaseProduct[] = [
  {
    id: "P001",
    nameAr: "طقم صيني Gemya 58 قطعة - موديل 2005#4",
    nameEn: "Gemya 58-Piece Porcelain Set",
    categoryAr: "أدوات منزلية",
    category: "Home & Kitchen",
    price: 1250,
    discountedPrice: 1050,
    imageUrl: "/assets/tantawy-gemya-2005-4.png",
    colors: ["أبيض", "كريمي"],
    sizes: ["58 قطعة", "40 قطعة"],
    inStock: true,
    brand: "Gemya",
    createdAt: new Date(),
  },
  {
    id: "P002",
    nameAr: "إبريق ضغط ألزا 12 لتر",
    nameEn: "Alza Pressure Cooker 12L",
    categoryAr: "أجهزة مطبخ",
    category: "Kitchen Appliances",
    price: 950,
    discountedPrice: 850,
    imageUrl: "/assets/tantawy-alza-cooker.png",
    colors: ["ستانلس ستيل"],
    sizes: ["12 لتر"],
    inStock: true,
    brand: "Alza",
    createdAt: new Date(),
  },
  {
    id: "P003",
    nameAr: "طقم صيني لوتس 7 قطعة - موديل 8035#2",
    nameEn: "Lotus 7-Piece Porcelain Set",
    categoryAr: "أدوات منزلية",
    category: "Home & Kitchen",
    price: 750,
    discountedPrice: 650,
    imageUrl: "/assets/tantawy-lotus-8035-2.png",
    colors: ["أبيض مع ورود"],
    sizes: ["7 قطعة"],
    inStock: true,
    brand: "Lotus",
    createdAt: new Date(),
  },
  {
    id: "P004",
    nameAr: "طقم أكواب ديلسوجا 6 أكواب - موديل DSK8502-2B",
    nameEn: "Delisoga 6 Glasses Set",
    categoryAr: "أكواب وزجاجيات",
    category: "Glassware",
    price: 400,
    discountedPrice: 280,
    imageUrl: "/assets/tantawy-delisoga-glass.png",
    colors: ["شفاف"],
    sizes: ["6 أكواب"],
    inStock: true,
    brand: "Delisoga",
    createdAt: new Date(),
  },
];

async function getProducts(): Promise<FirebaseProduct[]> {
  //اولوية: جوجل شيت (المصدر الأساسي المحدث يومياً)
  try {
    const sheetProducts = await fetchProductsFromGoogleSheets();
    if (sheetProducts.length > 0) return sheetProducts;
  } catch {
    //继续
  }

  //ثانياً: محاولة جلب من سوتبايز
  try {
    return await productService.getAll();
  } catch {
    // إذا فشل، نستخدم المنتجات الوهمية مؤقتاً
    return MOCK_PRODUCTS;
  }
}

async function saveOrder(orderData: Omit<FirebaseOrder, "id">): Promise<string | null> {
  try {
    return await orderService.create(orderData);
  } catch {
    console.warn("Firebase not configured — order not saved to database");
    return null;
  }
}

router.post("/webhook/whatsapp", express.json(), async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "phone and message are required" });
    }

    const products = await getProducts();
    const response = await bot.handleMessage(phone, message, products);

    // لو البوت رجع بيانات طلب، نحفظها في Supabase
    if (response.orderData) {
      await saveOrder(response.orderData);
    }

    // تتبع نقرات الواتساب إذا كانت الرسالة تحتوي على طلب شراء أو رابط واتساب
    if (/واتساب|شراء|رابط|اتصل|طلب/i.test(message)) {
      await whatsappClickService.trackClick(undefined, message, phone);
    }

    // TODO: هنا يتم إرسال الرد الفعلي عبر WhatsApp Business API (Meta / Twilio / مزود مصري)
    // await sendWhatsAppMessage(phone, reply);

    console.log(`WhatsApp Bot -> ${phone}: ${reply}`);

    res.json({ status: "ok", reply });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;