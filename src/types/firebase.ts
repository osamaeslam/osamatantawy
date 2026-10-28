export interface FirebaseProduct {
  id?: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  category: string;
  price: number;
  discountedPrice?: number;
  imageUrl: string;
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
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  createdAt: any;
  whatsappMessageId?: string;
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