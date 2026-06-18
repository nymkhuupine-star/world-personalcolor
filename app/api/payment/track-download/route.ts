import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
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
