import express from "express";
import { WhatsAppBot } from "../services/whatsapp-bot";
import type { FirebaseProduct } from "../types/firebase";

const router = express.Router();
const bot = new WhatsAppBot();

// قائمة منتجات مؤقتة — في النهاية تجلبها من Firebase عبر productService.getAll()
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

router.post("/webhook/whatsapp", express.json(), async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "phone and message are required" });
    }

    const reply = await bot.handleMessage(phone, message, MOCK_PRODUCTS);

    // TODO: هنا يتم إرسال الرد عبر WhatsApp Business API (Meta/Twilio/مزود مصري)
    // await sendWhatsAppMessage(phone, reply);

    console.log(`WhatsApp Bot -> ${phone}: ${reply}`);

    res.json({ status: "ok", reply });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;