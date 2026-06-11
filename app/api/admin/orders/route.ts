import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return !!process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET;
}

export async function GET() {
  if (!await requireAdmin())
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('analysis_orders')
    .select('id, email, analysis_result, invoice_id, amount, paid, paid_at, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
