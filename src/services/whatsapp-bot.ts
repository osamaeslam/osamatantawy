import type { FirebaseProduct } from "../types/firebase";
import type { UserSession, BotState } from "../types/firebase";

export class WhatsAppBot {
  private sessions = new Map<string, UserSession>();

  private getSession(phone: string): UserSession {
    if (!this.sessions.has(phone)) {
      this.sessions.set(phone, { phone, state: "welcome" });
    }
    return this.sessions.get(phone)!;
  }

  private setSession(phone: string, session: Partial<UserSession>): void {
    const current = this.getSession(phone);
    this.sessions.set(phone, { ...current, ...session });
  }

  /** نقطة الدخول الرئيسية لكل رسالة واردة */
  async handleMessage(phone: string, text: string, products: FirebaseProduct[]): Promise<string> {
    const session = this.getSession(phone);
    const trimmed = text.trim();

    // حالات الخروج أو البدء من جديد
    if (trimmed === "القائمة" || trimmed === "البدء" || trimmed === "مرحبا") {
      this.setSession(phone, { state: "menu" });
      return this.welcomeMessage();
    }

    switch (session.state) {
      case "welcome":
        this.setSession(phone, { state: "menu" });
        return this.welcomeMessage();

      case "menu":
        return this.handleMenu(phone, trimmed, products);

      case "selecting_product":
        return this.handleSelectProduct(phone, trimmed, products);

      case "selecting_color":
        return this.handleSelectColor(phone, trimmed);

      case "selecting_size":
        return this.handleSelectSize(phone, trimmed);

      case "confirming":
        return this.handleConfirm(phone, trimmed);

      default:
        this.setSession(phone, { state: "menu" });
        return this.welcomeMessage();
    }
  }

  private welcomeMessage(): string {
    return `أهلاً بكم في 🛍️ طنطاوي جروب

اختر من القائمة:
1️⃣ عرض المنتجات
2️⃣ تتبع طلبك
3️⃣ التحدث مع خدمة العملاء

أو اكتب "القائمة" في أي وقت للعودة هنا.`;
  }

  private handleMenu(phone: string, text: string, products: FirebaseProduct[]): string {
    if (text === "1") {
      this.setSession(phone, { state: "selecting_product" });
      return this.listProducts(products);
    }
    if (text === "2") {
      return "أرسل رقم تليفونك لاستعراض طلباتك.";
    }
    if (text === "3") {
      return "سيتم التواصل معك قريباً عبر رقم الخط الساخن 15218.";
    }
    return "اختيار غير صحيح. يرجى اختيار 1 أو 2 أو 3.";
  }

  private listProducts(products: FirebaseProduct[]): string {
    if (!products || products.length === 0) {
      return "لا توجد منتجات متاحة حالياً.";
    }
    const list = products
      .map((p, i) => `${i + 1}. ${p.nameAr} - ${p.discountedPrice ?? p.price} جنيه`)
      .join("\n");
    return `إليك منتجاتنا المتاحة:\n\n${list}\n\nأرسل رقم المنتج اللي عايزه.`;
  }

  private handleSelectProduct(phone: string, text: string, products: FirebaseProduct[]): string {
    const index = parseInt(text, 10) - 1;
    if (isNaN(index) || index < 0 || index >= products.length) {
      return "الرقم غير صحيح. يرجى إرسال رقم منتج من القائمة.";
    }
    const product = products[index];
    this.setSession(phone, { state: "selecting_color", selectedProduct: product });

    const colors = product.colors.join("، ");
    return `اخترت: ${product.nameAr}\nالألوان المتاحة: ${colors}\nأرسل اسم اللون اللي عايزه.`;
  }

  private handleSelectColor(phone: string, text: string): string {
    const session = this.getSession(phone);
    const product = session.selectedProduct;
    if (!product) {
      this.setSession(phone, { state: "menu" });
      return "حدث خطأ، يرجى بدء العملية من جديد.";
    }
    if (!product.colors.includes(text)) {
      return `اللون غير متاح. الألوان المتاحة: ${product.colors.join("، ")}`;
    }
    this.setSession(phone, { state: "selecting_size", selectedColor: text });

    const sizes = product.sizes.join("، ");
    return `تم اختيار اللون: ${text}\nالمقاسات المتاحة: ${sizes}\nأرسل اسم المقاس اللي عايزه.`;
  }

  private handleSelectSize(phone: string, text: string): string {
    const session = this.getSession(phone);
    const product = session.selectedProduct;
    if (!product || !session.selectedColor) {
      this.setSession(phone, { state: "menu" });
      return "حدث خطأ، يرجى بدء العملية من جديد.";
    }
    if (!product.sizes.includes(text)) {
      return `المقاس غير متاح. المقاسات المتاحة: ${product.sizes.join("، ")}`;
    }
    this.setSession(phone, { state: "confirming", selectedSize: text });

    const total = (product.discountedPrice ?? product.price) * (session.quantity || 1);
    return `ملخص طلبك:
🛍️ المنتج: ${product.nameAr}
🎨 اللون: ${session.selectedColor}
📏 المقاس: ${text}
💰 السعر: ${total} جنيه

أرسل "تأكيد" لتسجيل الطلب، أو "إلغاء" للرجوع.`;
  }

  private handleConfirm(phone: string, text: string): string {
    if (text === "تأكيد") {
      const session = this.getSession(phone);
      const product = session.selectedProduct;
      if (!product || !session.selectedColor || !session.selectedSize) {
        return "حدث خطأ في بيانات الطلب.";
      }
      const total = (product.discountedPrice ?? product.price) * (session.quantity || 1);
      const orderId = `TG-${Date.now().toString().slice(-6)}`;

      // هنا يتم استدعاء خدمة حفظ الطلب في Firebase
      // await orderService.create({ ... });

      this.setSession(phone, { state: "completed" });
      return `✅ تم تسجيل طلبك بنجاح!

📋 رقم الطلب: ${orderId}
🛍️ المنتج: ${product.nameAr}
🎨 اللون: ${session.selectedColor}
📏 المقاس: ${session.selectedSize}
💰 المبلغ: ${total} جنيه

سيتم التواصل معك خلال ساعة على رقم تليفونك لتأكيد التوصيل والدفع عند الاستلام.`;
    }
    if (text === "إلغاء") {
      this.setSession(phone, { state: "menu" });
      return "تم إلغاء الطلب. عايز حاجة تانية؟";
    }
    return "أرسل 'تأكيد' لتسجيل الطلب أو 'إلغاء' للرجوع.";
  }
}