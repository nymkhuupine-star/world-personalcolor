import { deliverResult } from '@/lib/deliverResult';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

type StoredAnalysis = { seasonName: string; imageUrl?: string };

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdmin();

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
