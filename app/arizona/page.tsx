import { createClient } from '@supabase/supabase-js';
import { isAdminUser } from '@/lib/admin-auth';
import Dashboard from './Dashboard';
import Unauthorized from './Unauthorized';
import type { Order, Analysis } from './types';
import { ORDERS_FETCH_LIMIT } from './utils';

export default async function ControlPage() {
  if (!(await isAdminUser())) {
    return <Unauthorized />;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Серверт параллель татна — browser хүлээхгүй
  const [ordersRes, analysesRes] = await Promise.all([
    supabase
      .from('analysis_orders')
      .select('id,email,amount,paid,paid_at,created_at,admin_confirmed,email_sent_at,pdf_downloaded_at,analysis_result->seasonName')
      .order('created_at', { ascending: false })
      .limit(ORDERS_FETCH_LIMIT),
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
    email_sent_at: o.email_sent_at as string | null,
    pdf_downloaded_at: o.pdf_downloaded_at as string | null,
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
