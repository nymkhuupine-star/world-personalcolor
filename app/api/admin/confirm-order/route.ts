import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { deliverResult } from '@/lib/deliverResult';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type StoredAnalysis = { seasonName: string; imageUrl?: string };

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return !!process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET;
}

export async function POST(req: Request) {
  if (!await requireAdmin())
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await req.json().catch(() => ({})) as { orderId?: string };
  if (!orderId) return Response.json({ error: 'orderId шаардлагатай.' }, { status: 400 });

  const { data: order, error } = await supabase
    .from('analysis_orders')
    .select('id, email, analysis_result, paid')
    .eq('id', orderId)
    .single();

  if (error || !order)
    return Response.json({ error: 'Order олдсонгүй.' }, { status: 404 });

  const stored = order.analysis_result as StoredAnalysis | null;
  if (!stored?.seasonName || !order.email)
    return Response.json({ error: 'analysis_result эсвэл email байхгүй.' }, { status: 400 });

  if (!order.paid) {
    await supabase
      .from('analysis_orders')
      .update({ paid: true, paid_at: new Date().toISOString(), admin_confirmed: true })
      .eq('id', order.id);
  }

  await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null, { force: true });

  return Response.json({ success: true, email: order.email });
}
