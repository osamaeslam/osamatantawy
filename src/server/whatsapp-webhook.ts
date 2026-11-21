/**
 * ⛔️ غير مفعّل (PARKED) — هذا الملف لا يُركّب على أي سيرفر ولا يُستدعى من التطبيق.
 *
 * المشروع بيتبني كـ Vite static ويُنشر على Vercel، ومفيش Express server
 * في التشغيل (راجع package.json: مفيش start script ولا server.js)، فالـ
 * endpoint /webhook/whatsapp غير موجود على الدومين.
 *
 * كمان السطر 124 (TODO) بيثبت إن إرسال الرد الفعلي للعميل لسه مش متعمل —
 * البوت بيرد في الـ console بس.
 *
 * التفعيل بيحتاج: سيرفر دائم (Render / Railway / Vercel Function) +
 * WhatsApp Business Cloud API (Meta) + verify token + App Secret + ربط
 * الرقم — راجع WHATSAPP_BOT.md.
 */
import express from "express";
import { WhatsAppBot } from "../services/whatsapp-bot";
import { productService } from "../supabase/products.service";
import { orderService } from "../supabase/orders.service";
import { whatsappClickService } from "../supabase/whatsapp-click.service";
import { fetchProductsFromGoogleSheets } from "../services/google-sheets.service";
import type { FirebaseProduct, FirebaseOrder } from "../types/firebase";

const router = express.Router();
const bot = new WhatsAppBot();

async function getProducts(): Promise<FirebaseProduct[]> {
  //اولوية: جوجل شيت (المصدر الأساسي المحدث يومياً)
  try {
    const sheetProducts = await fetchProductsFromGoogleSheets();
    if (sheetProducts.length > 0) return sheetProducts;
  } catch {
    //继续
  }

  //ثانياً: محاولة جلب من سوبابيز
  try {
    return await productService.getAll();
  } catch {
    return [];
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

    console.log(`WhatsApp Bot -> ${phone}: ${response.reply}`);

    res.json({ status: "ok", reply: response.reply });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;