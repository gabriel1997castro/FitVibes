import { supabase } from './supabase';

export interface PaymentHistoryItem {
  id: string;
  group_id: string;
  post_id?: string;
  from_user_id: string;
  to_user_id: string;
  reason: string;
  amount: number;
  created_at: string;
  group?: { name: string; emoji?: string };
  from_user?: { name: string };
  to_user?: { name: string };
}

export class PaymentHistoryService {
  static async getHistory({ groupId, cycleStart, cycleEnd }: { groupId: string; cycleStart?: string; cycleEnd?: string }) {
    let query = supabase
      .from('payment_history')
      .select(`
        id, group_id, post_id, from_user_id, to_user_id, reason, amount, created_at,
        groups (name, emoji),
        from_user:users!payment_history_from_user_id_fkey (name),
        to_user:users!payment_history_to_user_id_fkey (name)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (cycleStart) query = query.gte('created_at', cycleStart);
    if (cycleEnd) query = query.lte('created_at', cycleEnd);
    const { data, error } = await query;
    console.log({ data, error})
    if (error) throw error;
    const mapped = (data as any[]).map(item => ({
      ...item,
      group: Array.isArray(item.groups) ? item.groups[0] : item.groups,
      from_user: Array.isArray(item.from_user) ? item.from_user[0] : item.from_user,
      to_user: Array.isArray(item.to_user) ? item.to_user[0] : item.to_user,
    }));
    return mapped as PaymentHistoryItem[];
  }
} 