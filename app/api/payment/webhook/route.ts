import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { deliverResult } from '@/lib/deliverResult';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function verifyChecksum(rawBody: string, headerValue: string): boolean {
  const key = process.env.BONUM_MERCHANT_CHECKSUM_KEY;
  if (!key) return true;
  const computed = createHmac('sha256', Buffer.from(key, 'utf8'))
    .update(rawBody, 'utf8')
    .digest('hex');
  return computed === headerValue;
}

type BonumWebhook = {
  type:   string;
  status: string;
  body: {
    amount:        number;
    currency:      string;
    completedAt:   string;
    terminalId:    string;
    invoiceId:     string;
    paymentVendor: string;
  };
};

type StoredAnalysis = { seasonName: string; imageUrl?: string };

export async function POST(req: Request) {
  try {
    // TODO: verify HMAC signature using BONUM_MERCHANT_CHECKSUM_KEY
    // once Bonum documents their webhook signing scheme.
    const rawBody = await req.text().catch(() => '');
    const checksumHeader = req.headers.get('x-checksum-v2');

    if (checksumHeader && !verifyChecksum(rawBody, checksumHeader)) {
      console.error('webhook: invalid checksum');
      return Response.json({ error: 'Invalid checksum' }, { status: 401 });
    }

    const payload = rawBody ? JSON.parse(rawBody) as BonumWebhook : null;

    if (!payload || payload.type !== 'PAYMENT' || payload.status !== 'SUCCESS')
      return Response.json({ received: true });

    const { invoiceId, completedAt } = payload.body;
    if (!invoiceId)
      return Response.json({ error: 'invoiceId missing' }, { status: 400 });

    const { data: order, error: findErr } = await supabase
      .from('analysis_orders')
      .select('id, paid, email, analysis_result')
      .eq('invoice_id', invoiceId)
      .single();

    if (findErr || !order)
      return Response.json({ error: 'Order not found' }, { status: 404 });

    if (order.paid)
      return Response.json({ received: true });

    const paidAt = completedAt
      ? new Date(completedAt.replace(' ', 'T')).toISOString()
      : new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('analysis_orders')
      .update({ paid: true, paid_at: paidAt })
      .eq('id', order.id);

    if (updateErr) {
      console.error('webhook update error:', updateErr);
      return Response.json({ error: 'Update failed' }, { status: 500 });
    }

    const stored = order.analysis_result as StoredAnalysis | null;
    if (stored?.seasonName && order.email) {
      await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null).catch(
        (err) => console.error('deliverResult error:', err),
      );
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('payment/webhook error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
