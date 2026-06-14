import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Dashboard from './Dashboard';
import AdminLogin from './AdminLogin';
import type { Order, Analysis } from './types';

export default async function ControlPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const secret = process.env.ADMIN_SECRET;

  if (!secret || token !== secret) {
    return <AdminLogin />;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Серверт параллель татна — browser хүлээхгүй
  const [ordersRes, analysesRes] = await Promise.all([
    supabase
      .from('analysis_orders')
      .select('id,email,amount,paid,paid_at,created_at,admin_confirmed,analysis_result->seasonName')
      .order('created_at', { ascending: false })
      .limit(300),
    supabase
      .from('analyses')
      .select('id,email,season,sub_type,email_sent,paid,created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const rawOrders = (ordersRes.data ?? []) as Record<string, unknown>[];
  const orders: Order[] = rawOrders.map(o => ({
    id: o.id as string,
    email: o.email as string,
    amount: o.amount as number,
    paid: o.paid as boolean,
    paid_at: o.paid_at as string | null,
    created_at: o.created_at as string,
    admin_confirmed: o.admin_confirmed as boolean | null,
    invoice_id: null,
    transaction_id: null,
    analysis_result: o.seasonName ? { seasonName: o.seasonName as string } : null,
  }));

  return (
    <Dashboard
      initialOrders={orders}
      initialAnalyses={(analysesRes.data ?? []) as Analysis[]}
    />
  );
}
