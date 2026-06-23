import { deliverResult } from '@/lib/deliverResult';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

type StoredAnalysis = { seasonName: string; imageUrl?: string };

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { invoiceId?: string; orderId?: string };
  const { invoiceId, orderId } = body;

  if (!invoiceId && !orderId)
    return Response.json({ error: 'invoiceId эсвэл orderId шаардлагатай.' }, { status: 400 });

  const query = supabase
    .from('analysis_orders')
    .select('id, email, analysis_result, paid, paid_at');

  const { data: order, error } = invoiceId
    ? await query.eq('invoice_id', invoiceId).single()
    : await query.eq('id', orderId).single();

  if (error || !order)
    return Response.json({ error: 'Order олдсонгүй.' }, { status: 404 });

  const stored = order.analysis_result as StoredAnalysis | null;
  if (!stored?.seasonName || !order.email)
    return Response.json({ error: 'analysis_result эсвэл email байхгүй.' }, { status: 400 });

  try {
    await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null, { force: true });

    if (!order.paid) {
      await supabase
        .from('analysis_orders')
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq('id', order.id);
    }

    return Response.json({ success: true, email: order.email, season: stored.seasonName });
  } catch (err) {
    console.error('resend-order error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
