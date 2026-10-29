import { useState, useEffect } from 'react';
import { visitorService } from '../supabase/visitor.service';
import { whatsappClickService } from '../supabase/whatsapp-click.service';
import { orderService } from '../supabase/orders.service';
import { productService } from '../supabase/products.service';
import type { DashboardStats } from '../types/supabase-extended';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    total_visitors: 0,
    total_whatsapp_clicks: 0,
    total_orders: 0,
    total_products: 0,
    today_visitors: 0,
    today_orders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [visitors, clicks, orders, products, todayVisitors] = await Promise.all([
          visitorService.getCount(),
          whatsappClickService.getCount(),
          orderService.getAll(),
          productService.getAll(),
          visitorService.getTodayCount(),
        ]);

        setStats({
          total_visitors: visitors,
          total_whatsapp_clicks: clicks,
          total_orders: orders.length,
          total_products: products.length,
          today_visitors: todayVisitors,
          today_orders: orders.filter((o) => {
            const d = new Date(o.createdAt || '').toISOString().split('T')[0];
            return d === new Date().toISOString().split('T')[0];
          }).length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { stats, loading };
}