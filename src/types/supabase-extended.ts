import type { FirebaseProduct, FirebaseOrder } from './firebase';

export interface Visitor {
  id?: string;
  ip_address?: string;
  page_visited: string;
  user_agent?: string;
  created_at?: any;
}

export interface WhatsAppClick {
  id?: string;
  product_id?: string;
  product_name_ar?: string;
  clicked_at?: any;
  user_ip?: string;
}

export interface ExcelUpload {
  id?: string;
  file_name: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  uploaded_at?: any;
  uploaded_by?: string;
}

export interface DashboardStats {
  total_visitors: number;
  total_whatsapp_clicks: number;
  total_orders: number;
  total_products: number;
  today_visitors: number;
  today_orders: number;
}