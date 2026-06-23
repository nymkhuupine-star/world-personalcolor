import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  try {
    const { orderId } = await req.json().catch(() => ({})) as { orderId?: string };
    if (!orderId) return Response.json({ ok: false }, { status: 400 });

    await supabase
      .from('analysis_orders')
      .update({ pdf_downloaded_at: new Date().toISOString() })
      .eq('id', orderId);

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
