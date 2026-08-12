import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('analysis_orders')
    .select('id, email, analysis_result, invoice_id, transaction_id, amount, paid, paid_at, created_at, admin_confirmed, email_sent_at, pdf_downloaded_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
