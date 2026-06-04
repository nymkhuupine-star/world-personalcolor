import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { deliverResult } from '@/lib/deliverResult';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const SESSION_DAYS = 7;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { email?: unknown; code?: unknown };
    const { email, code } = body;

    if (typeof email !== 'string' || !isEmail(email))
      return Response.json({ error: 'Зөв имэйл хаяг оруулна уу.' }, { status: 400 });
    if (typeof code !== 'string' || !/^\d{6}$/.test(code))
      return Response.json({ error: 'Код буруу байна.' }, { status: 400 });

    const now = new Date().toISOString();
    const { data: codeRow, error: codeErr } = await supabase
      .from('verification_codes')
      .select('id')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (codeErr || !codeRow)
      return Response.json({ error: 'Код буруу эсвэл хугацаа дууссан байна.' }, { status: 400 });

    await supabase.from('verification_codes').update({ used: true }).eq('id', codeRow.id);

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('sessions').insert({ token, email, expires_at: expiresAt });

    // Deliver any paid-but-undelivered orders for this email
    // This ensures email arrives regardless of which browser was used for payment
    await processPendingOrders(email);

    const { data: analyses, error: analysesErr } = await supabase
      .from('analyses')
      .select('id, season, sub_type, reasoning, recommended_colors, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (analysesErr)
      return Response.json({ error: 'Үр дүн татахад алдаа гарлаа.' }, { status: 500 });

    return Response.json({ success: true, token, analyses: analyses ?? [] });
  } catch (err) {
    console.error('check-code error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}

async function processPendingOrders(email: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: paidOrders } = await supabase
    .from('analysis_orders')
    .select('id, analysis_result, paid_at')
    .eq('email', email)
    .eq('paid', true)
    .gte('paid_at', thirtyDaysAgo)
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: false })
    .limit(10);

  if (!paidOrders?.length) return;

  for (const order of paidOrders) {
    const stored = order.analysis_result as { seasonName?: string; imageUrl?: string } | null;
    if (!stored?.seasonName || !order.paid_at) continue;

    // Check if email was already delivered after this payment
    const { count } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .eq('email_sent', true)
      .gte('created_at', order.paid_at);

    if (!count || count === 0) {
      await deliverResult(email, stored.seasonName, stored.imageUrl ?? null).catch(
        (err) => console.error('processPendingOrders deliverResult error:', err),
      );
    }
  }
}
