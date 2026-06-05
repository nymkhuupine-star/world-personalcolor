import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { deliverResult } from '@/lib/deliverResult';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Bonum sends the HMAC-SHA256 of the raw request body in x-checksum-v2.
function verifyChecksum(rawBody: string, headerValue: string): boolean {
  const key = process.env.BONUM_MERCHANT_CHECKSUM_KEY;
  if (!key) {
    console.warn('webhook: BONUM_MERCHANT_CHECKSUM_KEY not set — accepting without signature validation');
    return true;
  }
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

// Statuses Bonum may send to indicate a completed payment
const BONUM_SUCCESS_STATUSES = new Set(['SUCCESS', 'PAID', 'COMPLETED']);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text().catch(() => '');
    const checksumHeader = req.headers.get('x-checksum-v2');

    if (checksumHeader && !verifyChecksum(rawBody, checksumHeader)) {
      console.error('webhook: invalid checksum');
      return Response.json({ error: 'Invalid checksum' }, { status: 401 });
    }

    const payload = rawBody ? JSON.parse(rawBody) as BonumWebhook : null;

    if (!payload || payload.type !== 'PAYMENT' || !BONUM_SUCCESS_STATUSES.has(payload.status))
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

    const paidAt = completedAt
      ? new Date(completedAt.replace(' ', 'T')).toISOString()
      : new Date().toISOString();

    // Atomic update: only proceeds if not yet marked paid.
    // This is race-condition safe against concurrent verify calls.
    const { data: updatedRows, error: updateErr } = await supabase
      .from('analysis_orders')
      .update({ paid: true, paid_at: paidAt })
      .eq('id', order.id)
      .eq('paid', false)
      .select('id');

    if (updateErr) {
      console.error('webhook update error:', updateErr);
      return Response.json({ error: 'Update failed' }, { status: 500 });
    }

    if (!updatedRows || updatedRows.length === 0) {
      // Another process (concurrent webhook or verify) already marked this paid.
      return Response.json({ received: true });
    }

    const stored = order.analysis_result as StoredAnalysis | null;
    if (stored?.seasonName && order.email) {
      await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null).catch(
        (err) => console.error('webhook: deliverResult error:', err),
      );
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('payment/webhook error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
