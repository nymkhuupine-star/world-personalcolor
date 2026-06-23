import { deliverResult } from '@/lib/deliverResult';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

type StoredAnalysis = { seasonName: string; imageUrl?: string };

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  try {
    const { orderId } = await req.json().catch(() => ({})) as { orderId?: string };
    if (!orderId)
      return Response.json({ error: 'orderId шаардлагатай.' }, { status: 400 });

    const { data: order, error } = await supabase
      .from('analysis_orders')
      .select('id, email, analysis_result, paid')
      .eq('id', orderId)
      .single();

    if (error || !order)
      return Response.json({ error: 'Захиалга олдсонгүй.' }, { status: 404 });

    if (!order.paid)
      return Response.json({ error: 'Төлбөр баталгаажаагүй байна.' }, { status: 400 });

    const stored = order.analysis_result as StoredAnalysis | null;
    if (!stored?.seasonName || !order.email)
      return Response.json({ error: 'Мэдээлэл дутуу байна.' }, { status: 400 });

    await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null, { force: true });

    await supabase
      .from('analysis_orders')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', orderId);

    return Response.json({ success: true });
  } catch (err) {
    console.error('request-email error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
