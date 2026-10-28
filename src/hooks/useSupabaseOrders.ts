import { useState } from 'react';
import { orderService } from '../supabase/orders.service';
import type { FirebaseOrder } from '../types/firebase';

export function useSupabaseOrders() {
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadByPhone = async (phone: string) => {
    setLoading(true);
    try {
      const data = await orderService.getByPhone(phone);
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (data: Omit<FirebaseOrder, 'id'>) => {
    try {
      const id = await orderService.create(data);
      const newOrder = { ...data, id };
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { orders, loading, error, loadAll, loadByPhone, createOrder };
}