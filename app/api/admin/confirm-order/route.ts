import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { deliverResult } from '@/lib/deliverResult';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type StoredAnalysis = { seasonName: string; imageUrl?: string };

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  if (!email || email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL)
    return Response.json({ error: 'Forbidden' }, { status: 403 });

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
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('id', order.id);
  }

  await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null, { force: true });

  return Response.json({ success: true, email: order.email });
}
