export interface FirebaseProduct {
  id?: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  category: string;
  price: number;
  discountedPrice?: number;
  imageUrl: string;
  itemNumber?: string;
  importKey?: string;
  colors: string[];
  sizes: string[];
  inStock: boolean;
  brand: string;
  createdAt: any;
}

export interface FirebaseOrder {
  id?: string;
  orderId: string;
  customerPhone: string;
  customerName: string;
  productId: string;
  productNameAr: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  totalPrice: number;
  status: "pending" | "priced" | "confirmed" | "dispatched" | "delivered" | "cancelled";
  createdAt: any;
  /** أول لحظة اتغيّرت فيها الحالة من pending (لمؤشرات خدمة العملاء) */
  respondedAt?: string | null;
  /** اسم الموظف/المندوب المسؤول عن متابعة الطلب */
  assignedTo?: string | null;
  assignedAt?: string | null;
  followUpNote?: string | null;
  whatsappMessageId?: string;
  customerAddress?: string;
  imageUrl?: string;
  whatsappSent?: boolean;
  items?: any;
}

export type BotState =
  | "welcome"
  | "menu"
  | "selecting_product"
  | "selecting_color"
  | "selecting_size"
  | "confirming"
  | "completed";

export interface UserSession {
  phone: string;
  state: BotState;
  selectedProduct?: FirebaseProduct;
  selectedColor?: string;
  selectedSize?: string;
  quantity?: number;
}